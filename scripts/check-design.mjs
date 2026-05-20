#!/usr/bin/env node
/**
 * scripts/check-design.mjs — Phase 7.12.
 *
 * CI guard for design-system discipline. Fails (exit 1) if any banned
 * pattern is found in src/.
 *
 * Run via `npm run check:design`; wired into `npm test` so any banned
 * pattern hard-fails CI.
 *
 * The rules below are derived from CLAUDE.md sections 1–3.
 *
 * To temporarily allow a finding, add `// design-check: allow <rule-id>`
 * on the same line. Don't abuse this — every escape hatch is grep-able.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/* ─── Files / dirs intentionally exempt from these rules ─────────────── */

/** Files where shadcn primitives + Tailwind utilities are allowed
 *  (this is the upstream library we wrap; rules apply to CONSUMERS). */
const EXEMPT_PATH_PARTS = [
  // shadcn primitives — out of scope per CLAUDE.md
  ["src", "components", "ui", "avatar.tsx"],
  ["src", "components", "ui", "badge.tsx"],
  ["src", "components", "ui", "button.tsx"],
  ["src", "components", "ui", "card.tsx"],
  ["src", "components", "ui", "checkbox.tsx"],
  ["src", "components", "ui", "collapsible.tsx"],
  ["src", "components", "ui", "dialog.tsx"],
  ["src", "components", "ui", "dropdown-menu.tsx"],
  ["src", "components", "ui", "input.tsx"],
  ["src", "components", "ui", "label.tsx"],
  ["src", "components", "ui", "progress.tsx"],
  ["src", "components", "ui", "radio-group.tsx"],
  ["src", "components", "ui", "scroll-area.tsx"],
  ["src", "components", "ui", "select.tsx"],
  ["src", "components", "ui", "separator.tsx"],
  ["src", "components", "ui", "sheet.tsx"],
  ["src", "components", "ui", "switch.tsx"],
  ["src", "components", "ui", "table.tsx"],
  ["src", "components", "ui", "tabs.tsx"],
  ["src", "components", "ui", "textarea.tsx"],
  ["src", "components", "ui", "tooltip.tsx"],
  // Project-owned UI primitives — same role as shadcn primitives above
  // (template-style wrappers that legitimately compose dynamic inline styles).
  // Rules apply to CONSUMERS of these primitives, not the primitives themselves.
  ["src", "components", "ui", "Icon.tsx"],
  ["src", "components", "ui", "Toast.tsx"],
  ["src", "components", "ui", "EmptyState.tsx"],
  ["src", "components", "ui", "ErrorState.tsx"],
  ["src", "components", "ui", "LoadingState.tsx"],
  ["src", "components", "ui", "DateField.tsx"],
  ["src", "components", "ui", "FilterPopover.tsx"],
  // Layout shell — top-level chrome primitive (sidebar / topbar / header).
  ["src", "components", "layout", "app-shell.tsx"],
  // Public landing page — marketing chrome, separate rules
  ["src", "app", "page.tsx"],
];

function isExempt(filePath) {
  const rel = relative(ROOT, filePath).split(sep);
  return EXEMPT_PATH_PARTS.some(
    (parts) =>
      rel.length >= parts.length &&
      parts.every((p, i) => rel[i] === p),
  );
}

/* ─── Rules ──────────────────────────────────────────────────────────── */

/**
 * Each rule:
 *   id       — short slug used by escape-hatch comments
 *   label    — human-readable description (printed on failure)
 *   pattern  — RegExp matched per line
 *   reason   — explanation printed on failure
 *   exts     — file extensions to scan (default tsx/jsx/ts/js)
 */
const RULES = [
  {
    id: "no-tailwind-text-size",
    label: "Tailwind text-* sizing on JSX",
    pattern: /\btext-(?:2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/,
    reason:
      "Use gecko CSS classes referencing var(--gecko-text-*). " +
      "Tailwind text-2xl+ is banned (CLAUDE.md §2).",
  },
  {
    id: "no-tailwind-font-weight",
    label: "Tailwind font-{semibold,bold} on JSX",
    pattern: /\bfont-(?:semibold|bold|extrabold|black)\b/,
    reason:
      "Use gecko classes or var(--gecko-font-weight-*) (CLAUDE.md §2).",
  },
  {
    id: "no-inline-style-prop",
    label: "inline style={{}} prop",
    pattern: /\sstyle=\{\{/,
    reason:
      "No `style={{}}` props (CLAUDE.md §1). Use gecko classes, Tailwind " +
      "LAYOUT utilities, or a co-located CSS module.",
  },
  {
    id: "no-tailwind-text-color",
    label: "Tailwind text-* color utility",
    // Match text-<word>-<num> but exclude legitimate ones like text-xs/sm/base/lg/xl
    // and text-center/left/right/justify/wrap/nowrap/balance
    pattern:
      /\btext-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/,
    reason:
      "Use semantic gecko color vars (e.g. gecko-text-secondary, " +
      "var(--gecko-success-700)). No Tailwind palette colors (CLAUDE.md §2).",
  },
  {
    id: "no-h1-text-size",
    label: "<h1> with Tailwind text-2xl+",
    pattern: /<h1[^>]*\btext-(?:2xl|3xl|4xl|5xl|6xl)\b/,
    reason:
      "Page titles render through DetailPageShell / EditPageShell / " +
      "ListPageShell — they handle sizing. Do not freelance h1 sizing.",
  },
  {
    id: "logicon-brand-leak",
    label: 'banned brand string "logicon"',
    pattern: /logicon/i,
    reason: "Product name is GECKO (CLAUDE.md §4).",
  },
];

/* ─── Scanner ────────────────────────────────────────────────────────── */

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
      yield* walk(p);
    } else if (/\.(?:tsx|jsx|ts|js)$/.test(entry)) {
      yield p;
    }
  }
}

const findings = [];

for (const filePath of walk(SRC)) {
  if (isExempt(filePath)) continue;
  const src = readFileSync(filePath, "utf8");
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Single-line escape hatch
    const allowMatch = line.match(/design-check:\s*allow\s+([a-z0-9-]+)/);
    const allowed = allowMatch ? allowMatch[1] : null;
    for (const rule of RULES) {
      if (rule.id === allowed) continue;
      if (rule.pattern.test(line)) {
        findings.push({
          file: relative(ROOT, filePath),
          line: i + 1,
          rule: rule.id,
          label: rule.label,
          reason: rule.reason,
          snippet: line.trim(),
        });
      }
    }
  }
}

/* ─── Report ─────────────────────────────────────────────────────────── */

if (findings.length === 0) {
  console.log("✓ check-design — 0 violations across src/");
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}

console.error("\n× check-design — found", findings.length, "violations\n");

for (const [ruleId, items] of byRule) {
  const sample = items[0];
  console.error(`▸ [${ruleId}] ${sample.label} — ${items.length} occurrence${items.length === 1 ? "" : "s"}`);
  console.error(`  ${sample.reason}`);
  const showMax = 5;
  for (const item of items.slice(0, showMax)) {
    console.error(`    ${item.file}:${item.line}`);
    console.error(`      ${item.snippet.slice(0, 140)}${item.snippet.length > 140 ? "…" : ""}`);
  }
  if (items.length > showMax) {
    console.error(`    … and ${items.length - showMax} more`);
  }
  console.error();
}

console.error(
  "Fix the violations or add `// design-check: allow <rule-id>` on the same line\n" +
    "if there's a justified exception.\n",
);
process.exit(1);
