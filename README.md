# ai-trash-loop-frontend

Dashboard for [AI Trash-Loop](https://github.com/ai-trash-loop): add a GitHub repository, run an analysis, and browse
context-health findings (duplicates, broken links, stale paths) with file/line evidence and history.

Stack: React 18, TypeScript, Vite, React Router, Recharts, Vitest.

## Run
```bash
npm install
npm run dev          # http://localhost:5173, proxies /api to http://localhost:8000 (override with API_URL)
npm test             # unit/component tests
npm run build        # typecheck + production build
```
Start the [backend](https://github.com/ai-trash-loop/ai-trash-loop-backend) first.

## Types come from the backend, not from hand-copied interfaces
`npm run gen:types` regenerates `src/api/schema.ts` from the backend's `openapi.json`, which embeds the engine's
`AnalysisReport` schema. Regenerate after any backend or engine contract change; a type error then points at what broke.

## End-to-end check (real browser)
Runs the whole stack: UI, API, clone/analysis path, database. Uses system Chrome (set `CHROME_PATH` if not on macOS).
```bash
# terminal 1 (backend dir; local paths are for dev only)
ALLOW_LOCAL_PATHS=1 .venv/bin/uvicorn app.asgi:app
# terminal 2
npm run dev
# terminal 3
npm run e2e
```

## Pages
- `/` repositories, add form, latest result per repo
- `/repos/:id` run analysis (polls until done), history and findings-over-time chart
- `/analyses/:id` report: stats, charts, filterable findings with evidence and recommendations

Token figures are always labeled as estimates. Limitations: no auth, public repositories only, no pagination yet.
See [docs/adr/](docs/adr/).

MIT licensed.
