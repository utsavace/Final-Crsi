// === FIBONACCI MODULE [2026-08-24] ===
// Mirrors DarvasTable.tsx. Darvas waits for price to rise through the box top;
// Fibonacci waits for price to fall back to the 50% retracement of the last leg,
// so "distance" here is how far the close must drop to trigger an entry.
import React, { useMemo, useState } from 'react';
import { FibResult } from '../types';
import { ChevronDown, ChevronUp, Search, Download, Eye, Flame, Star, TrendingUp, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const SURFACE = '#161b27';
const CARD    = '#1e2030';
const BORDER  = '#2a2d3a';
const BORDER2 = '#1a1d2a';
const CYAN    = '#06b6d4';
const TEXT    = '#f8fafc';
const MUTED   = '#cbd5e1';
const DIM     = '#94a3b8';
const MONO    = 'JetBrains Mono, monospace';

const TOP_N = 10;            // Top 10 Pending Entry Candidates
const BEST_PERFORMER_N = 15; // Top 15 all-time performers used for the badge
const MIN_WIN_RATE = 45;     // fib is a ~50% win-rate / high R:R system, so the gate is lower than Darvas
const MIN_TRADES = 7;        // and a minimum sample size of 7 backtest trades

type SortField = 'distanceToFib' | 'symbol' | 'lastClose' | 'winRate' | 'pf' | 'totalReturn' | 'trades' | 'avgReturn' | 'maxdd' | 'upMovePct';

export const FibTable: React.FC<{
  results: FibResult[];
  isScanning: boolean;
}> = ({ results, isScanning }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('distanceToFib');
  const [sortAsc, setSortAsc] = useState(true);

  const bestPerformerSymbols = useMemo(() => {
    const withTrades = results.filter(r => r.trades > 0);
    const top = [...withTrades].sort((a, b) => b.totalReturn - a.totalReturn).slice(0, BEST_PERFORMER_N);
    return new Set(top.map(r => r.symbol));
  }, [results]);

  // Pending entry candidates, filtered by win-rate & sample-size quality,
  // closest to the entry level first, capped at top 10
  const candidates = useMemo(() => {
    const pending = results.filter(r =>
      r.pending &&
      r.distanceToFib !== null &&
      r.winRate >= MIN_WIN_RATE &&
      r.trades >= MIN_TRADES
    );
    const sortedByDistance = [...pending].sort((a, b) => (a.distanceToFib as number) - (b.distanceToFib as number));
    return sortedByDistance.slice(0, TOP_N);
  }, [results]);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(f === 'distanceToFib' || f === 'symbol' || f === 'maxdd'); }
  };

  const filtered = candidates.filter(r => r.symbol.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    let va: any = a[sortField], vb: any = b[sortField];
    if (va == null) return 1; if (vb == null) return -1;
    if (typeof va === 'string') return sortAsc ? va.localeCompare(String(vb)) : String(vb).localeCompare(va);
    return sortAsc ? Number(va) - Number(vb) : Number(vb) - Number(va);
  });

  const exportCSV = () => {
    if (!sorted.length) return;
    const h = ['Symbol','Best Performer','Date','Close','Swing High','Swing Low','Up Move %','Fib 50% Level','Distance to Entry %','Target 3R','Risk %','Position Rs','Total Return %','Win%','PF','Trades','AvgReturn%','MaxDD%'];
    const rows = sorted.map(r => [
      r.symbol, bestPerformerSymbols.has(r.symbol) ? 'YES' : '', r.date, r.lastClose,
      r.swingHigh ?? '', r.swingLow ?? '', r.upMovePct ?? '', r.fibLevel ?? '',
      r.distanceToFib ?? '', r.targetLevel ?? '', r.riskPctPerShare ?? '', r.positionSize ?? '',
      r.totalReturn, r.winRate, r.pf, r.trades, r.avgReturn, r.maxdd,
    ]);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI([h, ...rows].map(x => x.join(',')).join('\n'));
    a.download = `fibonacci_pending_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const TH = ({ label, field, left }: { label: string; field?: SortField; left?: boolean }) => (
    <th onClick={() => field && handleSort(field)} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 500, color: field && sortField === field ? CYAN : DIM, textAlign: left ? 'left' : 'right', cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {field && <span style={{ opacity: 0.4, fontSize: 9 }}>↕</span>}
    </th>
  );

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(6,182,212,0.12)', color: CYAN, border: '1px solid rgba(6,182,212,0.3)',
          }}>
            <TrendingUp size={13} /> Top {TOP_N} pending entry candidates ({candidates.length}) — Win% ≥ {MIN_WIN_RATE}, Trades ≥ {MIN_TRADES}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol..." style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontFamily: MONO, color: '#94a3b8', width: 180, outline: 'none' }} />
          </div>
          <button onClick={exportCSV} disabled={!sorted.length} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', opacity: sorted.length ? 1 : 0.3 }}>
            <Download size={13} color={CYAN} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
            <thead>
              <tr style={{ background: '#0d1018', borderBottom: `1px solid ${BORDER}` }}>
                <TH label="Ticker" field="symbol" left />
                <TH label="Date / Time" left />
                <TH label="Close" field="lastClose" />
                <TH label="Swing High" />
                <TH label="Swing Low" />
                <TH label="Up Move" field="upMovePct" />
                <TH label="Fib 50% Entry" />
                <TH label="Distance to Entry" field="distanceToFib" />
                <TH label="Target 3R" />
                <TH label="Position ₹" />
                <TH label="All-time Return" field="totalReturn" />
                <TH label="Win %" field="winRate" />
                <TH label="PF" field="pf" />
                <TH label="Trades" field="trades" />
                <TH label="Avg ret" field="avgReturn" />
                <TH label="Max DD" field="maxdd" />
                <TH label="Status" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ maxWidth: 340, margin: '0 auto' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        {isScanning ? <Flame size={20} color={CYAN} style={{ animation: 'pulse 1.5s infinite' }} /> : <Eye size={20} color={DIM} />}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6 }}>
                        {isScanning ? 'Scanning NSE universe for Fibonacci setups...' : 'Run a scan to see pending entry candidates'}
                      </div>
                      <div style={{ fontSize: 11, color: DIM, lineHeight: 1.6 }}>
                        {isScanning ? 'Detecting swing legs and distance to the 50% retracement' : `Leg confirmed (≥15% up-move, above 200 EMA), price still above the 50% level, and history shows Win% ≥ ${MIN_WIN_RATE} with at least ${MIN_TRADES} trades`}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : sorted.map(r => {
                const isExp = !!expanded[r.symbol];
                const isBest = bestPerformerSymbols.has(r.symbol);

                return (
                  <React.Fragment key={r.symbol}>
                    <tr onClick={() => setExpanded(p => ({ ...p, [r.symbol]: !p[r.symbol] }))} style={{ borderBottom: `1px solid ${BORDER2}`, cursor: 'pointer', background: isBest ? 'rgba(6,182,212,0.03)' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isBest ? 'rgba(6,182,212,0.07)' : '#1a1d2a')}
                      onMouseLeave={e => (e.currentTarget.style.background = isBest ? 'rgba(6,182,212,0.03)' : 'transparent')}>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontStyle: 'italic' }}>{r.symbol}</span>
                          {isBest && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 7px', borderRadius: 5, background: CYAN, color: '#000', fontWeight: 700, letterSpacing: '0.02em' }}>
                              <Star size={10} fill="#000" /> BEST PERFORMER
                            </span>
                          )}
                          <a href={`https://finance.yahoo.com/quote/${r.symbol}.NS`} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()} style={{ color: BORDER, display: 'flex' }}
                            onMouseEnter={e => (e.currentTarget.style.color = CYAN)}
                            onMouseLeave={e => (e.currentTarget.style.color = BORDER)}>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'left', fontFamily: MONO }}>
                        <div style={{ fontSize: 12, color: MUTED }}>{r.date}</div>
                        <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{r.timestamp}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>₹{r.lastClose.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: '#22c55e' }}>{r.swingHigh !== null ? `₹${r.swingHigh.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: '#ef4444' }}>{r.swingLow !== null ? `₹${r.swingLow.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: DIM }}>{r.upMovePct !== null ? `${r.upMovePct}%` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: CYAN }}>{r.fibLevel !== null ? `₹${r.fibLevel.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: r.distanceToFib !== null && r.distanceToFib < 2 ? CYAN : 'transparent', color: r.distanceToFib !== null && r.distanceToFib < 2 ? '#000' : MUTED }}>
                          {r.distanceToFib !== null ? `-${r.distanceToFib.toFixed(2)}%` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: '#22c55e' }}>{r.targetLevel !== null ? `₹${r.targetLevel.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>{r.positionSize !== null ? `₹${r.positionSize.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: r.totalReturn >= 0 ? '#22c55e' : '#ef4444' }}>{r.totalReturn >= 0 ? '+' : ''}{r.totalReturn}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: r.winRate >= 50 ? '#22c55e' : r.winRate >= 30 ? '#f59e0b' : '#ef4444' }}>{r.winRate}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: r.pf >= 2 ? '#22c55e' : '#f59e0b' }}>{r.pf}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: DIM }}>{r.trades}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: r.avgReturn >= 0 ? '#22c55e' : '#ef4444' }}>{r.avgReturn >= 0 ? '+' : ''}{r.avgReturn}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>-{r.maxdd}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORDER}`, color: DIM, fontWeight: 500 }}>PENDING</span>
                          {isExp ? <ChevronUp size={15} color={CYAN} /> : <ChevronDown size={15} color={DIM} />}
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <tr style={{ background: '#0d1018', borderBottom: `1px solid ${BORDER}` }}>
                        <td colSpan={17} style={{ padding: 20 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {r.positionSize !== null && (
                              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
                                <strong style={{ color: CYAN }}>Planned trade:</strong> place a buy limit at <strong style={{ color: CYAN }}>₹{r.fibLevel}</strong>
                                &nbsp;(the 50% retracement of a {r.upMovePct}% leg) for about <strong>₹{r.positionSize.toLocaleString('en-IN')}</strong>.
                                &nbsp;Stop-loss <strong style={{ color: '#ef4444' }}>₹{r.swingLow}</strong> ({r.riskPctPerShare}% risk) · target <strong style={{ color: '#22c55e' }}>₹{r.targetLevel}</strong> (3R) · force-exit after 70 bars.
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                              {[
                                ['Last close', `₹${r.lastClose}`, '#94a3b8', null],
                                ['Swing high', r.swingHigh !== null ? `₹${r.swingHigh}` : '—', '#22c55e', `Leg up-move ${r.upMovePct ?? '—'}%`],
                                ['Fib 50% entry', r.fibLevel !== null ? `₹${r.fibLevel}` : '—', CYAN, 'Buy limit level'],
                                ['Swing low', r.swingLow !== null ? `₹${r.swingLow}` : '—', '#ef4444', 'Stop-loss level'],
                                ['Score', `${r.wins}W / ${r.losses}L`, TEXT, `WR: ${r.winRate}% · PF: ${r.pf}`],
                              ].map(([label, val, color, sub]) => (
                                <div key={String(label)} style={{ padding: 12, borderRadius: 8, background: SURFACE, border: `1px solid ${BORDER}` }}>
                                  <div style={{ fontSize: 10, color: DIM, marginBottom: 6 }}>{label}</div>
                                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: String(color) }}>{val}</div>
                                  {sub && <div style={{ fontSize: 10, color: DIM, marginTop: 3 }}>{sub}</div>}
                                </div>
                              ))}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: TEXT }}>
                                  <TrendingUp size={13} color={CYAN} /> Last 15 backtest trades
                                </div>
                                <span style={{ fontSize: 10, fontFamily: MONO, color: DIM }}>Buy at 50% retracement · SL swing low · Target 3R · 70-bar max hold</span>
                              </div>
                              {r.allTrades?.length > 0 ? (
                                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: MONO }}>
                                    <thead>
                                      <tr style={{ background: '#0a0d14', borderBottom: `1px solid ${BORDER}` }}>
                                        {['Entry date','Exit date','Entry ₹','Exit ₹','Return %','Result'].map(h => (
                                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: DIM, fontWeight: 500 }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...r.allTrades].reverse().map((t, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid #13161f` }}>
                                          <td style={{ padding: '8px 12px', color: MUTED }}>{t.entryDate}</td>
                                          <td style={{ padding: '8px 12px', color: MUTED }}>{t.exitDate}</td>
                                          <td style={{ padding: '8px 12px', color: DIM }}>₹{t.entryPrice}</td>
                                          <td style={{ padding: '8px 12px', color: DIM }}>₹{t.exitPrice}</td>
                                          <td style={{ padding: '8px 12px', fontWeight: 700, color: t.win ? '#22c55e' : '#ef4444' }}>{t.win ? '+' : ''}{t.ret}%</td>
                                          <td style={{ padding: '8px 12px' }}>
                                            {t.win
                                              ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontWeight: 700 }}><CheckCircle size={12} /> WIN</span>
                                              : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 700 }}><XCircle size={12} /> LOSS</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: DIM, background: SURFACE, borderRadius: 8, border: `1px solid ${BORDER}` }}>No completed trades in recent window</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
