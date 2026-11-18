# NSE ConnorsRSI Screener

Express + Vite/React app. Data: Yahoo Finance daily candles (NSE, `.NS`), fetched server-side.

Modules (tabs): ConnorsRSI screener, BB+CRSI, Darvas Box, Fibonacci 50%, Weekly Rounding Bottom, CRSI Min Ever (top-5 lows).

- Dev: `npm install && npm run dev`
- Build: `npm run build` (vite + esbuild -> `dist/server.cjs`)
- Render: push to GitHub; `render.yaml` handles build/start.
- Type check: `npm run lint`

Educational use only. Not investment advice.
