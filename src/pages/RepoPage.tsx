import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type Analysis, type Repository } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { useAnalysisPolling } from "../hooks/useAnalysisPolling";
import { formatDate } from "../lib/format";

export function RepoPage() {
  const id = Number(useParams().id);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { analysis: active } = useAnalysisPolling(activeId);

  const reload = useCallback(async () => {
    try {
      const [r, h] = await Promise.all([api.getRepository(id), api.listAnalyses(id)]);
      setRepo(r);
      setHistory(h);
      const running = h.find((a) => a.status === "queued" || a.status === "running");
      setActiveId((cur) => cur ?? running?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }, [id]);
  useEffect(() => void reload(), [reload]);

  // when the polled analysis reaches a terminal state, refresh history
  useEffect(() => {
    if (active && (active.status === "succeeded" || active.status === "failed")) void reload();
  }, [active?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    setError(null);
    try {
      const a = await api.startAnalysis(id);
      setActiveId(a.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  const inProgress = active?.status === "queued" || active?.status === "running";
  const trend = [...history]
    .filter((a) => a.status === "succeeded" && a.summary)
    .reverse()
    .map((a, i) => ({ run: `#${i + 1}`, findings: a.summary!.findings_total }));

  if (!repo) return error ? <p role="alert" className="error">{error}</p> : <p className="muted">Loading…</p>;
  return (
    <>
      <p><Link to="/">← Repositories</Link></p>
      <div className="row between">
        <div>
          <h1>{repo.name}</h1>
          <p className="muted">{repo.source}</p>
        </div>
        <button onClick={run} disabled={inProgress}>{inProgress ? "Analyzing…" : "Run analysis"}</button>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {active?.status === "failed" && <p role="alert" className="error">Analysis failed: {active.error}</p>}

      {trend.length > 1 && (
        <section className="card">
          <h2>Findings over time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="run" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="findings" fill="var(--accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <h2>History</h2>
      {history.length === 0 && <p className="muted empty">No analyses yet. Run one to see findings.</p>}
      <ul className="history">
        {history.map((a) => (
          <li key={a.id} className="card row between">
            <div className="row">
              <StatusBadge status={a.status} />
              <span>{formatDate(a.created_at)}</span>
              {a.commit_sha && <code className="muted">{a.commit_sha.slice(0, 7)}</code>}
              {a.summary && <span><strong>{a.summary.findings_total}</strong> findings</span>}
              {a.error && <span className="error">{a.error}</span>}
            </div>
            {a.status === "succeeded" && <Link to={`/analyses/${a.id}`}>View report →</Link>}
          </li>
        ))}
      </ul>
    </>
  );
}
