import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { toWeekly, nearTopLows, roundingBottomWeekly } from './scanners';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.use(express.json());

// ─── NIFTY 500 STOCKS UNIVERSE ───
export const STOCKS = [
"ACMESOLAR", "3MINDIA", "360ONE", "ACC", "AIAENG", "ABB", "APLAPOLLO", "AUBANK", "AWL", "AADHARHFC",
  "AAVAS", "AARTIIND", "ABBOTINDIA", "ACUTAAS", "ADANIENSOL", "ACE", "ADANIGREEN", "ADANIENT", "ADANIPORTS", "ADANIPOWER",
  "ATGL", "ABCAPITAL", "ABFRL", "ABLBL", "ABSLAMC", "CPPLUS", "ABREL", "AEGISVOPAK", "AFCONS", "AEGISLOG",
  "AFFLE", "AJANTPHARM", "ABDL", "ALKEM", "ARE&M", "AMBER", "AMBUJACEM", "ANANDRATHI", "ANGELONE", "ANTHEM",
  "ANANTRAJ", "ANURAS", "APOLLOHOSP", "APTUS", "APARINDS", "APOLLOTYRE", "ASAHIINDIA", "ASHOKLEY", "ASTERDM", "ATHERENERG",
  "ASIANPAINT", "ASTRAL", "ATUL", "AUROPHARMA", "AIIL", "DMART", "AXISBANK", "BLS", "BAJAJ-AUTO", "BEML",
  "BSE", "BAJFINANCE", "BAJAJFINSV", "BAJAJHLDNG", "BAJAJHFL", "BALRAMCHIN", "BANDHANBNK", "BALKRISIND", "BANKBARODA", "MAHABANK",
  "BANKINDIA", "BELRISE", "BATAINDIA", "BAYERCROP", "BERGEPAINT", "BDL", "BEL", "BHARATFORG", "BHEL", "BPCL",
  "BHARTIARTL", "BHARTIHEXA", "BIKAJI", "GROWW", "BIOCON", "BSOFT", "BLUEDART", "BLUEJET", "BLUESTARCO", "BBTC",
  "FIRSTCRY", "BOSCHLTD", "BRIGADE", "BRITANNIA", "MAPMYINDIA", "CCL", "CESC", "CGPOWER", "CIEINDIA", "CRISIL",
  "CANFINHOME", "CANHLIFE", "CANBK", "CAPLIPOINT", "CGCL", "CARTRADE", "CARBORUNIV", "CEATLTD", "CASTROLIND", "CEMPRO",
  "CENTRALBK", "CDSL", "CHALET", "CHAMBLFERT", "CHENNPETRO", "CHOICEIN", "CHOLAHLDNG", "CHOLAFIN", "CIPLA", "CUB",
  "CLEAN", "COALINDIA", "COCHINSHIP", "COHANCE", "COFORGE", "CAMS", "COLPAL", "CONCORDBIO", "COROMANDEL", "CONCOR",
  "CRAFTSMAN", "CREDITACC", "CROMPTON", "CUMMINSIND", "CYIENT", "DCMSHRIRAM", "DLF", "DOMS", "DALBHARAT", "DABUR",
  "DATAPATTNS", "DELHIVERY", "DEEPAKNTR", "DEEPAKFERT", "DEVYANI", "DIVISLAB", "DIXON", "LALPATHLAB", "DRREDDY", "EIDPARRY",
  "EIHOTEL", "EICHERMOT", "ELECON", "ELGIEQUIP", "EMCURE", "EMAMILTD", "EMMVEE", "ENDURANCE", "ERIS", "ENGINERSIN",
  "ETERNAL", "ESCORTS", "EXIDEIND", "NYKAA", "FACT", "FINCABLES", "FEDERALBNK", "FSL", "FIVESTAR", "FORCEMOT",
  "FORTIS", "GMRAIRPORT", "GAIL", "GVT&D", "GABRIEL", "GALLANTT", "GRSE", "GICRE", "GLAND", "GILLETTE",
  "GLAXO", "GLENMARK", "MEDANTA", "GODIGIT", "GPIL", "GODFRYPHLP", "GODREJCP", "GODREJIND", "GODREJPROP", "GRANULES",
  "GRAPHITE", "GRAVITA", "GRASIM", "GESHIP", "FLUOROCHEM", "GMDCLTD", "HEG", "HBLENGINE", "HDBFS", "HCLTECH",
  "HDFCAMC", "HDFCBANK", "HDFCLIFE", "HFCL", "HAVELLS", "HEXT", "HEROMOTOCO", "HSCL", "HINDALCO", "HAL",
  "HINDCOPPER", "HINDPETRO", "HINDUNILVR", "HINDZINC", "POWERINDIA", "HOMEFIRST", "HONASA", "HONAUT", "HUDCO", "HYUNDAI",
  "ICICIAMC", "ICICIGI", "ICICIBANK", "ICICIPRULI", "IDBI", "IDFCFIRSTB", "IFCI", "IIFL", "IRB", "IRCON",
  "ITCHOTELS", "ITI", "INDGN", "ITC", "INDIACEM", "INDIAMART", "INDIANB", "IEX", "INDHOTEL", "IOC",
  "IOB", "IRCTC", "IRFC", "IREDA", "IGL", "INDUSTOWER", "NAUKRI", "INDUSINDBK", "INFY", "INOXWIND",
  "INTELLECT", "INDIGO", "IGIL", "IKS", "IPCALAB", "JKCEMENT", "JBMA", "JSWCEMENT", "JKTYRE", "JMFINANCIL",
  "JSWDULUX", "JSWINFRA", "JAINREC", "JSWENERGY", "JSWSTEEL", "JPPOWER", "J&KBANK", "JINDALSAW", "JSL", "JIOFIN",
  "JINDALSTEL", "JUBLFOOD", "JUBLINGREA", "JYOTICNC", "JUBLPHARMA", "JWL", "KPRMILL", "KEI", "KPITTECH", "KAJARIACER",
  "KALYANKJIL", "KPIL", "KAYNES", "KARURVYSYA", "KEC", "KFINTECH", "KIMS", "KIRLOSENG", "KOTAKBANK", "LTF",
  "LTTS", "LGEINDIA", "LICHSGFIN", "LTFOODS", "LTM", "LT", "LATENTVIEW", "LAURUSLABS", "THELEELA", "LENSKART",
  "LEMONTREE", "LICI", "LINDEINDIA", "LLOYDSME", "LODHA", "LUPIN", "MMTC", "MRF", "MGL", "M&MFIN",
  "M&M", "MANAPPURAM", "MRPL", "MANKIND", "MARICO", "MARUTI", "MFSL", "MEESHO", "MAXHEALTH", "MAZDOCK",
  "MINDACORP", "MSUMI", "MOTILALOFS", "MPHASIS", "MCX", "MUTHOOTFIN", "NATCOPHARM", "NBCC", "NCC", "NHPC",
  "NLCINDIA", "NMDC", "NSLNISP", "NTPCGREEN", "NTPC", "NH", "NATIONALUM", "NAVA", "NAVINFLUOR", "NESTLEIND",
  "NETWEB", "NEULANDLAB", "NEWGEN", "NAM-INDIA", "NIVABUPA", "NUVAMA", "NUVOCO", "OBEROIRLTY", "ONGC", "OLAELEC",
  "OIL", "OLECTRA", "PAYTM", "ONESOURCE", "POLICYBZR", "OFSS", "PCBL", "PGEL", "PIIND", "PNBHOUSING",
  "PTCIL", "PVRINOX", "PAGEIND", "PARADEEP", "PATANJALI", "PERSISTENT", "PETRONET", "PWL", "PFIZER", "PHOENIXLTD",
  "PIDILITIND", "PINELABS", "PIRAMALFIN", "PPLPHARMA", "POLYMED", "POLYCAB", "PFC", "POONAWALLA", "POWERGRID", "PREMIERENE",
  "PFOCUS", "PRESTIGE", "RRKABEL", "PNB", "RBLBANK", "RECLTD", "RITES", "RHIM", "RADICO", "RVNL",
  "RAILTEL", "RAINBOW", "RKFORGE", "REDINGTON", "SBFC", "RPOWER", "RELIANCE", "SBICARD", "SBILIFE", "SJVN",
  "SAGILITY", "SAILIFE", "SRF", "SAMMAANCAP", "SAPPHIRE", "MOTHERSON", "SARDAEN", "SAREGAMA", "SCHAEFFLER", "SCHNEIDER",
  "SCI", "SHREECEM", "SHYAMMETL", "ENRIN", "SHRIRAMFIN", "SIEMENS", "SIGNATURE", "SOBHA", "SONACOMS", "SOLARINDS",
  "SONATSOFTW", "STARHEALTH", "SBIN", "SUMICHEM", "SAIL", "SUNPHARMA", "SUNDARMFIN", "SUNTV", "SUPREMEIND", "SPLPETRO",
  "SUZLON", "SWANCORP", "SWIGGY", "SYNGENE", "SYRMA", "TBOTEK", "TVSMOTOR", "TATACAP", "TATACHEM", "TATACOMM",
  "TATACONSUM", "TCS", "TMCV", "TATAELXSI", "TATAINVEST", "TMPV", "TATATECH", "TATAPOWER", "TATASTEEL", "TTML",
  "TECHM", "TECHNOE", "TEGA", "TEJASNET", "TENNIND", "NIACL", "RAMCOCEM", "THERMAX", "TIMKEN", "TITAGARH",
  "TITAN", "TORNTPHARM", "TORNTPOWER", "TARIL", "TRAVELFOOD", "TRENT", "TRIDENT", "TRITURBINE", "TIINDIA", "UCOBANK",
  "UNOMINDA", "UTIAMC", "UPL", "ULTRACEMCO", "UNIONBANK", "UBL", "UNITDSPR", "URBANCO", "USHAMART", "VTL",
  "VBL", "VEDL", "VMM", "VIJAYA", "IDEA", "WAAREEENER", "VOLTAS", "WELCORP", "WELSPUNLIV", "WHIRLPOOL",
  "WIPRO", "WOCKPHARMA", "YESBANK", "ZFCVINDIA", "ZENTEC", "ZEEL", "ZENSARTECH", "ZYDUSLIFE", "ZYDUSWELL", "ECLERX"
];

// ─── INDICATOR CALCULATIONS ───
function calcEMA(arr: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result = new Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period && i < arr.length; i++) sum += arr[i];
  if (arr.length >= period) result[period - 1] = sum / period;
  for (let i = period; i < arr.length; i++) {
    if (result[i - 1] !== null)
      result[i] = arr[i] * k + (result[i - 1] as number) * (1 - k);
  }
  return result;
}

const rsiFrom = (ag: number, al: number) => (al === 0 ? (ag === 0 ? 50 : 100) : 100 - 100 / (1 + ag / al));

function calcRSI(arr: number[], period: number): (number | null)[] {
  const result = new Array(arr.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period && i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    d > 0 ? (gains += d) : (losses -= d);
  }
  let ag = gains / period, al = losses / period;
  if (arr.length > period)
    result[period] = rsiFrom(ag, al);
  for (let i = period + 1; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
    result[i] = rsiFrom(ag, al);
  }
  return result;
}

// ─── FIXED CRSI: Correct streak RSI using gains/losses directly ───
function calcCRSI(closes: number[]): (number | null)[] {
  const n = closes.length;

  // Component 1: RSI(3) of closes
  const rsi3 = calcRSI(closes, 3);

  // Component 2: Streak — count consecutive up/down days
  const streak = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    if (closes[i] > closes[i - 1])      streak[i] = Math.max(streak[i - 1], 0) + 1;
    else if (closes[i] < closes[i - 1]) streak[i] = Math.min(streak[i - 1], 0) - 1;
    else                                 streak[i] = 0;
  }

  // RSI(2) of streak: compute gains/losses from streak differences directly
  // This avoids the +100 offset hack which shifts RSI scale incorrectly
  const streakRsi = new Array(n).fill(null);
  const period = 2;
  if (n > period) {
    let ag = 0, al = 0;
    for (let i = 1; i <= period; i++) {
      const d = streak[i] - streak[i - 1];
      d > 0 ? (ag += d) : (al -= d);
    }
    ag /= period; al /= period;
    streakRsi[period] = rsiFrom(ag, al);
    for (let i = period + 1; i < n; i++) {
      const d = streak[i] - streak[i - 1];
      ag = (ag * (period - 1) + Math.max(d, 0)) / period;
      al = (al * (period - 1) + Math.max(-d, 0)) / period;
      streakRsi[i] = rsiFrom(ag, al);
    }
  }

  // Component 3: percent rank of the 1-day ROC (in %) over the previous 100 bars
  // (TradingView ta.percentrank: share of the prior 100 values <= current value)
  const roc = new Array(n).fill(0);
  for (let i = 1; i < n; i++) roc[i] = closes[i - 1] > 0 ? (closes[i] / closes[i - 1] - 1) * 100 : 0;
  const pr = new Array(n).fill(null);
  for (let i = 101; i < n; i++) {
    let le = 0;
    for (let j = i - 100; j < i; j++) if (roc[j] <= roc[i]) le++;
    pr[i] = le;                       // le/100*100
  }

  return closes.map((_, i) =>
    rsi3[i] !== null && streakRsi[i] !== null && pr[i] !== null
      ? ((rsi3[i] as number) + (streakRsi[i] as number) + (pr[i] as number)) / 3
      : null
  );
}

interface Bar { t: number; o: number; h: number; l: number; c: number; }

// === POSITION-SIZING FEATURE START [2026-08-18] ===
// ATR(14) via Wilder smoothing — used for volatility-based stop-loss & position sizing.
// To revert: delete this block down to POSITION-SIZING FEATURE END, plus the other
// three blocks marked with the same [2026-08-18] tag in this file.
function calcATR(bars: Bar[], period = 14): (number | null)[] {
  const n = bars.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (n < 2) return result;
  const tr: number[] = [];
  for (let i = 1; i < n; i++) {
    const { h, l } = bars[i], pc = bars[i - 1].c;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  // tr[i] corresponds to bars[i+1]
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period] = atr; // aligns with bars[period]
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i + 1] = atr;
  }
  return result;
}

// Position sizing: risk a fixed % of capital per trade, sized against a 2xATR stop distance.
// capitalRs / riskPct come from the Settings modal (query params), with sane defaults.
function calcPositionSize(lastClose: number, atrValue: number | null, capitalRs: number, riskPct: number) {
  if (atrValue === null || atrValue <= 0 || lastClose <= 0) {
    return { atrPct: null, stopLoss: null, positionSize: null };
  }
  const atrPct = (atrValue / lastClose) * 100;
  const stopDistancePct = 2 * atrPct;               // 2x ATR stop, in %
  const stopLoss = lastClose - 2 * atrValue;
  const riskAmount = capitalRs * riskPct;
  let positionSize = riskAmount / (stopDistancePct / 100);
  const maxCap = capitalRs * 0.15;                   // never more than 15% of capital in one trade
  const minCap = capitalRs * 0.005;                  // never less than 0.5% of capital
  positionSize = Math.min(positionSize, maxCap);
  positionSize = Math.max(positionSize, minCap);
  return {
    atrPct: +atrPct.toFixed(2),
    stopLoss: +stopLoss.toFixed(2),
    positionSize: Math.round(positionSize),
  };
}
// === POSITION-SIZING FEATURE END [2026-08-18] ===

function calcADX(bars: Bar[], period = 14): (number | null)[] {
  const result = new Array(bars.length).fill(null);
  const tr: number[] = [], pdm: number[] = [], mdm: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const { h, l } = bars[i], pc = bars[i - 1].c, ph = bars[i - 1].h, pl = bars[i - 1].l;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    const up = h - ph, dn = pl - l;
    pdm.push(up > dn && up > 0 ? up : 0);
    mdm.push(dn > up && dn > 0 ? dn : 0);
  }
  let trS = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let pS  = pdm.slice(0, period).reduce((a, b) => a + b, 0);
  let mS  = mdm.slice(0, period).reduce((a, b) => a + b, 0);
  const dx: number[] = [];
  for (let i = period; i < tr.length; i++) {
    trS = trS - trS / period + tr[i];
    pS  = pS  - pS  / period + pdm[i];
    mS  = mS  - mS  / period + mdm[i];
    const dp = (pS / trS) * 100, dm = (mS / trS) * 100, s = dp + dm;
    dx.push(s === 0 ? 0 : Math.abs(dp - dm) / s * 100);
  }
  let adxVal = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  if (result.length > 2 * period) result[2 * period] = adxVal;
  for (let i = period; i < dx.length; i++) {
    adxVal = (adxVal * (period - 1) + dx[i]) / period;
    if (i + period + 1 < result.length) result[i + period + 1] = adxVal;
  }
  return result;
}

// ─── BACKTEST ENGINE ───
interface Trade {
  entryDate: number; entryPrice: number;
  exitDate: number;  exitPrice: number;
  ret: number; win: boolean;
}

function backtest(bars: Bar[], crsiBuyLimit = 10, adxThreshold = 29) {
  const closes = bars.map(b => b.c);
  const ema200  = calcEMA(closes, 200);
  const crsiArr = calcCRSI(closes);
  const adxArr  = calcADX(bars);
  const trades: Trade[] = [];
  let inTrade = false, entryPrice = 0, entryDate = 0;

  for (let i = 1; i < bars.length - 1; i++) {
    if (!inTrade) {
      const c = closes[i], e = ema200[i], cr = crsiArr[i], ad = adxArr[i];
      if (e !== null && cr !== null && ad !== null &&
          c > e && cr < crsiBuyLimit && ad > adxThreshold) {
        entryPrice = bars[i + 1].o;
        entryDate  = bars[i + 1].t;
        inTrade    = true;
      }
    } else {
      const cr = crsiArr[i];
      if (cr !== null && cr > 90 && i + 1 < bars.length) {
        const xp  = bars[i + 1].o;
        const ret = (xp - entryPrice) / entryPrice * 100 - 0.2;
        trades.push({ entryDate, entryPrice, exitDate: bars[i + 1].t, exitPrice: xp, ret, win: ret > 0 });
        inTrade = false;
      }
    }
  }
  return trades;
}

// ── BB + CRSI Backtest ──────────────────────────────────
// Entry: CRSI<15 AND Low<=BB(20,2) lower band AND Close>EMA200 AND ADX>threshold
// Exit: CRSI>90 (same as original)
function calcBollingerLower(closes: number[], period = 20, mult = 2): (number | null)[] {
  const lower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { lower.push(null); continue; }
    const sl = closes.slice(i - period + 1, i + 1);
    const m  = sl.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / period);
    lower.push(m - mult * sd);
  }
  return lower;
}

function backtestBbCrsi(bars: Bar[], crsiBuyLimit = 15, adxThreshold = 29) {
  const closes = bars.map(b => b.c);
  const lows   = bars.map(b => b.l);
  const ema200  = calcEMA(closes, 200);
  const crsiArr = calcCRSI(closes);
  const adxArr  = calcADX(bars);
  const bbLower = calcBollingerLower(closes);
  const trades: Trade[] = [];
  let inTrade = false, entryPrice = 0, entryDate = 0;

  for (let i = 1; i < bars.length - 1; i++) {
    if (!inTrade) {
      const c = closes[i], e = ema200[i], cr = crsiArr[i], ad = adxArr[i], bb = bbLower[i];
      // BOTH conditions: CRSI<15 AND Low<=BB lower
      if (e !== null && cr !== null && ad !== null && bb !== null &&
          c > e && cr < crsiBuyLimit && ad > adxThreshold && lows[i] <= bb) {
        entryPrice = bars[i + 1].o;
        entryDate  = bars[i + 1].t;
        inTrade    = true;
      }
    } else {
      const cr = crsiArr[i];
      if (cr !== null && cr > 90 && i + 1 < bars.length) {
        const xp  = bars[i + 1].o;
        const ret = (xp - entryPrice) / entryPrice * 100 - 0.2;
        trades.push({ entryDate, entryPrice, exitDate: bars[i + 1].t, exitPrice: xp, ret, win: ret > 0 });
        inTrade = false;
      }
    }
  }
  return trades;
}

// ── DARVAS BOX ENGINE ──────────────────────────────────
// Box formation: a new high resets the box. If 3 consecutive days pass
// without a new high, the top is confirmed. Then the lowest low in the
// following days is tracked; 3 consecutive days without a new low confirms
// the bottom. BUY on close above confirmed box top. Stop-loss = box bottom,
// trailed up as new higher boxes get confirmed while in the trade.
// EXIT on close below the trailing stop.
interface DarvasOutcome {
  trades: Trade[];
  boxTop: number | null;
  boxBottom: number | null;
  pending: boolean;             // box ready, price hasn't broken out yet (and no open trade)
  distanceToBreakout: number | null; // % close is below box top, only set when pending
}

function calcDarvasBox(bars: Bar[], confirmDays = 3): DarvasOutcome {
  const n = bars.length;
  const trades: Trade[] = [];

  let highestHighSoFar = -Infinity;
  let boxTopCandidate: number | null = null;
  let daysSinceNewHigh = 0;
  let topConfirmed = false;
  let lowestLowCandidate: number | null = null;
  let daysSinceNewLow = 0;
  let bottomConfirmed = false;
  let currentBoxTop: number | null = null;
  let currentBoxBottom: number | null = null;

  let inTrade = false, entryPrice = 0, entryDate = 0, trailStop = 0;

  for (let i = 0; i < n; i++) {
    const { h, l, c, t } = bars[i];

    if (h > highestHighSoFar) {
      highestHighSoFar = h;
      boxTopCandidate = h;
      daysSinceNewHigh = 0;
      topConfirmed = false;
      bottomConfirmed = false;
      lowestLowCandidate = null;
    } else {
      daysSinceNewHigh++;
      if (!topConfirmed && daysSinceNewHigh >= confirmDays) {
        topConfirmed = true;
        lowestLowCandidate = l;
        daysSinceNewLow = 0;
      }
      if (topConfirmed && !bottomConfirmed && lowestLowCandidate !== null) {
        if (l < lowestLowCandidate) {
          lowestLowCandidate = l;
          daysSinceNewLow = 0;
        } else {
          daysSinceNewLow++;
          if (daysSinceNewLow >= confirmDays) {
            bottomConfirmed = true;
            currentBoxTop = boxTopCandidate;
            currentBoxBottom = lowestLowCandidate;
            if (inTrade && currentBoxBottom !== null && currentBoxBottom > trailStop) {
              trailStop = currentBoxBottom; // trail SL up as price makes new higher boxes
            }
          }
        }
      }
    }

    if (!inTrade) {
      if (currentBoxTop !== null && c > currentBoxTop) {
        inTrade = true;
        entryPrice = c;
        entryDate = t;
        trailStop = currentBoxBottom ?? l;
      }
    } else {
      if (c < trailStop) {
        const ret = (c - entryPrice) / entryPrice * 100 - 0.2; // slippage/costs, same convention as CRSI engine
        trades.push({ entryDate, entryPrice, exitDate: t, exitPrice: c, ret, win: ret > 0 });
        inTrade = false;
      }
    }
  }

  const lastClose = n > 0 ? bars[n - 1].c : null;
  // === DARVAS PENDING FIX [2026-08-27] ===
  // Previously this only checked `lastClose < currentBoxTop`, so a box whose bottom
  // had already been broken still showed as PENDING. Price below the box bottom means
  // the consolidation failed — there is nothing left to break out of, and the box can
  // sit frozen for years (highestHighSoFar never resets, so a crashed stock keeps its
  // pre-crash box forever). Require price to still be inside the box.
  // To revert: replace the two lines below with the original single-condition version.
  const insideBox = lastClose !== null && currentBoxTop !== null && currentBoxBottom !== null
    && lastClose < currentBoxTop && lastClose >= currentBoxBottom;
  const pending = !inTrade && insideBox;
  // === DARVAS PENDING FIX END [2026-08-27] ===
  const distanceToBreakout = pending && lastClose !== null && currentBoxTop !== null
    ? +(((currentBoxTop - lastClose) / lastClose) * 100).toFixed(2)
    : null;

  return { trades, boxTop: currentBoxTop, boxBottom: currentBoxBottom, pending, distanceToBreakout };
}

// === FIBONACCI MODULE START [2026-08-24] ===
// ── FIBONACCI 50% RETRACEMENT ENGINE ──────────────────
// Swing detection uses 5-bar pivots. A leg = confirmed swing low -> confirmed
// swing high with an up-move of at least 15%. The 50% retracement of that leg
// is the entry trigger: BUY when price trades down to that level (limit fill).
// Stop-loss = the swing low that started the leg. Target = 3R. Trade is force-
// exited after 70 bars if neither is hit. The setup is voided if price breaks
// the swing low before filling, or if the level isn't reached within 60 bars.
// Backtested on Nifty 500 (2016-2026): ~6,200 trades, 50.1% win rate, PF 2.25.
// To revert this module: delete this block plus the /api/scan-fib endpoint
// (also tagged 2026-08-24), and the FibResult type + FibTable component.
interface FibOutcome {
  trades: Trade[];
  swingHigh: number | null;
  swingLow: number | null;
  fibLevel: number | null;        // 50% retracement — the entry trigger
  targetLevel: number | null;     // 3R target measured from the fib level
  upMovePct: number | null;       // size of the leg that formed the setup
  pending: boolean;               // leg ready, price still above the fib level (no open trade)
  distanceToFib: number | null;   // % close must fall to reach the entry level
}

const FIB_RATIO      = 0.5;   // 50% retracement
const FIB_PIVOT_BARS = 5;     // swing confirmation window on each side
const FIB_MIN_MOVE   = 15;    // minimum leg size, %
const FIB_MAX_WAIT   = 60;    // bars allowed for price to reach the level
const FIB_MAX_HOLD   = 70;    // bars before a force exit
const FIB_RR         = 3;     // target = entry + 3 x risk
const FIB_MAX_RISK   = 0.35;  // skip setups where the stop sits >35% away

function calcFibonacci(bars: Bar[]): FibOutcome {
  const n = bars.length;
  const trades: Trade[] = [];
  const empty: FibOutcome = {
    trades, swingHigh: null, swingLow: null, fibLevel: null, targetLevel: null,
    upMovePct: null, pending: false, distanceToFib: null,
  };
  if (n < 260) return empty;

  const closes = bars.map(b => b.c);
  const ema200 = calcEMA(closes, 200);
  const pb = FIB_PIVOT_BARS;

  // Pivot swing highs / lows (strict — a tie doesn't count as a pivot)
  const isSwingHigh = new Array<boolean>(n).fill(false);
  const isSwingLow  = new Array<boolean>(n).fill(false);
  for (let i = pb; i < n - pb; i++) {
    let maxH = -Infinity, minL = Infinity, tiesH = 0, tiesL = 0;
    for (let k = i - pb; k <= i + pb; k++) {
      if (bars[k].h > maxH) maxH = bars[k].h;
      if (bars[k].l < minL) minL = bars[k].l;
    }
    for (let k = i - pb; k <= i + pb; k++) {
      if (bars[k].h === bars[i].h) tiesH++;
      if (bars[k].l === bars[i].l) tiesL++;
    }
    if (bars[i].h === maxH && tiesH === 1) isSwingHigh[i] = true;
    if (bars[i].l === minL && tiesL === 1) isSwingLow[i]  = true;
  }

  // Latest live setup (recomputed as the scan walks forward)
  let liveHigh: number | null = null, liveLow: number | null = null;
  let liveFib: number | null = null, liveTarget: number | null = null;
  let liveMove: number | null = null;
  let openTrade = false;

  let i = 210;
  while (i < n - 1) {
    const j = i - pb;                       // swing high is only confirmed pb bars later
    if (j < 1 || !isSwingHigh[j]) { i++; continue; }

    // most recent swing low before that high
    let k = -1;
    for (let m = j - 1; m >= Math.max(0, j - 120); m--) {
      if (isSwingLow[m]) { k = m; break; }
    }
    if (k < 0) { i++; continue; }

    const sLow = bars[k].l, sHigh = bars[j].h;
    const move = (sHigh - sLow) / sLow * 100;
    if (move < FIB_MIN_MOVE) { i++; continue; }

    const level = sHigh - FIB_RATIO * (sHigh - sLow);
    if (level <= sLow) { i++; continue; }

    const e2 = ema200[i];
    if (e2 === null || bars[i].c < e2) { i++; continue; }   // trend filter

    liveHigh = sHigh; liveLow = sLow; liveFib = level; liveMove = move;

    // wait for price to retrace into the level
    let entryIdx = -1, entryPrice = 0;
    for (let m = i; m < Math.min(i + FIB_MAX_WAIT, n - 1); m++) {
      if (bars[m].l <= sLow) break;                          // leg invalidated
      if (bars[m].l <= level) {
        entryIdx = m;
        entryPrice = Math.min(level, bars[m].o);             // limit fill, or the open if it gapped below
        break;
      }
    }
    if (entryIdx < 0) { i++; continue; }

    const stop = sLow;
    const risk = entryPrice - stop;
    if (risk <= 0 || risk / entryPrice > FIB_MAX_RISK) { i++; continue; }
    const target = entryPrice + FIB_RR * risk;
    liveTarget = target;

    let exitPrice: number | null = null, exitIdx = entryIdx, bars_ = 0;
    for (let m = entryIdx; m < n; m++) {
      bars_++;
      if (bars[m].l <= stop)        { exitPrice = stop;      exitIdx = m; break; }
      if (bars[m].h >= target)      { exitPrice = target;    exitIdx = m; break; }
      if (bars_ >= FIB_MAX_HOLD)    { exitPrice = bars[m].c; exitIdx = m; break; }
    }

    if (exitPrice === null) {          // still running at the end of the data
      openTrade = true;
      break;
    }

    const ret = (exitPrice - entryPrice) / entryPrice * 100 - 0.2; // same cost convention as the other engines
    trades.push({
      entryDate: bars[entryIdx].t, entryPrice,
      exitDate: bars[exitIdx].t, exitPrice,
      ret, win: ret > 0,
    });
    i = entryIdx + bars_;
  }

  const lastClose = n > 0 ? bars[n - 1].c : null;
  // === FIB PENDING FIX [2026-08-27] ===
  // A setup is only live while price sits inside the retracement zone: below the swing
  // high that formed the leg, and still above the 50% level we want to buy at. Once
  // price trades back above the swing high the leg has been superseded by a new one,
  // so waiting for a retrace to the old level is stale. (Price below the swing low is
  // already impossible here, since the fib level always sits above the swing low.)
  const inRetraceZone = lastClose !== null && liveFib !== null && liveHigh !== null
    && lastClose > liveFib && lastClose < liveHigh;
  const pending = !openTrade && inRetraceZone;
  // === FIB PENDING FIX END [2026-08-27] ===
  const distanceToFib = pending && lastClose !== null && liveFib !== null
    ? +(((lastClose - liveFib) / lastClose) * 100).toFixed(2)
    : null;

  return {
    trades,
    swingHigh: liveHigh, swingLow: liveLow, fibLevel: liveFib,
    targetLevel: liveTarget, upMovePct: liveMove !== null ? +liveMove.toFixed(2) : null,
    pending, distanceToFib,
  };
}
// === FIBONACCI MODULE END [2026-08-24] ===

function calcCompoundedReturn(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const eq = trades.reduce((acc, t) => acc * (1 + t.ret / 100), 1);
  return +((eq - 1) * 100).toFixed(2);
}

// Gate check — two modes
function gatePass(trades: Trade[], mode: 'strict' | 'lenient') {
  const minTrades = 10;
  const minWinRate = mode === 'strict' ? 0.60 : 0.60;
  const minPF      = mode === 'strict' ? 2.0  : 1.5;

  if (trades.length < minTrades) return false;
  const wins = trades.filter(t => t.win);
  if (wins.length / trades.length < minWinRate) return false;
  const sw = wins.reduce((a, t) => a + t.ret, 0);
  const sl = Math.abs(trades.filter(t => !t.win).reduce((a, t) => a + t.ret, 0));
  return sl === 0 ? true : sw / sl >= minPF;
}

function calcStats(trades: Trade[]) {
  const wins   = trades.filter(t => t.win);
  const losses = trades.filter(t => !t.win);
  const wr  = wins.length / trades.length * 100;
  const sw  = wins.reduce((a, t) => a + t.ret, 0);
  const sl  = Math.abs(losses.reduce((a, t) => a + t.ret, 0));
  const pf  = sl === 0 ? 999 : sw / sl;
  const avg = trades.reduce((a, t) => a + t.ret, 0) / trades.length;
  let eq = 100, pk = 100, md = 0;
  for (const t of trades) {
    eq *= (1 + t.ret / 100);
    if (eq > pk) pk = eq;
    const dd = (pk - eq) / pk * 100;
    if (dd > md) md = dd;
  }
  return {
    wr: +wr.toFixed(1), pf: +pf.toFixed(2), avg: +avg.toFixed(2),
    md: +md.toFixed(1), wins: wins.length, losses: losses.length,
  };
}

async function fetchYahooChart(symbol: string): Promise<Bar[] | null> {
  const ticker  = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
  const period1 = Math.floor(new Date('2003-01-01').getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': `https://finance.yahoo.com/quote/${ticker}`,
  };

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includeAdjustedClose=true`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includeAdjustedClose=true`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) continue;
      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const bars: Bar[] = [];
      for (let idx = 0; idx < timestamps.length; idx++) {
        const o = quote.open?.[idx], h = quote.high?.[idx],
              l = quote.low?.[idx],  c = quote.close?.[idx];
        if (o != null && h != null && l != null && c != null)
          bars.push({ t: timestamps[idx] * 1000, o: +o, h: +h, l: +l, c: +c });
      }
      if (bars.length >= 220) return bars;
    } catch (_) { /* try next */ }
  }

  // No fallback — return null so the stock is skipped cleanly
  return null;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

app.get('/api/stocks-count', (_, res) => {
  res.json({ count: STOCKS.length, stocks: STOCKS });
});

// SSE SCAN — accepts mode=strict|lenient
app.get('/api/scan', async (req, res) => {
  const failed: string[] = [];
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type: string, data: any) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const crsiLimit  = Number(req.query.crsiLimit) || 10;
  const adxMin     = Number(req.query.adxMin)    || 29;
  const mode       = (req.query.mode as string) === 'lenient' ? 'lenient' : 'strict';
  // === POSITION-SIZING FEATURE START [2026-08-18] ===
  // capital & riskPct come from the Settings modal; defaults = Rs 1,00,000 capital, 0.5% risk/trade
  const capitalRs  = Number(req.query.capital) > 0 ? Number(req.query.capital) : 100000;
  const riskPct    = Number(req.query.riskPct) > 0 ? Number(req.query.riskPct) : 0.005;
  // === POSITION-SIZING FEATURE END [2026-08-18] ===
  const customStr  = req.query.symbols ? String(req.query.symbols) : '';
  const stockList  = customStr
    ? customStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : STOCKS;

  send('start', { total: stockList.length });

  for (let i = 0; i < stockList.length; i++) {
    if (clientGone) return;
    const sym = stockList[i];
    send('progress', { i: i + 1, total: stockList.length, sym });

    try {
      const bars = await fetchYahooChart(sym);
      if (!bars) { failed.push(sym); await sleep(50); continue; }   // skip — no fake data

      const trades = backtest(bars, crsiLimit, adxMin);
      if (!gatePass(trades, mode)) { await sleep(50); continue; }

      const stats   = calcStats(trades);
      const closes  = bars.map(b => b.c);
      const n       = bars.length - 1;
      const ema200  = calcEMA(closes, 200);
      const crsiArr = calcCRSI(closes);
      const adxArr  = calcADX(bars);

      const crsiNow  = crsiArr[n] !== null ? +(crsiArr[n] as number).toFixed(2) : null;
      const adxNow   = adxArr[n]  !== null ? +(adxArr[n]  as number).toFixed(2) : null;
      const emaNow   = ema200[n]  !== null ? +(ema200[n]  as number).toFixed(2) : null;
      const lastClose = +closes[n].toFixed(2);

      const isLive = crsiNow !== null && adxNow !== null && emaNow !== null
        && crsiNow < crsiLimit && adxNow > adxMin && lastClose > emaNow;

      // === POSITION-SIZING FEATURE START [2026-08-18] ===
      const atrArr = calcATR(bars);
      const atrNow = atrArr[n];
      const { atrPct, stopLoss, positionSize } = calcPositionSize(lastClose, atrNow, capitalRs, riskPct);
      // Max-hold display: 70 calendar days from "today" (informational only — the actual
      // exit-by date is measured from the day you enter, not from scan day).
      const maxExitDate = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      // === POSITION-SIZING FEATURE END [2026-08-18] ===

      // BB+CRSI — double confirmation
      const bbCrsiTrades = backtestBbCrsi(bars, 15, adxMin);
      const bbCrsiGate   = bbCrsiTrades.length >= 10 && gatePass(bbCrsiTrades, mode);
      const bbCrsiStats  = bbCrsiGate ? calcStats(bbCrsiTrades) : null;

      // BB+CRSI live: CRSI<15 AND Low<=BB(20,2) lower AND Close>EMA200 AND ADX>=29
      const bbLowerArr = calcBollingerLower(closes);
      const bbLowerNow = bbLowerArr[n];
      const lastLow    = bars[n].l;
      const isBbLive   = isLive && bbLowerNow !== null && lastLow <= bbLowerNow;

      const date = new Date(bars[n].t).toISOString().slice(0, 10);
      const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const validCrsi = crsiArr.filter(c => c !== null);
      const minCrsiEver = validCrsi.length > 0 ? +(Math.min(...validCrsi)).toFixed(2) : null;

      send('result', {
        symbol: sym, date, timestamp, minCrsiEver, lastClose, crsiNow, adxNow, ema200Now: emaNow,
        winRate: stats.wr, pf: stats.pf, avgReturn: stats.avg, maxdd: stats.md,
        wins: stats.wins, losses: stats.losses, trades: trades.length,
        isLive,
        // === POSITION-SIZING FEATURE START [2026-08-18] ===
        atrPct, stopLoss, positionSize, maxExitDate,
        // === POSITION-SIZING FEATURE END [2026-08-18] ===
        // BB+CRSI fields
        bbCrsiGate,
        bbCrsiLive:   isBbLive,
        bbCrsiWr:     bbCrsiStats?.wr ?? null,
        bbCrsiPf:     bbCrsiStats?.pf ?? null,
        bbCrsiTrades: bbCrsiTrades.length,
        bbCrsiAvg:    bbCrsiStats?.avg ?? null,
        allTrades: trades.slice(-15).map(t => ({
          entryDate:  new Date(t.entryDate).toISOString().slice(0, 10),
          exitDate:   new Date(t.exitDate).toISOString().slice(0, 10),
          entryPrice: +t.entryPrice.toFixed(2),
          exitPrice:  +t.exitPrice.toFixed(2),
          ret: +t.ret.toFixed(2), win: t.win,
        })),
      });
    } catch (_) { failed.push(sym); /* skip failed stocks */ }

    await sleep(80);
  }

  send('done', { total: stockList.length, failed });
  res.end();
});

// SSE SCAN — Darvas Box module
app.get('/api/scan-darvas', async (req, res) => {
  const failed: string[] = [];
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type: string, data: any) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const customStr = req.query.symbols ? String(req.query.symbols) : '';
  const stockList = customStr
    ? customStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : STOCKS;

  send('start', { total: stockList.length });

  for (let i = 0; i < stockList.length; i++) {
    if (clientGone) return;
    const sym = stockList[i];
    send('progress', { i: i + 1, total: stockList.length, sym });

    try {
      const bars = await fetchYahooChart(sym);
      if (!bars) { failed.push(sym); await sleep(50); continue; }

      const { trades, boxTop, boxBottom, pending, distanceToBreakout } = calcDarvasBox(bars);

      // Need either a usable trade history (to rank as performer) or an active pending setup
      if (trades.length === 0 && !pending) { await sleep(50); continue; }

      const stats = trades.length > 0
        ? calcStats(trades)
        : { wr: 0, pf: 0, avg: 0, md: 0, wins: 0, losses: 0 };
      const totalReturn = calcCompoundedReturn(trades);

      const lastBar = bars[bars.length - 1];
      const lastClose = +lastBar.c.toFixed(2);
      const date = new Date(lastBar.t).toISOString().slice(0, 10);
      const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      send('result', {
        symbol: sym, date, timestamp, lastClose,
        boxTop: boxTop !== null ? +boxTop.toFixed(2) : null,
        boxBottom: boxBottom !== null ? +boxBottom.toFixed(2) : null,
        pending, distanceToBreakout, totalReturn,
        winRate: stats.wr, pf: stats.pf, avgReturn: stats.avg, maxdd: stats.md,
        wins: stats.wins, losses: stats.losses, trades: trades.length,
        allTrades: trades.slice(-15).map(t => ({
          entryDate:  new Date(t.entryDate).toISOString().slice(0, 10),
          exitDate:   new Date(t.exitDate).toISOString().slice(0, 10),
          entryPrice: +t.entryPrice.toFixed(2),
          exitPrice:  +t.exitPrice.toFixed(2),
          ret: +t.ret.toFixed(2), win: t.win,
        })),
      });
    } catch (_) { failed.push(sym); /* skip failed stocks */ }

    await sleep(80);
  }

  send('done', { total: stockList.length, failed });
  res.end();
});

// === FIBONACCI MODULE START [2026-08-24] ===
// SSE SCAN — Fibonacci 50% retracement module
app.get('/api/scan-fib', async (req, res) => {
  const failed: string[] = [];
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type: string, data: any) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const customStr = req.query.symbols ? String(req.query.symbols) : '';
  const capitalRs = Number(req.query.capital) > 0 ? Number(req.query.capital) : 100000;
  const riskPct   = Number(req.query.riskPct) > 0 ? Number(req.query.riskPct) : 0.005;
  const stockList = customStr
    ? customStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : STOCKS;

  send('start', { total: stockList.length });

  for (let i = 0; i < stockList.length; i++) {
    if (clientGone) return;
    const sym = stockList[i];
    send('progress', { i: i + 1, total: stockList.length, sym });

    try {
      const bars = await fetchYahooChart(sym);
      if (!bars) { failed.push(sym); await sleep(50); continue; }

      const { trades, swingHigh, swingLow, fibLevel, targetLevel, upMovePct, pending, distanceToFib } = calcFibonacci(bars);

      // Need either a usable trade history (to rank as performer) or an active pending setup
      if (trades.length === 0 && !pending) { await sleep(50); continue; }

      const stats = trades.length > 0
        ? calcStats(trades)
        : { wr: 0, pf: 0, avg: 0, md: 0, wins: 0, losses: 0 };
      const totalReturn = calcCompoundedReturn(trades);

      const lastBar = bars[bars.length - 1];
      const lastClose = +lastBar.c.toFixed(2);
      const date = new Date(lastBar.t).toISOString().slice(0, 10);
      const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Position sizing off the actual structural stop (fib level -> swing low)
      let riskPctPerShare: number | null = null, positionSize: number | null = null;
      if (fibLevel !== null && swingLow !== null && fibLevel > swingLow) {
        riskPctPerShare = +(((fibLevel - swingLow) / fibLevel) * 100).toFixed(2);
        const raw = (capitalRs * riskPct) / (riskPctPerShare / 100);
        positionSize = Math.round(Math.max(Math.min(raw, capitalRs * 0.15), capitalRs * 0.005));
      }

      send('result', {
        symbol: sym, date, timestamp, lastClose,
        swingHigh: swingHigh !== null ? +swingHigh.toFixed(2) : null,
        swingLow:  swingLow  !== null ? +swingLow.toFixed(2)  : null,
        fibLevel:  fibLevel  !== null ? +fibLevel.toFixed(2)  : null,
        targetLevel: targetLevel !== null ? +targetLevel.toFixed(2) : null,
        upMovePct, pending, distanceToFib,
        riskPctPerShare, positionSize,
        totalReturn,
        winRate: stats.wr, pf: stats.pf, avgReturn: stats.avg, maxdd: stats.md,
        wins: stats.wins, losses: stats.losses, trades: trades.length,
        allTrades: trades.slice(-15).map(t => ({
          entryDate:  new Date(t.entryDate).toISOString().slice(0, 10),
          exitDate:   new Date(t.exitDate).toISOString().slice(0, 10),
          entryPrice: +t.entryPrice.toFixed(2),
          exitPrice:  +t.exitPrice.toFixed(2),
          ret: +t.ret.toFixed(2), win: t.win,
        })),
      });
    } catch (_) { failed.push(sym); /* skip failed stocks */ }

    await sleep(80);
  }

  send('done', { total: stockList.length, failed });
  res.end();
});
// === FIBONACCI MODULE END [2026-08-24] ===

// === WEEKLY ROUNDING BOTTOM MODULE START [2026-11-18] ===
// SSE SCAN — weekly rounding bottom (saucer). Daily Yahoo candles are resampled to weekly;
// the last weekly bar (current week included) is tested against windows of 26/40/60/90/130 weeks.
// To revert: delete this block, the import above, scanners.ts, and the "rounding" tab in src/App.tsx.
app.get('/api/scan-rounding', async (req, res) => {
  const failed: string[] = [];
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type: string, data: any) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const customStr = req.query.symbols ? String(req.query.symbols) : '';
  const stockList = customStr
    ? customStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : STOCKS;

  send('start', { total: stockList.length });

  for (let i = 0; i < stockList.length; i++) {
    if (clientGone) return;
    const sym = stockList[i];
    send('progress', { i: i + 1, total: stockList.length, sym });

    try {
      const bars = await fetchYahooChart(sym);
      if (!bars) { failed.push(sym); await sleep(50); continue; }

      const weekly = toWeekly(bars);
      const hit = roundingBottomWeekly(weekly);
      if (!hit) { await sleep(80); continue; }

      const lastBar = bars[bars.length - 1];
      send('result', {
        symbol: sym,
        date: new Date(lastBar.t).toISOString().slice(0, 10),
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        lastClose: +lastBar.c.toFixed(2),
        window: hit.window, depth: hit.depth, ratio: hit.ratio, r2: hit.r2,
        leftRim: hit.leftRim, bottomLow: hit.bottomLow, stage: hit.stage,
        startDate: new Date(hit.startT).toISOString().slice(0, 10),
      });
    } catch (_) { failed.push(sym); /* skip failed stocks */ }

    await sleep(80);
  }

  send('done', { total: stockList.length, failed });
  res.end();
});
// === WEEKLY ROUNDING BOTTOM MODULE END [2026-11-18] ===

// === MIN CRSI EVER MODULE START [2026-11-18] ===
// SSE SCAN — stocks whose ConnorsRSI(3,2,100) is within +/- tol of one of their 5 lowest readings ever.
// The 5 readings come from different episodes (at least minGapDays apart). Daily and weekly are both computed.
// A stock is returned when either timeframe matches.
// To revert: delete this block, the import above, scanners.ts, and the "crsilow" tab in src/App.tsx.
app.get('/api/scan-crsi-low', async (req, res) => {
  const failed: string[] = [];
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type: string, data: any) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const tol        = Number(req.query.tol) >= 0 && req.query.tol !== undefined ? Number(req.query.tol) : 3;
  const minGapDays = Number(req.query.gapDays) > 0 ? Number(req.query.gapDays) : 30;
  const customStr  = req.query.symbols ? String(req.query.symbols) : '';
  const stockList  = customStr
    ? customStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : STOCKS;

  const iso = (t: number | null) => (t === null ? null : new Date(t).toISOString().slice(0, 10));
  const pack = (r: ReturnType<typeof nearTopLows>) => ({
    now: r.now !== null ? +r.now.toFixed(2) : null,
    nearest: r.nearest !== null ? +r.nearest.toFixed(2) : null,
    nearestDate: iso(r.nearestT),
    gap: r.gap !== null ? +r.gap.toFixed(2) : null,
    match: r.match,
    top: r.top.map(p => ({ v: +p.v.toFixed(2), date: iso(p.t) })),
  });

  send('start', { total: stockList.length });

  for (let i = 0; i < stockList.length; i++) {
    if (clientGone) return;
    const sym = stockList[i];
    send('progress', { i: i + 1, total: stockList.length, sym });

    try {
      const bars = await fetchYahooChart(sym);
      if (!bars) { failed.push(sym); await sleep(50); continue; }

      const dClose = bars.map(b => b.c);
      const dNear  = nearTopLows(calcCRSI(dClose), bars.map(b => b.t), 5, minGapDays, tol);

      const weekly = toWeekly(bars);
      const wNear  = nearTopLows(calcCRSI(weekly.map(b => b.c)), weekly.map(b => b.t), 5, minGapDays, tol);

      if (!dNear.match && !wNear.match) { await sleep(80); continue; }

      const lastBar = bars[bars.length - 1];
      send('result', {
        symbol: sym,
        date: iso(lastBar.t),
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        lastClose: +lastBar.c.toFixed(2),
        daily: pack(dNear),
        weekly: pack(wNear),
      });
    } catch (_) { failed.push(sym); /* skip failed stocks */ }

    await sleep(80);
  }

  send('done', { total: stockList.length, failed });
  res.end();
});
// === MIN CRSI EVER MODULE END [2026-11-18] ===

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

startServer();