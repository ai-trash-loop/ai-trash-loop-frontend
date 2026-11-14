import type { Finding } from "../api/client";
import { typeLabel } from "../lib/format";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className={`card finding sev-${finding.severity}`}>
      <header>
        <span className={`badge type-${finding.type}`}>{typeLabel(finding.type)}</span>
        <span className="badge subtle">{finding.severity}</span>
        <span className="badge subtle" title="How the finding was produced">
          {finding.method === "llm" ? "LLM-judged" : "deterministic"}
        </span>
        <span className="muted conf">confidence {Math.round(finding.confidence * 100)}%</span>
      </header>
      <p className="summary">{finding.summary}</p>
      <ul className="evidence">
        {finding.evidence.map((e, i) => (
          <li key={i}>
            <code className="loc">
              {e.file}:{e.line_start}
              {e.line_end !== e.line_start ? `–${e.line_end}` : ""}
            </code>
            <blockquote>{e.quote}</blockquote>
          </li>
        ))}
      </ul>
      {finding.recommendation && <p className="rec">💡 {finding.recommendation}</p>}
    </article>
  );
}
