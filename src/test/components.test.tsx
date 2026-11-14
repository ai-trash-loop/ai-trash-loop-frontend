import { render, screen } from "@testing-library/react";
import { FindingCard } from "../components/FindingCard";
import { formatTokens } from "../lib/format";
import type { Finding } from "../api/client";

const finding: Finding = {
  id: "ref-0001",
  type: "broken_reference",
  severity: "medium",
  confidence: 0.95,
  method: "deterministic",
  summary: "CLAUDE.md: link target 'docs/nope.md' does not exist",
  evidence: [{ file: "CLAUDE.md", line_start: 3, line_end: 3, quote: "See [missing](docs/nope.md)" }],
  recommendation: "Fix the path.",
};

test("FindingCard shows type, evidence location, quote, method and recommendation", () => {
  render(<FindingCard finding={finding} />);
  expect(screen.getByText("Broken reference")).toBeInTheDocument();
  expect(screen.getByText("CLAUDE.md:3")).toBeInTheDocument();
  expect(screen.getByText("See [missing](docs/nope.md)")).toBeInTheDocument();
  expect(screen.getByText("deterministic")).toBeInTheDocument();
  expect(screen.getByText(/Fix the path/)).toBeInTheDocument();
});

test("FindingCard shows line ranges and LLM provenance", () => {
  render(<FindingCard finding={{ ...finding, method: "llm", evidence: [{ ...finding.evidence[0], line_end: 5 }] }} />);
  expect(screen.getByText("CLAUDE.md:3–5")).toBeInTheDocument();
  expect(screen.getByText("LLM-judged")).toBeInTheDocument();
});

test("token figures are compact and approximate", () => {
  expect(formatTokens(950)).toBe("~950");
  expect(formatTokens(4200)).toBe("~4.2K");
  expect(formatTokens(41386)).toBe("~41K");
  expect(formatTokens(1921837)).toBe("~1.9M");
});
