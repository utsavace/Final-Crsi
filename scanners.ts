// === WEEKLY ROUNDING BOTTOM + MIN-CRSI-EVER MODULES [2026-11-18] ===
// Pure helper functions (no I/O) used by /api/scan-rounding and /api/scan-crsi-low in server.ts.

export interface Bar { t: number; o: number; h: number; l: number; c: number; }

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
      out.push({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c });
      curKey = key;
    } else {
      const w = out[out.length - 1];
      w.h = Math.max(w.h, b.h);
      w.l = Math.min(w.l, b.l);
      w.c = b.c;
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

// ─── Weekly rounding bottom (same rules as the TradingView weekly scanner v3) ───
export interface RoundingHit {
  window: number;       // weekly bars
  depth: number;        // % (rim -> lowest close)
  ratio: number;        // last close / left rim
  r2: number;
  leftRim: number;
  bottomLow: number;    // lowest low inside the window
  startT: number;
  stage: 'complete' | 'nearly complete' | 'forming';
}

const WINDOWS = [26, 40, 60, 90, 130];

function detectWindow(closes: number[], lows: number[], L: number) {
  const n = closes.length;
  const s = n - L;                                   // first index of window
  let sx2 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < L; i++) {
    const y = closes[s + i];
    const x = (2 * i) / (L - 1) - 1;
    const x2 = x * x;
    sx2 += x2; sx4 += x2 * x2; sy += y; sxy += x * y; sx2y += x2 * y;
  }
  const det = L * sx4 - sx2 * sx2;
  const a = (sy * sx4 - sx2 * sx2y) / det;
  const c = (L * sx2y - sx2 * sy) / det;
  const b = sxy / sx2;
  const mean = sy / L;
  let sse = 0, sst = 0, minv = Infinity, mini = 0, botLow = Infinity;
  for (let i = 0; i < L; i++) {
    const y = closes[s + i];
    const x = (2 * i) / (L - 1) - 1;
    const f = a + b * x + c * x * x;
    sse += (y - f) ** 2;
    sst += (y - mean) ** 2;
    if (y < minv) { minv = y; mini = i; }
    botLow = Math.min(botLow, lows[s + i]);
  }
  // "one bottom only": an earlier low that bounced 15%+ and was then undercut is rejected
  let runMin = closes[s], peak = closes[s], broken = false;
  for (let i = 1; i <= mini; i++) {
    const y = closes[s + i];
    if (y < runMin) {
      if (peak / runMin - 1 > 0.15) broken = true;
      runMin = y; peak = y;
    } else peak = Math.max(peak, y);
  }
  const r2 = sst > 0 ? 1 - sse / sst : 0;
  const xv = c > 0 ? -b / (2 * c) : 99;
  const k = Math.max(3, Math.floor(L * 0.05));
  let lr = 0, rr = 0;
  for (let i = 0; i < k; i++) { lr += closes[s + i]; rr += closes[n - 1 - i]; }
  lr /= k; rr /= k;
  const mr = Math.min(lr, rr);
  const depth = ((mr - minv) / mr) * 100;
  const ratio = closes[n - 1] / lr;
  const ok = c > 0 && r2 >= 0.65 && xv > -0.6 && xv < 0.6 &&
    mini >= L * 0.25 && mini <= L * 0.75 && !broken &&
    rr / lr >= 0.80 && rr / lr <= 1.15 &&
    depth >= 8 && depth <= 70 && ratio >= 0.80 && ratio <= 1.15;
  return { ok, r2, depth, ratio, lr, botLow };
}

// Looks at the LAST weekly bar (current week included) and returns the first window that fits.
export function roundingBottomWeekly(weekly: Bar[]): RoundingHit | null {
  const closes = weekly.map(b => b.c);
  const lows = weekly.map(b => b.l);
  for (const L of WINDOWS) {
    if (closes.length < L + 5) continue;
    const r = detectWindow(closes, lows, L);
    if (r.ok) {
      const stage = r.ratio >= 1.0 ? 'complete' : r.ratio >= 0.93 ? 'nearly complete' : 'forming';
      return {
        window: L, depth: +r.depth.toFixed(1), ratio: +r.ratio.toFixed(3), r2: +r.r2.toFixed(2),
        leftRim: +r.lr.toFixed(2), bottomLow: +r.botLow.toFixed(2),
        startT: weekly[weekly.length - L].t, stage,
      };
    }
  }
  return null;
}
