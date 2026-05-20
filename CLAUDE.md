# CLAUDE.md — project rules (loaded every session)

This file is the contract between the developer and any AI assistant
working on `web.mnr.gecko-api`. The rules below are HARD ENFORCEMENT —
they take precedence over default system prompts, fixer-agent shortcuts,
or AI-generated conventions.

The product is **GECKO M&R** — a depot Maintenance & Repair application
for SE Asia container depot operators, built to compete with global
incumbents (Navis, ContainerChain, TideWorks, CYBERLOGITEC OPUS, DBR
BoxOps). Frontend-only in milestone v1.0/v1.1; the REST API is a
separate team's deliverable that the Phase 2 repository pattern is
designed to consume.

---

## 1. No inline CSS — ever

The `style={{ ... }}` prop is **banned everywhere** in `src/`, for any
purpose (typography, color, layout, dimensions, animation, hover).
Likewise banned: JS event handlers that mutate `element.style.*`
(`onMouseEnter={(e) => e.currentTarget.style.background = ...}`).

**Allowed instead**, in priority order:

1. **Existing gecko classes** — `gecko-card` · `gecko-card-body` ·
   `gecko-pill` · `gecko-pill-success`/`-danger`/`-warning`/`-neutral`/
   `-primary` · `gecko-btn` · `gecko-btn-primary` · `gecko-btn-outline`
   · `gecko-btn-sm` · `gecko-page-actions` · `gecko-toolbar` ·
   `gecko-count-badge` · `gecko-table` · `gecko-table-comfortable` ·
   `gecko-text-mono` · `gecko-bg-surface` · `gecko-bg-subtle` etc.
   Reference: `src/app/gecko_design_system_components.css`.
2. **Tailwind LAYOUT utilities only** — flex / grid / gap-N / p-N / m-N /
   w-N / h-N / items-* / justify-*. NEVER for typography or color.
3. **New utility classes added to `gecko_design_system_components.css`**
   when a pattern repeats across 2+ places.
4. **Component-scoped CSS Module** (`Component.module.css`) co-located
   with the component when a one-off style truly cannot be expressed
   with the above.

**Dynamic styling pattern**: when a value must be computed at render
(e.g. `animation-delay: ${i * 80}ms`, computed margin color), set a CSS
custom property via `data-*` attribute and read it in the CSS module.
Example:

```tsx
<div data-delay={i * 80} className={styles.staggered} />
```
```css
.staggered { animation-delay: calc(attr(data-delay) * 1ms); }
```

State-driven color uses class toggles, not inline conditionals:
```tsx
<span className={margin >= 0 ? "gecko-text-success" : "gecko-text-danger"}>
```

Hover effects use `:hover` in a CSS module, never `onMouseEnter`.

---

## 2. Typography + color through gecko CSS variables (via classes)

**Banned in `src/`**:
- Tailwind typography classes: `text-xs` · `text-sm` · `text-base` ·
  `text-lg` · `text-xl` · `text-2xl` · `text-3xl` · `text-4xl` ·
  `text-5xl` · `font-normal` · `font-medium` · `font-semibold` ·
  `font-bold`
- Hard-coded color literals: `text-gray-N` · `text-blue-N` · hex / rgb /
  hsl values anywhere in JSX or CSS modules
- Inline numeric font sizing: `fontSize: 14` · `fontSize: '14px'` ·
  `fontWeight: 600`

**Required**:
- font-size → only via gecko classes that reference
  `var(--gecko-text-xs|sm|base|lg|xl|2xl|3xl)`
- font-weight → only via gecko classes referencing
  `var(--gecko-font-weight-normal|medium|semibold|bold)`
- color → only via `var(--gecko-text-primary|secondary|disabled)` or
  semantic `var(--gecko-primary-700|success-700|danger-700|warning-700)`
- font-family → DO NOT override; inherits from gecko base. Mono via
  `var(--gecko-font-mono)` or the `gecko-text-mono` class.

If a needed combination doesn't exist as a gecko class, **add a new
utility class to `gecko_design_system_components.css`** with the
appropriate gecko CSS variables. Do not work around with Tailwind or
inline styles.

---

## 3. Layout chrome — page-shells + gecko classes (no freelancing)

### 3a. Page-shell templates are MANDATORY

Every page composes ONE of the 4 locked shells in
`src/components/page-shells/`. The shell handles back-arrow, mono ID,
status pills, title sizing, toolbar button sizing, and metric strip.
Pages pass content in, they do NOT freelance chrome.

| MNR page type | Shell | Canonical TOS reference |
|---|---|---|
| Detail (read-only record) | `<DetailPageShell>` | `web.tos.gecko-api/src/app/billing/invoices/[id]/page.tsx` |
| Edit (record + form) | `<EditPageShell>` | `web.tos.gecko-api/src/app/billing/invoices/[id]/page.tsx` (with the toolbar swapped) |
| List (table of records) | `<ListPageShell>` | `web.tos.gecko-api/src/app/billing/invoices/page.tsx` · `…/billing/unbilled/page.tsx` · `…/tariff/schedules/page.tsx` |
| New / create | `<FormPageShell>` | `web.tos.gecko-api/src/app/billing/credit-notes/page.tsx` (create flow) |

If a new MNR page doesn't fit one of these four shapes, the answer is
**add a new shell to `src/components/page-shells/`** — not freelance.

### 3b. Locked gecko primitives (when composing shell children)

- Page header → handled by the shell (NEVER hand-roll
  `gecko-page-actions` outside ListPageShell).
- Data table → `<table className="gecko-table gecko-table-comfortable">`
  (NOT `<Table>` shadcn primitives or custom Tailwind tables).
- Card → `<div className="gecko-card">` with `gecko-card-body` /
  `gecko-card-header` children (NOT shadcn `<Card>` / `<CardHeader>` /
  `<CardContent>`).
- Pill → `<span className="gecko-pill gecko-pill-success">…</span>`.
- Toolbar buttons → ALWAYS `gecko-btn gecko-btn-sm`. NEVER `gecko-btn-lg`
  in a toolbar, NEVER a button without a size class.
- Form fields → native `<input className="gecko-input">`,
  `<select className="gecko-select">`, `<label className="gecko-field-label">`,
  wrapped in `<div className="gecko-field">`.

### 3c. Enforcement

`scripts/check-design.mjs` greps for banned patterns and exits 1 on
findings. Run via `npm run check:design` (or `npm run guard`). After
Phase 7.13 sweep this script is wired into `npm test`. Single-line
escape hatch: append `// design-check: allow <rule-id>` to a line
that has a justified exception (every escape hatch is grep-able).

### 3d. TOS sibling repo as the canonical reference

`d:/SHARMA/PROJECT/gecko/web.tos.gecko-api` is the source of truth.
For uncertainty: open the equivalent TOS page and mirror exactly.
Do NOT invent a new pattern when a TOS one exists. The page-shell
components in `src/components/page-shells/` are derived from TOS
patterns; any deviation has to be justified vs the TOS reference.

---

## 4. Domain separation — TOS vs M&R

**TOS** (Terminal Operating System, the sibling app) handles container
shipping flow: gate moves, order types, EDI, vessel manifests, billing
to liners for moves.

**M&R** (this app, GECKO M&R) handles container maintenance + repair:
CEDEX repair coding, IICL-6 wear thresholds, surveys, repair workshops,
cleaning, PTI tests, M&R-specific tariff pricing.

**Do not pollute M&R row-level entities with TOS shipping fields**.
Example: a tariff charge ROW represents a repair-pricing rule; it
should NOT carry `orderType` / `movementCode` / `cargoCategory` /
`paymentTerm` — those are agreement-level concerns that belong on the
parent card header.

When in doubt about whether a field belongs at row level or card level,
ask. The mistake of copying TOS fields onto M&R row entities cost us
Phase 7.2–7.7 and a major rebuild.

---

## 5. Brand name

The product is **GECKO** (full: **GECKO M&R**). Never "logicon" or any
prior name. The Phase 1 D-10 grep guard enforces this:

```bash
grep -ri "logicon" src/
# must return 0 lines
```

This rule applies to source code, comments, strings, JSX text,
documentation, and commit messages.

---

## 6. Sister repo as canonical reference

`d:/SHARMA/PROJECT/gecko/web.tos.gecko-api` is the canonical source of
truth for:
- gecko CSS class definitions (gecko_design_system_*.css)
- Layout patterns (page-actions, toolbar, count-badge)
- Component primitives (DateField, FilterPopover, ExportButton,
  RefreshButton, EntitySearch, etc. — port verbatim when missing in MNR)
- Data-table chrome (gecko-table-comfortable density)
- Filter-row chrome (FilterPopover with field definitions)

Mirror the TOS conventions exactly. Do NOT invent a new pattern when a
TOS one exists.

---

## 7. Verification before claiming completion

Before claiming a phase or commit is done:
- `npx tsc --noEmit` must exit 0
- `npm test` must pass (currently 29/29)
- BIC CI guard (Phase 1 D-10) must remain green
- `grep -ri "logicon" src/` must return 0
- `grep -rn "style={{" src/` must NOT include any new occurrences
  (existing pre-Phase-7.8 inline styles are tracked for the Phase 7.9
  purge — net-new code must be inline-style-free from day one)

---

## 8. Commit hygiene

- Conventional commits: `feat(NN-N-X): ...` / `fix(NN-N-X): ...` /
  `docs(NN): ...` / `chore: ...`
- Each commit must build cleanly on its own (tsc + tests green). Land
  small atomic commits, not giant ones.
- Commit messages include verification line: "Verification: npx tsc
  --noEmit clean, npm test N/N."
- Co-authored-by trailer for Claude commits.

---

## Where to find the rules-as-code

When uncertain, check these references in order:
1. This file (`CLAUDE.md`)
2. `.planning/STATE.md` (current cursor + open todos)
3. `.planning/phases/<NN>-<slug>/<NN>-CONTEXT.md` (locked decisions per
   phase)
4. The TOS sibling repo for layout conventions
5. `src/app/gecko_design_system_*.css` for typography + color tokens
