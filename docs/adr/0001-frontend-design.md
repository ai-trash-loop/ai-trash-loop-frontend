# ADR 0001: Frontend design for the MVP

Status: Accepted

- **Types are generated** from the backend OpenAPI (which embeds the engine's report schema) with `openapi-typescript`; no
  hand-written API shapes. Contract drift shows up as a compile error.
- **Plain fetch + small hooks** instead of a data-fetching library: three pages and one polling hook do not justify the dependency yet.
- **Plain CSS with variables** (light and dark) instead of Tailwind; the UI is small.
- **Honest numbers:** token figures are labeled "Est." everywhere; the instruction-files chart excludes docs, which are read on demand and would swamp it.
- **Tests:** Vitest component/page tests with mocked fetch, plus `e2e/smoke.mjs` (real Chrome against the real backend).
