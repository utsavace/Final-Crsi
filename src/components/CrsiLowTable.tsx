// === MIN CRSI EVER MODULE [2026-11-18] ===
import React, { useMemo, useState } from 'react';
import { CrsiLowResult, CrsiLowSide } from '../types';
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

type SortField = 'symbol' | 'dNow' | 'dGap' | 'wNow' | 'wGap' | 'lastClose';

const absGap = (s: CrsiLowSide) => (s.gap === null ? 999 : Math.abs(s.gap));
const sortVal = (r: CrsiLowResult, f: SortField): any => {
  switch (f) {
    case 'symbol': return r.symbol;
    case 'lastClose': return r.lastClose;
    case 'dNow': return r.daily.now ?? 999;
    case 'wNow': return r.weekly.now ?? 999;
    case 'dGap': return absGap(r.daily);
    case 'wGap': return absGap(r.weekly);
  }
};

const Side: React.FC<{ s: CrsiLowSide }> = ({ s }) => {
  const color = s.match ? '#22c55e' : DIM;
  return (
    <>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>{s.now ?? '—'}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>
        {s.nearest ?? '—'}
        {s.nearestDate && <div style={{ fontSize: 10, color: DIM }}>{s.nearestDate}</div>}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, fontWeight: 600, color }}>
        {s.gap === null ? '—' : (s.gap > 0 ? '+' : '') + s.gap}
        {s.match && <span style={{ marginLeft: 6, fontSize: 9, padding: '2px 5px', borderRadius: 4, border: '1px solid #22c55e' }}>MATCH</span>}
      </td>
    </>
  );
};

export const CrsiLowTable: React.FC<{ results: CrsiLowResult[]; isScanning: boolean }> = ({ results, isScanning }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('dGap');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(true); }
  };

  const sorted = useMemo(() => {
    const filtered = results.filter(r => r.symbol.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sortField), vb = sortVal(b, sortField);
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }, [results, search, sortField, sortAsc]);

  const exportCSV = () => {
    if (!sorted.length) return;
    const h = ['Symbol','Date','Close','D CRSI now','D nearest low','D low date','D gap','D match','W CRSI now','W nearest low','W low date','W gap','W match','D top5','W top5'];
    const rows = sorted.map(r => [r.symbol, r.date, r.lastClose,
      r.daily.now, r.daily.nearest, r.daily.nearestDate, r.daily.gap, r.daily.match,
      r.weekly.now, r.weekly.nearest, r.weekly.nearestDate, r.weekly.gap, r.weekly.match,
      '"' + r.daily.top.map(t => t.v).join(' | ') + '"', '"' + r.weekly.top.map(t => t.v).join(' | ') + '"']);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI([h, ...rows].map(x => x.join(',')).join('\n'));
    a.download = `crsi_min_ever_top5_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const TH = ({ label, field, left, group }: { label: string; field?: SortField; left?: boolean; group?: boolean }) => (
    <th onClick={() => field && handleSort(field)} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 500, color: field && sortField === field ? TEAL : DIM, textAlign: left ? 'left' : 'right', cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', borderLeft: group ? `1px solid ${BORDER}` : undefined }}>
      {label} {field && <span style={{ opacity: 0.4, fontSize: 9 }}>↕</span>}
    </th>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: TEAL, border: '1px solid rgba(20,184,166,0.3)' }}>
          CRSI near its all-time top-5 lows ({sorted.length}) — ±3 pts, lows ≥ 1 month apart
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: '#0d1018', borderBottom: `1px solid ${BORDER}` }}>
                <TH label="Ticker" field="symbol" left />
                <TH label="Close" field="lastClose" />
                <TH label="Daily CRSI now" field="dNow" group />
                <TH label="Daily nearest low" />
                <TH label="Daily gap" field="dGap" />
                <TH label="Weekly CRSI now" field="wNow" group />
                <TH label="Weekly nearest low" />
                <TH label="Weekly gap" field="wGap" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ maxWidth: 380, margin: '0 auto' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        {isScanning ? <Flame size={20} color={TEAL} style={{ animation: 'pulse 1.5s infinite' }} /> : <Eye size={20} color={DIM} />}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6 }}>
                        {isScanning ? 'Scanning ConnorsRSI history...' : 'Run a scan to see stocks near their CRSI lows'}
                      </div>
                      <div style={{ fontSize: 11, color: DIM, lineHeight: 1.6 }}>
                        Shows a stock if daily OR weekly CRSI(3,2,100) is within ±3 of one of its 5 lowest readings ever (each from a different episode).
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
                    <div style={{ fontSize: 10, color: DIM, fontFamily: MONO, marginTop: 2 }}>{r.date}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO, fontSize: 12, color: MUTED }}>₹{r.lastClose.toLocaleString('en-IN')}</td>
                  <Side s={r.daily} />
                  <Side s={r.weekly} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
