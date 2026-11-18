// === WEEKLY ROUNDING BOTTOM + MIN CRSI EVER MODULES [2026-11-18] ===
// Small reusable SSE scan hook for the two new modules (same message protocol as /api/scan-darvas).
import { useRef, useState } from 'react';
import { ScanProgress } from '../types';

export function useSseScan<T>(path: string, defaultTotal: number) {
  const [results, setResults]   = useState<T[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({ scanned: 0, total: defaultTotal, currentSymbol: '' });
  const [lastRun, setLastRun]   = useState<string | undefined>(undefined);
  const [failed, setFailed] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const stop = () => {
    esRef.current?.close();
    esRef.current = null;
    setIsScanning(false);
  };

  const start = (query: string, total: number) => {
    if (isScanning) return;
    setResults([]);
    setFailed([]);
    setIsScanning(true);
    setProgress({ scanned: 0, total, currentSymbol: '' });

    const es = new EventSource(`${path}${query}`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'start') {
          setProgress(p => ({ ...p, total: msg.total }));
        } else if (msg.type === 'progress') {
          setProgress(p => ({ ...p, scanned: msg.i, total: msg.total, currentSymbol: msg.sym }));
        } else if (msg.type === 'result') {
          setResults(prev => [...prev, msg as T]);
        } else if (msg.type === 'done') {
          setFailed(Array.isArray(msg.failed) ? msg.failed : []);
          setIsScanning(false);
          es.close();
          esRef.current = null;
          setLastRun(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) { console.error('SSE error', err); }
    };
    es.onerror = () => { setIsScanning(false); esRef.current?.close(); esRef.current = null; };
  };

  const clear = (total: number) => {
    stop();
    setResults([]);
    setFailed([]);
    setProgress({ scanned: 0, total, currentSymbol: '' });
    setLastRun(undefined);
  };

  return { results, isScanning, progress, lastRun, failed, start, stop, clear };
}
