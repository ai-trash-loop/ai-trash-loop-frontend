// Full-stack smoke test in a real browser (system Chrome). Needs the backend running with ALLOW_LOCAL_PATHS=1
// and the Vite dev server up (see README, "End-to-end check"). Builds its own tiny sample repo.
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// sample repo with exactly 2 findings: 1 broken link + 1 duplicated instruction
const repo = mkdtempSync(join(tmpdir(), "trashloop-e2e-"));
const rule = "Always validate every request payload at the service boundary and reject malformed input with a clear error.";
writeFileSync(join(repo, "CLAUDE.md"), `# Guide\n\nSee [missing](docs/nope.md).\n\n${rule}\n`);
writeFileSync(join(repo, "AGENTS.md"), `# Agents\n\n- ${rule}\n`);
mkdirSync(join(repo, "docs"));

let failed = false;
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"} ${msg}`); if (!c) failed = true; };
const problems = [];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => problems.push(e.message));
page.on("console", (m) => m.type() === "error" && problems.push(m.text()));

await page.goto(BASE);
await page.getByLabel("GitHub repository").fill(repo); // local paths work only with ALLOW_LOCAL_PATHS=1 (dev)
await page.getByRole("button", { name: "Add" }).click();
const card = page.locator(".repo", { hasText: repo.split("/").pop() });
await card.waitFor();
ok(true, "repository added and listed");

await card.click();
await page.getByRole("button", { name: "Run analysis" }).click();
await page.locator(".history li").first().getByText("succeeded").waitFor({ timeout: 30000 });
ok(true, "analysis ran to completion from the UI");

await page.getByRole("link", { name: /View report/ }).first().click();
await page.getByRole("heading", { name: "Context health report" }).waitFor();
ok((await page.locator("article.finding").count()) === 2, "report shows exactly the 2 seeded findings");
ok((await page.locator("article.finding", { hasText: "Broken reference" }).count()) === 1, "broken reference finding shown");
ok((await page.locator("article.finding", { hasText: "Duplicate" }).count()) === 1, "duplicate finding shown");
ok(await page.getByText("CLAUDE.md:3").isVisible(), "evidence shows file and line");
ok(problems.length === 0, "no console or page errors" + (problems.length ? `: ${problems.join(" | ")}` : ""));

await browser.close();
process.exit(failed ? 1 : 0);
