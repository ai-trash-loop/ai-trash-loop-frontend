export const TYPE_LABEL: Record<string, string> = {
  broken_reference: "Broken reference",
  stale: "Stale path",
  duplicate: "Duplicate",
  conflict: "Conflict",
};

export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;

export const KIND_LABEL: Record<string, string> = {
  claude_md: "CLAUDE.md",
  agents_md: "AGENTS.md",
  rule: "Rules",
  skill: "Skills",
  adr: "ADRs",
  readme: "READMEs",
  doc: "Docs",
};

/** Kinds that agents load as instructions; docs/ADRs/READMEs are read on demand and excluded from the instruction chart. */
export const INSTRUCTION_KINDS = ["claude_md", "agents_md", "rule", "skill"];

/** Compact token figure. Callers must label it as an estimate (it is ~4 chars/token, never an exact count). */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `~${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `~${n}`;
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
}
