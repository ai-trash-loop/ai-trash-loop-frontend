import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type Analysis, type Report } from "../api/client";
import { FindingCard } from "../components/FindingCard";
import { StatCard } from "../components/StatCard";
import { INSTRUCTION_KINDS, KIND_LABEL, formatDate, formatTokens, typeLabel } from "../lib/format";

export function ReportPage() {
  const id = Number(useParams().id);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([api.getAnalysis(id), api.getReport(id)])
      .then(([a, r]) => {
        setAnalysis(a);
        setReport(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Request failed"));
  }, [id]);

  const byType = useMemo(() => {
    const c: Record<string, number> = {};
    report?.findings.forEach((f) => (c[f.type] = (c[f.type] ?? 0) + 1));
    return c;
  }, [report]);

  const tokensByKind = useMemo(() => {
    const c: Record<string, number> = {};
    report?.context_files.forEach((f) => (c[f.kind] = (c[f.kind] ?? 0) + f.token_estimate));
    return INSTRUCTION_KINDS.filter((k) => c[k]).map((k) => ({ kind: KIND_LABEL[k], tokens: c[k] })).sort((a, b) => b.tokens - a.tokens);
  }, [report]);

  if (error) return <p role="alert" className="error">{error}</p>;
  if (!report || !analysis) return <p className="muted">Loading…</p>;

  const findings = report.findings.filter((f) => filter === "all" || f.type === filter);
  const typeData = Object.entries(byType).map(([type, count]) => ({ type: typeLabel(type), count }));

  return (
    <>
      <p><Link to={`/repos/${analysis.repository_id}`}>← {report.repo.name}</Link></p>
      <h1>Context health report</h1>
      <p className="muted">
        {formatDate(report.analyzed_at)}
        {report.repo.commit_sha && <> · commit <code>{report.repo.commit_sha.slice(0, 7)}</code></>}
      </p>

      <div className="grid stats">
        <StatCard label="Context files" value={report.metrics.files_scanned} />
        <StatCard label="Findings" value={report.findings.length} />
        <StatCard label="Est. context size (tokens)" value={formatTokens(report.metrics.est_tokens_total)} hint="all markdown files, not per-session load" />
        <StatCard label="Est. repeated text (tokens)" value={formatTokens(report.metrics.est_tokens_duplicated)} hint="estimate, not a measured saving" />
      </div>

      {report.findings.length === 0 ? (
        <p className="card empty">✅ No findings. No duplicates, broken references or stale paths detected.</p>
      ) : (
        <div className="grid two">
          <section className="card">
            <h2>Findings by type</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="type" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="card">
            <h2>Est. tokens in agent instruction files</h2>
            {tokensByKind.length === 0 && <p className="muted">No CLAUDE.md, AGENTS.md, rules or skills found.</p>}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tokensByKind} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="kind" width={120} />
                <Tooltip />
                <Bar dataKey="tokens" fill="var(--accent-2)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}

      {report.findings.length > 0 && (
        <>
          <div className="row between">
            <h2>Findings ({findings.length})</h2>
            <select aria-label="Filter by type" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All types</option>
              {Object.keys(byType).map((t) => (
                <option key={t} value={t}>{typeLabel(t)} ({byType[t]})</option>
              ))}
            </select>
          </div>
          <div className="stack">{findings.map((f) => <FindingCard key={f.id} finding={f} />)}</div>
        </>
      )}
    </>
  );
}
