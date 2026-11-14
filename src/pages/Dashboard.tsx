import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Repository } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate } from "../lib/format";

export function Dashboard() {
  const [repos, setRepos] = useState<Repository[] | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.listRepositories().then(setRepos).catch((e) => setError(e.message)), []);
  useEffect(() => void load(), [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.addRepository(url.trim());
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Repositories</h1>
      <p className="muted">Check how healthy a repository's AI context files are: duplicates, broken links and stale paths.</p>
      <form className="card add" onSubmit={add}>
        <label htmlFor="url">GitHub repository</label>
        <div className="row">
          <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" required />
          <button disabled={busy || !url.trim()}>{busy ? "Adding…" : "Add"}</button>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
      </form>

      {repos === null && !error && <p className="muted">Loading…</p>}
      {repos?.length === 0 && <p className="muted empty">No repositories yet. Add a public GitHub repository above.</p>}
      <div className="grid">
        {repos?.map((r) => (
          <Link key={r.id} to={`/repos/${r.id}`} className="card repo">
            <h2>{r.name}</h2>
            {r.latest_analysis ? (
              <>
                <div className="row between">
                  <StatusBadge status={r.latest_analysis.status} />
                  <span className="muted">{formatDate(r.latest_analysis.finished_at ?? r.latest_analysis.created_at)}</span>
                </div>
                {r.latest_analysis.summary && (
                  <p>
                    <strong>{r.latest_analysis.summary.findings_total}</strong> findings ·{" "}
                    {r.latest_analysis.summary.files_scanned} files
                  </p>
                )}
              </>
            ) : (
              <p className="muted">Not analyzed yet</p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
