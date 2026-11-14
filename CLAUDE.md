# ai-trash-loop-frontend

## Purpose
Dashboard for AI Trash-Loop: connect a repo, start an analysis, view context-health findings, evidence and history.

## Responsibilities
- OWNS: UI and visualization only.
- DOES NOT: run analysis or call the engine. It uses the backend's documented API.

## Stack
React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts.

## Rules
- API and report types are generated from the engine's JSON Schema and the backend's OpenAPI spec; never hand-copy or invent them.
- Always show evidence (file, lines, quote) with a finding. Label token figures as estimates.
- Component tests for key views. Ask before major architectural decisions. Do not modify unrelated files.
- Decisions go in `docs/adr/`.
