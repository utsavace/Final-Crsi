// === WEEKLY ROUNDING BOTTOM + MIN-CRSI-EVER MODULES [2026-11-18] ===
// Pure helper functions (no I/O) used by /api/scan-rounding and /api/scan-crsi-low in server.ts.

export interface Bar { t: number; o: number; h: number; l: number; c: number; v?: number; }

// ─── Daily -> weekly resample (weeks start Monday, UTC date of the bar) ───
export function toWeekly(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  let curKey = '';
  for (const b of bars) {
    const d = new Date(b.t);
    const day = d.getUTCDay();                       // 0 = Sun
    const diff = (day + 6) % 7;                      // days since Monday
    const mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff);
    const key = String(mon);
    if (key !== curKey) {
      out.push({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v ?? 0 });
      curKey = key;
    } else {
      const w = out[out.length - 1];
      w.h = Math.max(w.h, b.h);
      w.l = Math.min(w.l, b.l);
      w.c = b.c;
      w.v = (w.v ?? 0) + (b.v ?? 0);
      w.t = b.t;
    }
  }
  return out;
}

// ─── Top-N lowest readings, each from a different episode ───
// Picks the lowest reading, then the next lowest that is at least `minGapDays`
// (calendar days) away from every reading already picked, and so on.
export interface LowReading { v: number; t: number; }

export function topLows(values: (number | null)[], times: number[], n = 5, minGapDays = 30): LowReading[] {
  const cand: LowReading[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null && Number.isFinite(v)) cand.push({ v, t: times[i] });
  }
  cand.sort((a, b) => a.v - b.v || a.t - b.t);
  const gapMs = minGapDays * 86400000;
  const picked: LowReading[] = [];
  for (const c of cand) {
    if (picked.every(p => Math.abs(p.t - c.t) >= gapMs)) {
      picked.push(c);
      if (picked.length === n) break;
    }
  }
  return picked;
}

export interface NearLow {
  now: number | null;
  nearest: number | null;       // top-5 reading closest to the current value
  nearestT: number | null;
  gap: number | null;           // now - nearest (negative = now is below that low)
  match: boolean;               // |gap| <= tolerance
  top: LowReading[];
}

export function nearTopLows(values: (number | null)[], times: number[], n = 5, minGapDays = 30, tol = 3): NearLow {
  const last = values.length - 1;
  const now = last >= 0 ? values[last] : null;
  const top = topLows(values, times, n, minGapDays);
  if (now === null || top.length === 0)
    return { now, nearest: null, nearestT: null, gap: null, match: false, top };
  let best = top[0];
  for (const p of top) if (Math.abs(p.v - now) < Math.abs(best.v - now)) best = p;
  const gap = now - best.v;
  return { now, nearest: best.v, nearestT: best.t, gap, match: Math.abs(gap) <= tol, top };
}

// ─── Weekly rounding bottom v4 — structure based (no fixed window sizes) ───
// Idea: find a single BOTTOM (lowest close of its neighbourhood), the LEFT RIM = a higher close to its left
// (every new record high scanning leftwards is a candidate), the RIGHT END = first close back at >= 97% of the rim
// (or the latest bar if the saucer is still forming, >= 80% of the rim). Each candidate is scored on
//   price : parabola fit R2 (free vertex, so asymmetric cups are fine), bottom position, right-leg pullback
//           (a deep pullback after the first rally = second bottom = rejected)
//   volume: 20-week MA of volume must fall from the left rim, bottom out in the middle, and recover on the right.
// Thresholds marked PROVISIONAL are not yet calibrated on the user's example charts.
export type RoundingStage = 'forming' | 'fresh' | 'retest' | 'extended';

export interface RoundingHit {
  window: number;       // weekly bars, rim -> right end
  depth: number;        // % (rim -> lowest close)
  ratio: number;        // last close / left rim (today)
  r2: number;
  leftRim: number;
  bottomLow: number;    // lowest low inside the structure
  startT: number;       // left rim bar
  endT: number;         // right end bar
  age: number;          // weeks since the right end
  stage: RoundingStage;
  tier: 'A' | 'B';
  score: number;        // 0..1
  volFall: number;      // volume-MA at the bottom / at the left rim (lower = drier)
  volRec: number;       // (right - bottom) / (left - bottom) of the volume-MA (higher = recovered)
  pullback: number;     // deepest pullback in the right leg, as a fraction of the rally so far
}

const N_MAX = 320;      // weekly bars looked at
const MAX_LEFT = 260;   // max distance rim -> bottom
const MAX_AGE = 60;     // structure must have ended within this many weeks
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

interface Cand {
  l: number; b: number; r: number; score: number; depth: number; pos: number; r2: number; pull: number;
  fall: number; rec: number; posV: number; botLow: number; stage: RoundingStage; tier: 'A' | 'B';
}

function metrics(cs: number[], vm: (number | null)[], l: number, b: number, r: number) {
  const L = r - l + 1;
  const R = cs[l], Bv = cs[b];
  const depth = ((R - Bv) / R) * 100;
  const pos = (b - l) / (L - 1);
  // free-vertex parabola fit
  let s2 = 0, s4 = 0, sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < L; i++) {
    const y = cs[l + i], x = (2 * i) / (L - 1) - 1, x2 = x * x;
    s2 += x2; s4 += x2 * x2; sy += y; sxy += x * y; sx2y += x2 * y;
  }
  const det = L * s4 - s2 * s2;
  const qa = (sy * s4 - s2 * sx2y) / det, qc = (L * sx2y - s2 * sy) / det, qb = sxy / s2;
  const mean = sy / L;
  let sse = 0, sst = 0;
  for (let i = 0; i < L; i++) {
    const y = cs[l + i], x = (2 * i) / (L - 1) - 1;
    const f = qa + qb * x + qc * x * x;
    sse += (y - f) ** 2; sst += (y - mean) ** 2;
  }
  const r2 = sst > 0 ? 1 - sse / sst : 0;
  // left side: a lower low that bounced 15%+ and was then undercut = more than one bottom
  let runMin = R, peak = R, broken = false;
  for (let i = l + 1; i <= b; i++) {
    const y = cs[i];
    if (y < runMin) { if (peak / runMin - 1 > 0.15) broken = true; runMin = y; peak = y; }
    else peak = Math.max(peak, y);
  }
  // right side: pullback after the rally has become meaningful (>= 25% of the depth)
  let runMax = Bv, pull = 0;
  const rngD = R - Bv;
  for (let i = b + 1; i <= r; i++) {
    runMax = Math.max(runMax, cs[i]);
    const rise = runMax - Bv;
    if (rise >= 0.25 * rngD) pull = Math.max(pull, (runMax - cs[i]) / rise);
  }
  // volume: 20-MA must fall (left -> bottom) and recover (bottom -> right)
  let iL = l;
  for (let i = l; i <= r; i++) if (vm[i] !== null) { iL = i; break; }
  const Lv = r - iL + 1;
  const k = Math.max(3, Math.round(0.1 * Lv));
  let fall = 1, rec = 0, posV = 0.5;
  if (vm[iL] !== null && Lv > 4 * k) {
    let sL = 0, sR = 0;
    for (let i = 0; i < k; i++) { sL += vm[iL + i] as number; sR += vm[r - i] as number; }
    const vmL = sL / k, vmR = sR / k;
    let vmB = Infinity, iB = iL;
    for (let i = iL + k; i <= r - k; i++) { const v = vm[i] as number; if (v < vmB) { vmB = v; iB = i; } }
    fall = vmL > 0 ? vmB / vmL : 1;
    rec = vmL > vmB ? (vmR - vmB) / (vmL - vmB) : 0;
    posV = (iB - iL) / (Lv - 1);
  }
  const sR2 = clamp01((r2 - 0.4) / 0.5);
  const sPos = 1 - Math.min(1, Math.abs(pos - 0.5) / 0.35);
  const sPull = 1 - Math.min(1, pull / 0.6);
  const sVol = posV >= 0.15 && posV <= 0.9 ? 0.5 * clamp01((1 - fall) / 0.4) + 0.5 * clamp01(rec / 0.8) : 0;
  const score = 0.30 * sR2 + 0.15 * sPos + 0.15 * sPull + 0.40 * sVol;
  const gates = depth >= 10 && depth <= 70 && L >= 20 && L <= 300 && pos >= 0.2 && pos <= 0.85 &&
    r2 >= 0.5 && pull <= 0.6 && !broken;
  return { depth, pos, r2, pull, fall, rec, posV, score, gates };
}

// All valid structures in the last N_MAX weeks (any age <= maxAge). Used by the screener and by tests.
export function roundingCandidates(weekly: Bar[], maxAge = MAX_AGE): Cand[] {
  const total = weekly.length;
  if (total < 60) return [];
  // 20-week MA of volume over the full history, then the last n bars are used (same as the Pine indicator)
  const vFull: (number | null)[] = weekly.map((_, i) => {
    if (i < 19) return null;
    let s = 0;
    for (let j = i - 19; j <= i; j++) s += weekly[j].v ?? 0;
    return s / 20;
  });
  const n = Math.min(total, N_MAX), off = total - n;
  const cs = weekly.slice(off).map(b => b.c);
  const lw = weekly.slice(off).map(b => b.l);
  const vm = vFull.slice(off);
  const out: Cand[] = [];
  for (let b = 20; b < n; b++) {
    const cb = cs[b];
    let isMin = true;
    for (let j = Math.max(0, b - 8); j <= Math.min(n - 1, b + 8); j++) {
      if (cs[j] < cb || (cs[j] === cb && j < b)) { isMin = false; break; }
    }
    if (!isMin) continue;
    let runMaxL = -1;
    for (let l = b - 1; l >= Math.max(0, b - MAX_LEFT); l--) {
      const cl = cs[l];
      if (cl <= runMaxL) continue;
      runMaxL = cl;
      const dq = (cl - cb) / cl;
      if (dq < 0.08 || dq > 0.75) continue;
      let r = -1;
      for (let i = b + 1; i < n; i++) if (cs[i] >= 0.97 * cl) { r = i; break; }
      if (r < 0 && n - 1 > b && cs[n - 1] >= 0.80 * cl) r = n - 1;
      if (r <= b) continue;
      const Lq = r - l + 1;
      if (Lq < 20 || Lq > 300) continue;
      const age = n - 1 - r;
      if (age > maxAge) continue;
      const m = metrics(cs, vm, l, b, r);
      if (!m.gates) continue;
      // saucer bottom low and "never undercut afterwards"
      let botLow = Infinity;
      for (let i = l; i <= r; i++) botLow = Math.min(botLow, lw[i]);
      let undercut = false;
      for (let i = r + 1; i < n; i++) if (lw[i] < botLow) { undercut = true; break; }
      if (undercut) continue;
      // stage from today's close vs the rim
      const ratioNow = cs[n - 1] / cl;
      let stage: RoundingStage;
      if (r === n - 1 && cs[r] < 0.97 * cl) stage = 'forming';
      else if (age <= 4) stage = 'fresh';
      else if (ratioNow > 1.10) stage = 'extended';
      else if (ratioNow >= 0.95) stage = 'retest';
      else continue;                                   // fell back well below the rim: failed
      // tier: PROVISIONAL volume thresholds
      let tier: 'A' | 'B' | null = null;
      if (m.score >= 0.70 && m.rec >= 0.6 && m.fall <= 0.8 && m.posV >= 0.2 && m.posV <= 0.85) tier = 'A';
      else if (m.score >= 0.55 && m.rec >= 0.4 && m.fall <= 0.9) tier = 'B';
      if (!tier) continue;
      out.push({ l, b, r, score: m.score, depth: m.depth, pos: m.pos, r2: m.r2, pull: m.pull,
        fall: m.fall, rec: m.rec, posV: m.posV, botLow, stage, tier });
    }
  }
  return out;
}

// Best structure of a stock. Among near-equal scores around the same bottom the DEEPER (more complete,
// outer-rim) structure wins, so the box covers the whole left leg and not just the lower part.
export function roundingBottomWeekly(weekly: Bar[]): RoundingHit | null {
  const cands = roundingCandidates(weekly);
  if (!cands.length) return null;
  let best = cands[0];
  for (const c of cands) if (c.score > best.score) best = c;
  let pick = best;
  for (const c of cands)
    if (Math.abs(c.b - best.b) <= 10 && c.score >= best.score - 0.08 && c.depth > pick.depth) pick = c;
  const total = weekly.length, n = Math.min(total, N_MAX), off = total - n;
  const bar = (i: number) => weekly[off + i];
  const last = weekly[total - 1].c, rim = bar(pick.l).c;
  return {
    window: pick.r - pick.l + 1, depth: +pick.depth.toFixed(1), ratio: +(last / rim).toFixed(3), r2: +pick.r2.toFixed(2),
    leftRim: +rim.toFixed(2), bottomLow: +pick.botLow.toFixed(2),
    startT: bar(pick.l).t, endT: bar(pick.r).t, age: n - 1 - pick.r, stage: pick.stage, tier: pick.tier,
    score: +pick.score.toFixed(2), volFall: +pick.fall.toFixed(2), volRec: +pick.rec.toFixed(2), pullback: +pick.pull.toFixed(2),
  };
}
