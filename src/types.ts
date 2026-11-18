export interface TradeLog {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  ret: number;
  win: boolean;
}

export interface StockResult {
  symbol: string;
  date: string;
  timestamp: string;
  minCrsiEver: number | null;
  lastClose: number;
  crsiNow: number | null;
  adxNow: number | null;
  ema200Now: number | null;
  winRate: number;
  pf: number;
  avgReturn: number;
  maxdd: number;
  wins: number;
  losses: number;
  trades: number;
  isLive: boolean;
  // === POSITION-SIZING FEATURE START [2026-08-18] ===
  atrPct: number | null;       // ATR(14) as % of last close
  stopLoss: number | null;     // suggested stop-loss price = lastClose - 2xATR
  positionSize: number | null; // suggested Rs to deploy, based on capital & risk% from Settings
  maxExitDate: string | null;  // informational: entry-date + 70 calendar days
  // === POSITION-SIZING FEATURE END [2026-08-18] ===
  // BB + ConnorsRSI fields
  bbCrsiGate: boolean;
  bbCrsiLive: boolean;
  bbCrsiWr: number | null;
  bbCrsiPf: number | null;
  bbCrsiTrades: number;
  bbCrsiAvg: number | null;
  allTrades: TradeLog[];
}

export interface DarvasResult {
  symbol: string;
  date: string;
  timestamp: string;
  lastClose: number;
  boxTop: number | null;
  boxBottom: number | null;
  pending: boolean;
  distanceToBreakout: number | null; // % away from box top, only set when pending
  totalReturn: number;               // compounded historical return, used to rank best performers
  winRate: number;
  pf: number;
  avgReturn: number;
  maxdd: number;
  wins: number;
  losses: number;
  trades: number;
  allTrades: TradeLog[];
}

// === FIBONACCI MODULE START [2026-08-24] ===
export interface FibResult {
  symbol: string;
  date: string;
  timestamp: string;
  lastClose: number;
  swingHigh: number | null;          // top of the leg
  swingLow: number | null;           // bottom of the leg — also the stop-loss
  fibLevel: number | null;           // 50% retracement — the entry trigger
  targetLevel: number | null;        // 3R target
  upMovePct: number | null;          // size of the leg, %
  pending: boolean;                  // setup live, price still above the entry level
  distanceToFib: number | null;      // % close must fall to reach the entry level
  riskPctPerShare: number | null;    // entry -> stop distance, %
  positionSize: number | null;       // suggested ₹ from capital & risk% in Settings
  totalReturn: number;               // compounded historical return, used to rank best performers
  winRate: number;
  pf: number;
  avgReturn: number;
  maxdd: number;
  wins: number;
  losses: number;
  trades: number;
  allTrades: TradeLog[];
}
// === FIBONACCI MODULE END [2026-08-24] ===

export interface DarvasStats {
  universe: number;
  scanned: number;
  pendingCount: number;
  lastRunTime?: string;
}

export interface ScanProgress {
  scanned: number;
  total: number;
  currentSymbol: string;
}

export interface ScanStats {
  universe: number;
  scanned: number;
  gatePassed: number;
  liveSignalCount: number;
  lastRunTime?: string;
}

export type FilterMode = 'strict' | 'lenient';
// === WEEKLY ROUNDING BOTTOM + MIN CRSI EVER MODULES [2026-11-18] ===
export interface RoundingResult {
  symbol: string;
  date: string;
  timestamp: string;
  lastClose: number;
  window: number;            // weekly bars in the fitted window
  depth: number;             // % from rim to the lowest close
  ratio: number;             // last close / left rim
  r2: number;
  leftRim: number;
  bottomLow: number;
  startDate: string;
  stage: 'complete' | 'nearly complete' | 'forming';
}

export interface CrsiLowSide {
  now: number | null;        // CRSI right now
  nearest: number | null;    // the top-5 low closest to it
  nearestDate: string | null;
  gap: number | null;        // now - nearest
  match: boolean;            // |gap| <= tolerance
  top: { v: number; date: string | null }[]; // the 5 lowest readings (different episodes)
}

export interface CrsiLowResult {
  symbol: string;
  date: string;
  timestamp: string;
  lastClose: number;
  daily: CrsiLowSide;
  weekly: CrsiLowSide;
}
