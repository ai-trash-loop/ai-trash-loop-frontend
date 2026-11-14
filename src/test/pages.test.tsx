import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard";
import { ReportPage } from "../pages/ReportPage";

function mockFetch(routes: Record<string, { status?: number; body: unknown }>) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    const r = routes[key];
    if (!r) throw new Error(`unmocked ${key}`);
    return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, statusText: "x", json: async () => r.body };
  }));
}
afterEach(() => vi.unstubAllGlobals());

test("Dashboard lists repositories with latest summary", async () => {
  mockFetch({
    "GET /api/v1/repositories": { body: [{ id: 1, name: "o/r", source: "https://github.com/o/r", kind: "github", created_at: "2026-01-01T00:00:00Z",
      latest_analysis: { id: 4, repository_id: 1, status: "succeeded", created_at: "2026-01-01T00:00:00Z",
        summary: { files_scanned: 12, findings_total: 3, est_tokens_total: 100, est_tokens_duplicated: 0, findings_by_type: {}, findings_by_severity: {} } } }] },
  });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(await screen.findByText("o/r")).toBeInTheDocument();
  expect(screen.getByText(/12 files/)).toBeInTheDocument();
  expect(screen.getByText("succeeded")).toBeInTheDocument();
});

test("Dashboard surfaces API validation errors when adding a repository", async () => {
  mockFetch({
    "GET /api/v1/repositories": { body: [] },
    "POST /api/v1/repositories": { status: 422, body: { detail: "Only https://github.com/<owner>/<repo> URLs are supported" } },
  });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await screen.findByText(/No repositories yet/);
  await userEvent.type(screen.getByLabelText("GitHub repository"), "https://evil.com/x/y");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Only https://github.com");
});

test("ReportPage renders stats, findings and filters by type", async () => {
  const f = (id: string, type: string) => ({ id, type, severity: "low", confidence: 1, method: "deterministic", summary: `${type} ${id}`,
    evidence: [{ file: "a.md", line_start: 1, line_end: 1, quote: "q" }], recommendation: null });
  mockFetch({
    "GET /api/v1/analyses/7": { body: { id: 7, repository_id: 1, status: "succeeded", created_at: "2026-01-01T00:00:00Z" } },
    "GET /api/v1/analyses/7/report": { body: { schema_version: "0.1.0", engine_version: "0", repo: { name: "o/r", commit_sha: "abcdef1234" },
      analyzed_at: "2026-01-01T00:00:00Z", context_files: [{ path: "CLAUDE.md", kind: "claude_md", token_estimate: 500, load_mode: "always" }],
      findings: [f("d1", "duplicate"), f("s1", "stale")], metrics: { files_scanned: 1, est_tokens_total: 500, est_tokens_duplicated: 40 } } },
  });
  render(<MemoryRouter initialEntries={["/analyses/7"]}><Routes><Route path="/analyses/:id" element={<ReportPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText("duplicate d1")).toBeInTheDocument();
  expect(screen.getByText("stale s1")).toBeInTheDocument();
  expect(screen.getByText("abcdef1")).toBeInTheDocument();
  expect(screen.getByText("Est. context size (tokens)")).toBeInTheDocument(); // token figures are always labeled as estimates
  await userEvent.selectOptions(screen.getByLabelText("Filter by type"), "stale");
  await waitFor(() => expect(screen.queryByText("duplicate d1")).not.toBeInTheDocument());
  expect(screen.getByText("stale s1")).toBeInTheDocument();
});
