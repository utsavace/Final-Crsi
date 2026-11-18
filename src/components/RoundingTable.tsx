// === WEEKLY ROUNDING BOTTOM MODULE [2026-11-18] ===
import React, { useMemo, useState } from 'react';
import { RoundingResult } from '../types';
import { Search, Download, Eye, Flame, ExternalLink } from 'lucide-react';

const SURFACE = '#161b27';
const CARD    = '#1e2030';
const BORDER  = '#2a2d3a';
const BORDER2 = '#1a1d2a';
const TEAL    = '#14b8a6';
const TEXT    = '#f8fafc';
const MUTED   = '#cbd5e1';
const DIM     = '#94a3b8';
const MONO    = 'JetBrains Mono, monospace';

type SortField = 'symbol' | 'stage' | 'window' | 'depth' | 'ratio' | 'r2' | 'lastClose';
const STAGE_ORDER: Record<string, number> = { 'complete': 0, 'nearly complete': 1, 'forming': 2 };
const STAGE_COLOR: Record<string, string> = { 'complete': '#22c55e', 'nearly complete': '#f59e0b', 'forming': '#eab308' };

export const RoundingTable: React.FC<{ results: RoundingResult[]; isScanning: boolean }> = ({ results, isScanning }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('stage');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(f === 'symbol' || f === 'stage'); }
  };

  const sorted = useMemo(() => {
    const filtered = results.filter(r => r.symbol.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      let va: any = sortField === 'stage' ? STAGE_ORDER[a.stage] : (a as any)[sortField];
      let vb: any = sortField === 'stage' ? STAGE_ORDER[b.stage] : (b as any)[sortField];
      if (typeof va === 'string') return sortAsc ? va.localeCompare(String(vb)) : String(vb).localeCompare(va);
      return sortAsc ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });
  }, [results, search, sortField, sortAsc]);

  const exportCSV = () => {
    if (!sorted.length) return;
    const h = ['Symbol','Date','Close','Stage','Window (weeks)','Window start','Depth %','Close vs left rim %','Left rim','Bottom low','R2'];
    const rows = sorted.map(r => [r.symbol, r.date, r.lastClose, r.stage, r.window, r.startDate, r.depth, +(r.ratio * 100).toFixed(1), r.leftRim, r.bottomLow, r.r2]);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI([h, ...rows].map(x => x.join(',')).join('\n'));
    a.download = `weekly_rounding_bottom_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const TH = ({ label, field, left }: { label: string; field?: SortField; left?: boolean }) => (
    <th onClick={() => field && handleSort(field)} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 500, color: field && sortField === field ? TEAL : DIM, textAlign: left ? 'left' : 'right', cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {field && <span style={{ opacity: 0.4, fontSize: 9 }}>↕</span>}
    </th>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: TEAL, border: '1px solid rgba(20,184,166,0.3)' }}>
          Weekly rounding bottoms ({sorted.length}) — windows 26/40/60/90/130 weeks, R² ≥ 0.65
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol..." style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontFamily: MONO, color: '#94a3b8', width: 180, outline: 'none' }} />
          </div>
          <button onClick={exportCSV} disabled={!sorted.length} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', opacity: sorted.length ? 1 : 0.3 }}>
            <Download size={13} color={TEAL} /> Export
          </button>
        </div>
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#0d1018', borderBottom: `1px solid ${BORDER}` }}>
                <TH label="Ticker" field="symbol" left />
                <TH label="Date / Time" left />
                <TH label="Close" field="lastClose" />
                <TH label="Stage" field="stage" />
                <TH label="Window (weeks)" field="window" />
                <TH label="Depth" field="depth" />
                <TH label="Close vs left rim" field="ratio" />
                <TH label="Left rim" />
                <TH label="Bottom low" />
                <TH label="R²" field="r2" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ maxWidth: 360, margin: '0 auto' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        {isScanning ? <Flame size={20} color={TEAL} style={{ animation: 'pulse 1.5s infinite' }} /> : <Eye size={20} color={DIM} />}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6 }}>
                        {isScanning ? 'Scanning weekly charts for rounding bottoms...' : 'Run a scan to see weekly rounding bottoms'}
                      </div>
                      <div style={{ fontSize: 11, color: DIM, lineHeight: 1.6 }}>
                        Parabola (U-shape) fit on weekly closes, a single bottom, left and right rim within range, depth 8–70%. Includes the current (partial) week.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : sorted.map(r => (
                <tr key={r.symbol} style={{ borderBottom: `1px solid ${BORDER2}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1d2a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontStyle: 'italic' }}>{r.symbol}</span>
                      <a href={`https://finance.yahoo.com/quote/${r.symbol}.NS`} target="_blank" rel="noreferrer" style={{ color: BORDER, display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.color = TEAL)} onMouseLeave={e => (e.currentTarget.style.color = BORDER)}>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'left', fontFamily: MONO }}>
                    <div style={{ fontSize: 12, color: MUTED }}>{r.date}</div>
                    <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{r.timestamp}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>₹{r.lastClose.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, fontWeight: 700, border: `1px solid ${STAGE_COLOR[r.stage]}`, color: STAGE_COLOR[r.stage], textTransform: 'uppercase' }}>{r.stage}</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>{r.window}w <span style={{ color: DIM, fontSize: 10 }}>({r.startDate})</span></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>{r.depth}%</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: STAGE_COLOR[r.stage] }}>{(r.ratio * 100).toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: DIM }}>₹{r.leftRim.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: '#ef4444' }}>₹{r.bottomLow.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: DIM }}>{r.r2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
