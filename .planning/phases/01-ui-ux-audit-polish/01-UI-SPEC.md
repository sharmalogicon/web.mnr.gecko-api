---
phase: 01-ui-ux-audit-polish
title: "Phase 1 — UI/UX Audit & Polish — Design Contract"
status: draft
created: 2026-05-17
benchmark: web.tos.gecko-api (Navis N4 / Datadog / Snowflake / Linear density class)
authoring_rule: |
  Tokens-first. Every numeric value below either references a gecko token
  (var(--gecko-*)) or pins a literal px because the token is fluid and a
  literal is required to lock density across viewports. Where a literal
  is mandated, the SAME literal is already used in TOS (verified by file
  reference at the end of each section). No invented values.
---

# UI Design Contract — Phase 1

> **Why this exists.** The buyer flagged the current MNR UI directly:
> *"the cards are quite large and the titles, and everything. we need to
> fix this design thingy quite seriously as we are building a global SAAS
> application competing with giants in the market."*
>
> This contract locks the **TOS-mirrored density bar** (Navis N4 / Datadog /
> Snowflake / Linear class) for the entire MNR app, plus the visual
> contracts for the five state components (Empty / Filter-Empty / Loading /
> Error / Not-Found) that Phase 1 must land across all 47 routes.
>
> **Three foundational rules** override every other section if they
> conflict:
>
> 1. **Density mirrors TOS exactly** — page-title 15px, breadcrumb 11px,
>    card padding ~16px, table rows 36–40px, button-sm 32px, sidebar
>    items 42px. Same values, same classes, same component shapes.
> 2. **Page bodies must NOT render a big `<h1>`** at the top of the
>    page. The `gecko-header` in `AppShell` already shows
>    `breadcrumb + page-title` driven by `useNavMatch`. Pages start
>    straight into content (table, cards, KPI grid, etc.). If actions
>    are needed inline, use the compact `gecko-page-actions` row defined
>    in §7 — NOT the legacy `<PageHeader>` shared component.
> 3. **No new design dependencies.** All values resolve to existing
>    `--gecko-*` tokens, existing `gecko-*` classes, or one new MNR
>    overlay section (§6.4 of `gecko_mnr_overlay.css`) for the four
>    helpers Phase 1 needs (skeleton variants, error disclosure, etc.).

---

## 1 · Typography Scale (locked, TOS-mirrored)

Every text element on every route resolves to one of these eight rungs.
Anything outside this table is a violation that the auditor must flag.

| Rung | Where it appears | Size (px) | Weight | Line-height | Token / Class |
|------|------------------|-----------|--------|-------------|---------------|
| `header-title` | The page title in the AppShell `gecko-header` bar | **15** (literal) | **600** | 1.2 | inline style on the header `<div>` (already locked in `src/components/layout/app-shell.tsx:346-348`) |
| `header-breadcrumb` | Breadcrumb crumbs in the AppShell `gecko-header` | **11** (literal) | 400 (current) / 600 (active) | 1.2 | `gecko-breadcrumb` + `gecko-breadcrumb-item` / `gecko-breadcrumb-current` |
| `section-title` | A heading INSIDE the page body (e.g. "Recent Activity", "Filters", "Charges") | 13 (literal) | 600 | 1.25 | NO `<h1>`. Use `<h2>` / `<h3>` styled inline as `fontSize: 13, fontWeight: 600` OR `gecko-card-title` if inside a card header |
| `card-title` | Card header title (e.g. KPI label, dashboard widget heading) | **var(--gecko-text-sm)** ≈ 13–15px | 600 | 1.25 | `.gecko-card-title` (already defined) — but Phase 1 overrides to size-sm not size-lg (see §6) |
| `table-th` | Table column headers | **var(--gecko-text-xs)** ≈ 11–13px, **uppercase**, letter-spacing wide | 600 | 1 | `.gecko-table th` (already defined) — DO NOT override |
| `table-td` | Table cell content | **var(--gecko-text-sm)** ≈ 13–15px | 400 (mono cells: 400; status / name cells: 600) | 1.25 | `.gecko-table td` (already defined) |
| `body-text` | Inline descriptions, helper copy, empty-state descriptions | **var(--gecko-text-sm)** ≈ 13–15px | 400 | 1.5 | `var(--gecko-text-secondary)` for muted copy; no `<p>` reset needed |
| `label` | Form labels, KPI sub-labels, badge text | **var(--gecko-text-xs)** ≈ 11–13px | 500 | 1.25 | `.gecko-label` for forms, inline for non-form |
| `mono` | Container numbers, invoice numbers, customer codes, BIC codes, ISO 6346 codes | matches surrounding rung | inherits | inherits | `.gecko-text-mono` (uses `var(--gecko-font-mono)`) |

**Corrective notes.**

- **NO page-body `<h1>`.** `gecko_design_system_base.css:43` sets
  `h1 { font-size: var(--gecko-text-4xl); }` which is 2.0–3.5rem. That
  is appropriate ONLY on `/` (landing) and `/login`. Every authenticated
  page renders inside `AppShell`, which already prints the page title at
  15px/600 in the header bar. The fix per route is: remove the `<h1>`
  element, remove `<PageHeader title=...>`, and start the page body with
  content directly (or with the §7 inline actions row if there are
  actions to show).
- **The shared `src/components/shared/page-header.tsx` is deprecated** by
  this contract. Phase 1 must replace all 47 usages of `<PageHeader>`.
  The component file can stay on disk for reference but no page should
  import it after Phase 1 ships. The auditor flags any remaining import
  as a violation.
- **Avoid `gecko-page-title` (`gecko-text-2xl`)** in `gecko_design_system_layout.css:201-206`.
  That class is fine for the *public* landing page hero only. It must not
  appear inside any `AppShell`-wrapped route.

**TOS evidence.** Same 15/11 split at
`d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\components\layout\AppShell.tsx:339-350`.
Same `<h1 style={{ fontSize: 24 }}>` exception only on a few inline-action
rows in TOS (`billing/invoices/page.tsx:51`, `dashboard/overview/page.tsx:73`)
— MNR's tighter rule REMOVES even that exception, because the AppShell
header already shows the title.

---

## 2 · Spacing Scale (locked, TOS-mirrored)

8-point fluid scale. Every spacing decision picks one of these rungs.

| Token | Approx px | Phase 1 use |
|-------|-----------|-------------|
| `var(--gecko-space-1)` | 3–6 | Pill / chip internal padding; badge dot offset |
| `var(--gecko-space-2)` | 6–10 | Icon-to-text gap inside buttons; tight inline gaps |
| `var(--gecko-space-3)` | 10–16 | KPI internal vertical gap; card footer gap; table cell row gap |
| `var(--gecko-space-4)` | 14–20 | **Card body padding (overridden — see §6)**; form-row gap; standard inline horizontal gap between toolbar items |
| `var(--gecko-space-5)` | 18–26 | Page content vertical rhythm between sibling sections; modal section gap |
| `var(--gecko-space-6)` | 22–32 | Page content padding (`.gecko-content` already at this); page-body `gap` between top-level sections; modal body padding |
| `var(--gecko-space-8)` | 28–44 | Reserved for the empty-state vertical bleed (icon → title → CTA group) |
| `var(--gecko-space-16)` | 56–88 | Outer padding on a FULL-PAGE empty state (the `.gecko-empty-state` default) — NOT used inside cards |

**Concrete locks.**

| Surface | Padding (px) | Resolved via |
|---------|--------------|--------------|
| Page content (`.gecko-content`) | `var(--gecko-space-6)` (22–32px) | Already locked in `gecko_design_system_layout.css:173-177` — DO NOT change |
| Card header (`gecko-card-header`) | `var(--gecko-space-6)` (22–32px) | Already in `gecko_design_system_components.css:195-202` — Phase 1 **overrides to `var(--gecko-space-4)` ≈ 14–20px** via the §6 MNR card-compact class for list/KPI surfaces |
| Card body (`gecko-card-body`) | `var(--gecko-space-6)` baseline → **Phase 1 mandates `var(--gecko-space-4)` (~16px) for list-row cards and KPI cards** via §6 `gecko-card-compact` class |
| Card footer | `var(--gecko-space-4) var(--gecko-space-6)` | Already in `gecko_design_system_components.css:221-228` — keep |
| Table TH | `10px 16px` (literal) | Already in `gecko_design_system_components.css:428-438` — keep |
| Table TD | `12px 16px` (literal) — yields ~38px effective row height with 13px text | Already in `gecko_design_system_components.css:440-445` — keep |
| Button (md) | `0 16px` × 40px tall | Already in `gecko_design_system_components.css:39-62` — keep BUT defaults change to `gecko-btn-sm` (see §3) |
| Form row vertical gap (within a modal) | `var(--gecko-space-4)` (14–20px) | Inline grid `gap: 16` per TOS pattern |
| Page sections gap (children of `<main>`) | `var(--gecko-space-6)` (22–32px) | Inline `gap: 24` on the page's root flex column |

**Bottom-margin rule.** Page-body sections separate with `gap` on a flex
column, NOT with per-element `margin-bottom`. Tailwind `mb-8` / `mb-6` on
page-section wrappers is banned for Phase 1 (the current MNR dashboard
uses `mb-8` between the H1 row and the filter row — once the H1 is gone,
that whole spacer disappears).

**TOS evidence.** TOS pages consistently use `gap: 24` on the root flex
column (`dashboard/overview/page.tsx:68`, `billing/invoices/page.tsx:45`,
`masters/customers/page.tsx`). MNR matches that.

---

## 3 · Component Density Tokens (locked, TOS-mirrored)

Concrete heights and the gecko class that produces them.

| Component | Height (px) | Class | Locked at | Phase 1 default |
|-----------|-------------|-------|-----------|-----------------|
| Header bar | `var(--gecko-header-height)` ≈ 56–72 (fluid) | `.gecko-header` | `gecko_design_system_layout.css:160-171` | unchanged |
| Sidebar item | **42** (literal) | `.gecko-nav-item` | `gecko_design_system_layout.css:92-113` | unchanged — Phase 1 mandates **NO new sidebar items** under 42px |
| Button — **default for Phase 1** | **32** (literal) | `.gecko-btn .gecko-btn-sm` | `gecko_design_system_components.css:150` | Phase 1 mandates `gecko-btn-sm` as the **default** for in-content buttons. The 40px `gecko-btn` (no size modifier) is reserved for primary CTAs inside empty states and modal footers ONLY |
| Button — md | 40 | `.gecko-btn` | line 60 | reserved (see above) |
| Button — lg | 48 | `.gecko-btn .gecko-btn-lg` | line 151 | NOT used in Phase 1 inside AppShell |
| Button — xl | 56 | `.gecko-btn .gecko-btn-xl` | line 152 | ONLY allowed on `/` landing hero CTA |
| Icon button (sm) | 32 × 32 | `.gecko-btn .gecko-btn-icon .gecko-btn-sm` | line 154 | header bar icon buttons, table row action buttons |
| Input — **default for Phase 1** | **30** (literal) | `.gecko-input .gecko-input-sm` (font 12px) | line 363 | Phase 1 mandates `gecko-input-sm` as the default for inline filter / toolbar inputs. The 40px `gecko-input` (no size) is the default for **form pages** (new survey, new repair, settings) |
| Input — md | 40 | `.gecko-input` | n/a | form pages only |
| Table row | **36–40** effective (12px top/bottom padding + 13px text + 1.25 line-height) | `.gecko-table` | lines 440-445 | unchanged |
| Tab item | 10px 16px padding, 13–15px text | `.gecko-tab` | lines 469-487 | unchanged |
| Badge | 2px × 10px padding, 11–13px text, semibold | `.gecko-badge` | lines 241-260 | unchanged |
| KPI stat-card | `var(--gecko-space-6)` padding baseline | `.gecko-stat-card` | lines 509-518 | Phase 1 **overrides** to `padding: 14–18px` via §6 `gecko-stat-card-compact` (the current 22–32px is too generous for a 4-up KPI grid on a 13" laptop) |

**Compete-with-giants test.** Open `/dashboard` (MNR) side-by-side with
TOS `/dashboard/overview` at 1440×900. After Phase 1, MNR's "above the
fold" density (KPI tiles per row + first chart visible) MUST match TOS.
If MNR shows fewer KPI tiles or pushes the first chart below the fold,
the audit fails on this row.

---

## 4 · Color Contract (60 / 30 / 10)

The tokens are already defined in
`gecko_design_system_tokens.css:14-235`. This section locks WHAT each
role is and what it is RESERVED for. No new hex literals.

| Role | Token | % of pixels | Reserved for |
|------|-------|------------:|--------------|
| **60% dominant surface** | `var(--gecko-bg-subtle)` (#f9fafb light, #111111 dark) | ~60 | Page background (the area outside cards) — already set on `body` |
| **30% secondary surface** | `var(--gecko-bg-surface)` (#ffffff light, #1a1a1a dark) | ~30 | Card backgrounds, sidebar, header bar, modal — already set |
| **10% accent / primary CTA** | `var(--gecko-primary-600)` (#2563eb) | ~10 | Primary CTAs (`.gecko-btn-primary`), active nav state (`.gecko-nav-item-active`), focus rings, mono-cell links, breadcrumb-current accent |
| **Destructive only** | `var(--gecko-error-600)` (#dc2626) | < 1 | "Delete X" buttons (`.gecko-btn-danger`), error-state icon background, overdue status badges |
| **Status semantic** | `--gecko-success-600` / `--gecko-warning-500` / `--gecko-info-600` / `--gecko-accent-600` | < 5 combined | Status badges, severity pills, badge variants. Not as primary CTA |

**Accent reservations (the 10%).** The primary-blue accent appears in
ONLY these places — anywhere else is a violation:

1. Primary CTA buttons (one per page max, e.g. "Register container",
   "New survey", "Save & approve").
2. Active sidebar nav item background tint
   (`gecko-nav-item-active` → `--gecko-primary-50` bg, `--gecko-primary-700`
   text).
3. Active tab underline (`gecko-tab-active`).
4. Mono-cell links inside tables (container number, customer code,
   invoice number — see TOS `billing/invoices/page.tsx:94`).
5. Focus rings (`var(--gecko-focus-ring)`).
6. Empty-state icon backgrounds: `--gecko-primary-50` tint with
   `--gecko-primary-600` glyph (overrides the gray default in
   `.gecko-empty-state-icon` for the `empty` variant).

**Destructive reservation.** `--gecko-error-*` red appears ONLY on:

1. Overdue status badge.
2. Error-state icon background and `[ Try again ]` is `gecko-btn-outline`
   (not `gecko-btn-danger`).
3. `[ Delete X ]` buttons in modal footers (Phase 1: 0 occurrences — no
   delete flows ship in Phase 1).
4. Form validation messages (Phase 1: not in scope; lands Phase 3).

**Tier colour palette** (`gecko-badge-tier-platinum / gold / silver / bronze / standard`)
is already in `gecko_mnr_overlay.css:40-68`. Phase 1 keeps these
unchanged.

---

## 5 · `<EmptyState>` Component Contract

### 5.1 React API

```ts
import type { ReactNode } from 'react';

type EmptyStateVariant = 'empty' | 'filter-empty' | 'not-found' | 'error';

interface EmptyStateProps {
  /** Icon glyph name from src/components/ui/Icon.tsx. See default table below. */
  icon?: string;
  /** Headline. Required. Per-route copy in src/data/copy/empty-states.ts. */
  title: string;
  /** Sub-text under the title. Plain text or one-paragraph ReactNode. */
  description?: ReactNode;
  /** Primary CTA — domain-specific verb + noun. */
  primary?: { label: string; href: string };
  /** Secondary CTA — recovery / dismissive action. */
  secondary?: { label: string; href: string; onClick?: () => void };
  /** Variant — drives icon background tint AND default icon glyph. */
  variant?: EmptyStateVariant;  // default 'empty'
  /** Extra class on the outer wrapper. */
  className?: string;
}
```

Path: `src/components/ui/EmptyState.tsx` (NEW file in Phase 1).

### 5.2 Visual layout (locked)

| Element | Style |
|---------|-------|
| Outer wrapper | `<div className="gecko-empty-state">` — already defined in `gecko_design_system_components.css:792-800` with `padding: var(--gecko-space-16) var(--gecko-space-8)` (≈ 56–88px × 28–44px). Phase 1 keeps this for full-page empties. **For in-card empties (filter-empty rendered inside a table card)**, wrap with `gecko-empty-state gecko-empty-state-compact` which adds a §6.4 override of `padding: var(--gecko-space-8) var(--gecko-space-6)` |
| Icon disc | 64 × 64 (locked in `.gecko-empty-state-icon` line 802-811), `border-radius: var(--gecko-radius-xl)`, background tint determined by variant (see §5.3), inner icon at `size={28}` |
| Title | `gecko-empty-state-title` (locked at `var(--gecko-text-lg)` semibold) |
| Description | `gecko-empty-state-description` (locked at `var(--gecko-text-sm)` secondary, `max-width: 360px`) |
| CTA row | Below description, gap 8px between primary and secondary. Primary is `gecko-btn gecko-btn-primary` (NO `-sm` — empty state CTAs are full 40px because they're the only thing on the page). Secondary is `gecko-btn gecko-btn-outline`. |

### 5.3 Variant overrides

| Variant | Icon disc bg | Icon glyph default | Use when |
|---------|--------------|--------------------|----------|
| `empty` (default) | `var(--gecko-primary-50)` with `--gecko-primary-600` glyph | `box` (for register pages), `inbox` (for activity feeds), `clipboardList` (for to-do-like pages) | The data set is genuinely empty — first-time use, brand-new tenant |
| `filter-empty` | `var(--gecko-bg-subtle)` with `--gecko-text-disabled` glyph | `search` (search-filter empty), `filter` (filter-chip empty) | The data set has rows but the active filter shows zero results. Render INSIDE the table card. |
| `not-found` | `var(--gecko-warning-100)` with `--gecko-warning-700` glyph | `fileX` | Detail-page URL has an ID that doesn't resolve in seed data |
| `error` | `var(--gecko-error-100)` with `--gecko-error-700` glyph | `alertCircle` | Fetch or load failure (uses `<ErrorState>` — see §5.5) |

Variant overrides land in **`gecko_mnr_overlay.css §6.4`** (new section):

```css
/* §6.4 Empty-state variant tints */
.gecko-empty-state-empty       .gecko-empty-state-icon { background: var(--gecko-primary-50);  color: var(--gecko-primary-600); }
.gecko-empty-state-filter-empty .gecko-empty-state-icon { background: var(--gecko-bg-subtle);  color: var(--gecko-text-disabled); }
.gecko-empty-state-not-found   .gecko-empty-state-icon { background: var(--gecko-warning-100); color: var(--gecko-warning-700); }
.gecko-empty-state-error       .gecko-empty-state-icon { background: var(--gecko-error-100);   color: var(--gecko-error-700); }
.gecko-empty-state-compact     { padding: var(--gecko-space-8) var(--gecko-space-6); }
```

### 5.4 ASCII mockups

**Variant: `empty` — `/repair` with zero jobs:**

```
            ┌──────────────────────────────────────────────┐
            │                                              │
            │              ┌────────────┐                  │
            │              │   [box]    │  ← 64px disc,    │
            │              │   primary  │    primary-50    │
            │              │   tint     │    bg, 28px      │
            │              └────────────┘    glyph         │
            │                                              │
            │       No repair jobs yet                     │  ← title 15-17px
            │                                              │     semibold
            │     Open a repair job to start CEDEX         │  ← description
            │     -coded estimation for an in-yard         │     13-15px secondary
            │     container.                               │     max 360px
            │                                              │
            │      ┌──────────────────┐  ┌──────────────┐  │
            │      │  Open repair job │  │  View seed   │  │  ← primary +
            │      └──────────────────┘  └──────────────┘  │     outline
            │                                              │
            └──────────────────────────────────────────────┘
                (rendered inside <AppShell>'s gecko-content)
```

**Variant: `filter-empty` — `/equipment?type=REEFER` returns zero rows:**

```
   ┌────────────────────────────────────────────────────────────┐
   │  EQUIPMENT #  TYPE  OWNER  STATUS  LOCATION  LAST SURVEY   │ ← table
   ├────────────────────────────────────────────────────────────┤   header
   │                                                            │   stays
   │              ┌────────────┐                                │   visible
   │              │  [search]  │  ← 64px disc, gray tint        │
   │              │   gray     │                                │
   │              └────────────┘                                │
   │                                                            │
   │       No reefer containers match this filter               │
   │                                                            │
   │       Clear the filter to see all equipment, or            │
   │       register your first reefer container.                │
   │                                                            │
   │       ┌─────────────────┐  ┌─────────────────────┐         │
   │       │   Clear filter  │  │ Register reefer →   │         │
   │       └─────────────────┘  └─────────────────────┘         │
   │                                                            │
   └────────────────────────────────────────────────────────────┘
       (rendered INSIDE the table card — table header preserved)
```

**Variant: `not-found` — `/repair/REP-DOES-NOT-EXIST`:**

```
            ┌──────────────────────────────────────────────┐
            │                                              │
            │              ┌────────────┐                  │
            │              │  [fileX]   │  ← warning-100   │
            │              │   warning  │    bg, warning   │
            │              │            │    -700 glyph    │
            │              └────────────┘                  │
            │                                              │
            │     This repair job doesn't exist            │
            │                                              │
            │     The reference REP-DOES-NOT-EXIST         │
            │     wasn't found in the repair register.     │
            │     It may have been archived.               │
            │                                              │
            │     Did you mean REP-2026-0042?              │ ← optional
            │     (Levenshtein ≤ 2 OR matching prefix)     │     suggestion
            │                                              │
            │   ┌──────────────────────┐  ┌────────────┐   │
            │   │ ← Back to Register   │  │  Search    │   │
            │   └──────────────────────┘  └────────────┘   │
            │                                              │
            └──────────────────────────────────────────────┘
```

**Variant: `error` — `/equipment` fetch failure:**

```
            ┌──────────────────────────────────────────────┐
            │                                              │
            │              ┌────────────┐                  │
            │              │ [alertCirc]│  ← error-100 bg, │
            │              │   error    │    error-700     │
            │              │            │    glyph         │
            │              └────────────┘                  │
            │                                              │
            │   We couldn't load the equipment register    │
            │                                              │
            │   Something interrupted the request. Try     │
            │   again, or contact support if it keeps      │
            │   failing.                                   │
            │                                              │
            │     ┌───────────────┐                        │
            │     │  Try again ↻  │  ← primary             │
            │     └───────────────┘                        │
            │                                              │
            │  ▸ Show details                              │ ← disclosure
            │                                              │     (see §5.5)
            └──────────────────────────────────────────────┘
```

### 5.5 `<ErrorState>` extension

The `error` variant of `<EmptyState>` is composed into an `<ErrorState>`
wrapper that adds a disclosure triangle.

```ts
interface ErrorStateProps {
  /** Friendly headline (route-aware). */
  title: string;
  /** One-paragraph friendly description. */
  description?: ReactNode;
  /** Retry handler — wires to the page's data-fetch trigger. */
  onRetry?: () => void;
  /** Underlying error for the disclosure. */
  error?: {
    code?: string;          // e.g. "FETCH_FAILED"
    correlationId?: string; // Phase-1 placeholder format: MNR-{8-hex-chars}
    message?: string;       // raw error message
  };
}
```

Path: `src/components/ui/ErrorState.tsx` (NEW).

**Disclosure pattern.** A `<details>` element styled as a small caret-link
below the retry button:

```
  ▸ Show details

  (when expanded:)
  ▾ Hide details
  ┌───────────────────────────────────────────────┐
  │  Code           FETCH_FAILED                  │
  │  Correlation    MNR-7c3f2b1a                  │  ← phase-1
  │  Message        Network request failed        │     placeholder
  │                                               │
  │  [ Copy details ]                             │  ← clipboard
  └───────────────────────────────────────────────┘
```

**Style** (lives in `gecko_mnr_overlay.css §6.4`):

```css
.gecko-error-disclosure {
  font-size: var(--gecko-text-xs);
  color: var(--gecko-text-secondary);
  cursor: pointer;
  margin-top: var(--gecko-space-4);
}
.gecko-error-disclosure[open] summary { color: var(--gecko-text-primary); }
.gecko-error-disclosure-body {
  margin-top: var(--gecko-space-3);
  padding: var(--gecko-space-3) var(--gecko-space-4);
  background: var(--gecko-bg-subtle);
  border: 1px solid var(--gecko-border);
  border-radius: var(--gecko-radius-md);
  font-family: var(--gecko-font-mono);
  font-size: var(--gecko-text-xs);
  text-align: left;
  max-width: 480px;
}
```

**Correlation-ID format.** Phase-1 placeholder: `MNR-{8-hex-chars}`
generated client-side via
`crypto.getRandomValues(new Uint8Array(4))`. A real correlation ID lands
when Phase 2's repository pattern wires actual fetches.

### 5.6 Verification: `?error=1` & `?loading=1` dev hooks

Every list/detail page reads these query params and forces the
corresponding state without an actual fetch, so the planner / executor /
auditor can verify each row in `01-AUDIT.md` without mocking failures.

Wire-up pattern (per page):

```tsx
const sp = useSearchParams();
const forceLoading = sp.get('loading') === '1';
const forceError   = sp.get('error') === '1';
const forceEmpty   = sp.get('empty') === '1';
const forceFilterEmpty = sp.get('filter-empty') === '1';

if (forceLoading) return <PageSkeleton />;
if (forceError)   return <ErrorState ... />;
if (forceEmpty || data.length === 0) {
  return hasActiveFilters ? <EmptyState variant="filter-empty" ... /> : <EmptyState ... />;
}
```

This convention is locked. The auditor verifies row-by-row in
`01-AUDIT.md` by visiting each URL with the query param appended.

---

## 6 · Card Density Contract

When to use which card shape. The default for Phase 1 is **flat + compact**.

| Shape | Class chain | Padding | When |
|-------|------------|---------|------|
| **Compact flat** (default) | `gecko-card gecko-card-flat gecko-card-compact` | `var(--gecko-space-4)` (~16px) | List tables (the wrapper around `<table>`), inline action bars, filter rows, KPI tiles. **This is the default for Phase 1.** |
| **Elevated full** | `gecko-card` | `var(--gecko-space-6)` (~24px) | Modals, full-page primary surfaces, "important" content (one per page max — typically the main detail surface) |
| **Raised** | `gecko-card gecko-card-raised` | `var(--gecko-space-6)` | Floating panels (filter popovers already use this) |
| **Bare div** | none | n/a | Page-content wrappers (`<main>`'s direct flex child); transient containers that don't need a visual surface |

**MNR overlay §6.4 adds `gecko-card-compact`:**

```css
.gecko-card-compact .gecko-card-header { padding: var(--gecko-space-4); }
.gecko-card-compact .gecko-card-body   { padding: var(--gecko-space-4); }
.gecko-card-compact .gecko-card-footer { padding: var(--gecko-space-3) var(--gecko-space-4); }
.gecko-card-compact .gecko-card-title  { font-size: var(--gecko-text-sm); }
```

**KPI tile density.** The current `KpiCard` shared component (`src/components/dashboard/`) renders too tall — Phase 1 mandates KPI tiles fit four-up at 1440px with the dashboard chart visible above the fold. Concrete shape:

```
┌─────────────────────────────────────┐
│  Label              ┌───┐           │  ← label 12px/500 muted,
│  sublabel optional  │ic │           │     32×32 icon disc
│                     └───┘           │
│                                     │
│  ┌────┐                  ╱╲╱╲╱╲    │  ← value 28px/700,
│  │247 │  +12 vs yesterday          │     sparkline 96×36
│  └────┘                             │
└─────────────────────────────────────┘
   padding: 14–18px, gap: 12–14px
```

Lift directly from TOS `dashboard/overview/page.tsx:21-56`. Phase 1
replaces MNR's `KpiCard` body with this exact shape.

---

## 7 · Page-Header Contract (corrective)

### 7.1 The single source of truth

The **only** page title rendered for an authenticated route is the one in
`AppShell`'s `gecko-header`:

```tsx
// app-shell.tsx:333-349 (already in place)
<div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
  <nav className="gecko-breadcrumb" style={{ fontSize: 11 }}>...</nav>
  <div style={{ fontSize: 15, fontWeight: 600 }}>{pageTitle}</div>
</div>
```

`pageTitle` is derived from `useNavMatch(pathname)`. New pages added to
the NAV tree get titles automatically. Detail pages get the URL
trailing segment (e.g. `REP-2026-0042`) as the page title.

### 7.2 Inline page-action row (when needed)

When a page has actions (Filter, Sort, Export, "New X"), they render as a
**compact inline row** ABOVE the main content surface. NOT a full
`PageHeader` block. No repeated title. No description paragraph.

Visual:

```
[Filter ⌄]  [Sort ⌄]  [Export ⬇]                           [+ New Repair]
   left-aligned cluster                            right-aligned primary CTA
   all gecko-btn-sm (32px tall)                    gecko-btn-primary gecko-btn-sm
```

Class lock — add to `gecko_mnr_overlay.css §6.4`:

```css
.mnr-page-actions {
  display: flex;
  align-items: center;
  gap: var(--gecko-space-3);
  margin-bottom: var(--gecko-space-4);
  flex-wrap: wrap;
}
.mnr-page-actions-spacer { flex: 1; }
```

JSX:

```tsx
<div className="mnr-page-actions">
  <FilterPopover ... />
  <SortDropdown ... />
  <ExportButton ... />
  <div className="mnr-page-actions-spacer" />
  <Link href="/repair/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
    <Icon name="plus" size={14} /> New repair
  </Link>
</div>
```

**No `<h1>`.** No "title block". No description paragraph. If extra
context is genuinely required (e.g. "Showing 7 of 14,208"), it goes as a
small badge `<span className="gecko-badge gecko-badge-gray">7 of 14,208</span>`
to the left of the filter row.

### 7.3 Empty-state and error-state pages

Empty / error / not-found states render **without** the action row — just
the centred `<EmptyState>` filling the content area. The AppShell
header still shows the page title, which provides all the orientation
the user needs.

### 7.4 Public pages (in scope per D-15..D-17)

`/`, `/login`, `/forgot-password` render OUTSIDE `AppShell` and ARE
allowed to use a hero `<h1>` with `var(--gecko-text-4xl)`. They follow
their existing chrome — Phase 1's narrower bar for these pages is:

- Loading state on form submit (spinner inside the submit button).
- Error state on auth failure (inline `<div className="gecko-alert gecko-alert-error">`).
- Brand string `Gecko M&R` (no `logicon-mnr` residue) — see §11.

---

## 8 · `<LoadingState>` Patterns

### 8.1 Three patterns

| Pattern | When | Component |
|---------|------|-----------|
| **Skeleton — table** | List pages while data loads | `<TableSkeleton columns={N} rows={8} />` |
| **Skeleton — KPI tile** | KPI cards on the dashboard | `<KpiTileSkeleton />` (matches §6 KPI shape) |
| **Centred spinner** | Detail pages while a single record loads | `<DetailSpinner label="Loading repair…" />` |

All three live in **`src/components/ui/LoadingState.tsx`** (NEW).
They compose the existing `.gecko-skeleton` class
(`gecko_design_system_components.css:558-568` — already locked with the
`gecko-shimmer` keyframe at 1.8s linear).

### 8.2 Shimmer animation (already in place)

```css
@keyframes gecko-shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position:  1000px 0; }
}
```

Duration `1.8s` linear is locked. Phase 1 does NOT change it. (The
discuss-phase suggestion of 1.5s ease-in-out is overridden because the
shared design system's 1.8s linear already ships across TOS/MNR; mutating
it would diverge MNR from TOS.)

### 8.3 Skeleton shapes

**`<TableSkeleton columns={N} rows={8}>`** — renders inside the existing
table card so the column structure is preserved.

```
┌────────────────────────────────────────────────────────────┐
│  ████  ████  ████  ████  ████   ← TH row stays static     │
├────────────────────────────────────────────────────────────┤
│  ████░░░░  ████░░  ████░░░░  ████  ████░░       ←         │
│  ████░░    ████░░  ████░░░░  ████  ████░░       skeleton  │
│  ████░░░░  ████░░  ████░░    ████  ████░░░░     rows ×8   │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
   Each skeleton bar: height 12px, width random 60–90%, gecko-skeleton class
```

**`<KpiTileSkeleton />`** — matches the §6 KPI shape.

```
┌─────────────────────────────────────┐
│  ████░░░░░░          ┌───┐          │  ← label skeleton
│                      │░░░│          │
│                      └───┘          │
│                                     │
│  ████████              ╱╲╱╲╱╲      │  ← value + spark
│  ████░░░░                          │     skeletons
└─────────────────────────────────────┘
```

**`<DetailSpinner label="Loading repair…">`** — centred `gecko-spinner`
(already in shared design system) with a label below in
`var(--gecko-text-secondary)`. ~24px spinner, label `var(--gecko-text-sm)`,
total wrapper centred via `display: flex; align-items: center;
justify-content: center; min-height: 320px; flex-direction: column; gap:
var(--gecko-space-3);`.

### 8.4 Wire-up

Phase 1 does NOT trigger these states from real fetches (Phase 2 will).
For Phase 1 verification, every page reads `?loading=1` URL param (see
§5.6) and forces the appropriate skeleton / spinner.

---

## 9 · Realistic Seed-Data Anchors (link to CONTEXT.md §D-11)

The planner produces seed files at `src/data/seed/*.ts` per CONTEXT.md
§D-09..D-11. The visible data anchors are restated here so the auditor
has them in one place:

### 9.1 Equipment register seed (≥ 18 records)

Container numbers (all BIC-validated — check digit via
`src/lib/iso6346/check-digit.ts` per CONTEXT.md §D-10):

| Number | Owner | ISO 6346 | Type | Spec anchors |
|--------|-------|----------|------|--------------|
| MSKU 234567 1 | Maersk | 22G1 | DRY 20' std | tare 2,370 kg / MGW 30,480 / cube 33.2 m³ |
| CMAU 412935 1 | CMA CGM | 42G1 | DRY 40' std | tare 3,750 / MGW 32,500 / cube 67.7 m³ |
| ONEU 786543 0 | ONE | 45G1 | DRY 40' HC | tare 3,920 / MGW 32,500 / cube 76.4 m³ |
| HLXU 555432 1 | Hapag-Lloyd | 42G1 | DRY 40' std | (verify check digit) |
| EVRU 901234 5 | Evergreen | 22G1 | DRY 20' std | (verify check digit) |
| MSCU 678901 3 | MSC | 45G1 | DRY 40' HC | (verify check digit) |
| COSU 345678 9 | COSCO | 42G1 | DRY 40' std | (verify check digit) |
| TCNU 845321 0 | Triton | 22T1 | TANK T11 IMO 1 | 26,000 L / 4 bar / 316L stainless |
| BEAU 267194 1 | Beacon | 22T6 | TANK T14 IMO 4 | 25,000 L / food-grade lined |
| SEKU 123456 7 | SeaCo | 22T1 | TANK T11 IMO 1 | (verify check digit) |
| MNBU 459832 1 | Maersk Reefer | 42R1 | REEFER 40' | Carrier 69NT40 / R-134a / -25 °C to +25 °C |
| MWCU 678403 4 | Maersk Star Cool | 45R1 | REEFER 40' HC | R-513A / -29 °C to +30 °C |
| TGHU 567890 1 | Triton (Reefer) | 42R1 | REEFER 40' | (verify check digit) |
| FCIU 234567 0 | Florens | 42G1 | DRY 40' std | (verify check digit) |
| YMLU 678901 2 | Yang Ming | 22G1 | DRY 20' std | (verify check digit) |
| ZIMU 345678 6 | ZIM | 45G1 | DRY 40' HC | (verify check digit) |
| HMMU 901234 8 | HMM | 22G1 | DRY 20' std | (verify check digit) |
| CARU 456789 3 | Caribbean / SeaCastle | 22G1 | DRY 20' std | (verify check digit) |

> The check-digit-verified subset is the seven called out in CONTEXT.md
> §D-11. The remaining eleven the planner must compute via the BIC util
> before committing to seed files.

### 9.2 Depot locations seed

`Laem Chabang Port`, `Lat Krabang ICD`, `Port Klang Northport`, `Port
Klang Westport`, `Pasir Gudang`, `Jurong Port`, `PSA Pasir Panjang`.

### 9.3 Customer / lessor seed

Carriers: `Maersk Line`, `CMA CGM (Thailand) Co., Ltd.`, `MSC
Mediterranean Shipping`, `Ocean Network Express (ONE)`, `Hapag-Lloyd`,
`Evergreen Marine`, `COSCO Shipping`, `Yang Ming`, `HMM`, `ZIM`.

Lessors: `Triton International`, `Beacon Intermodal Leasing`, `SeaCo
Global`, `Florens Container Services`, `Textainer`, `Caribbean Container
Services` (SeaCastle).

### 9.4 Surveyor / mechanic names seed

`Somchai Kraisorn`, `Tan Wei Ming`, `Ahmad bin Razak`, `Nguyen Van An`,
`Prasong Suthikorn`, `Lim Boon Keng`, `Wira Hadi`, `Apirak Chaiwan`,
`Goh Mei Ling`, `Mohd Faizal bin Hashim`.

### 9.5 Cost anchors (THB)

| Service | Range |
|---------|-------|
| 20' DRY survey | 350–500 THB |
| T11 tank washout | 8,000–15,000 THB |
| CEDEX 30 cm dent straighten | 1,200 + 0.5 hr × 350/hr ≈ 1,375 THB |
| Reefer PTI | 1,500–2,500 THB |
| 40' HC reefer survey | 600–900 THB |
| Tank pressure test | 2,500–4,000 THB |

### 9.6 Tariff seed currency mix

Customer tier mix: 2 Platinum, 3 Gold, 5 Silver, 4 Standard, 2 Bronze.
Currency anchor: 80 % THB, 15 % MYR, 5 % SGD records — only when
depot is in MY / SG.

---

## 10 · Copy Register (per-route empty-state copy)

Lives in `src/data/copy/empty-states.ts` per CONTEXT.md §D-04. Voice:
**domain-aware, actionable, short**. No "No data." No "Nothing to show."
No generic copy. Each route names its noun and offers a next action.

### 10.1 Worked examples (the planner reuses these — auditor checks them verbatim)

| Route | Variant | Title | Description | Primary CTA | Secondary CTA |
|-------|---------|-------|-------------|-------------|---------------|
| `/equipment` | empty | "No containers in the master register yet" | "Register your first container or import a fleet list to start tracking ISO 6346 equipment across your depots." | `Register container → /equipment/new` | `Import fleet → /equipment/import` (stub OK in Phase 1) |
| `/equipment?type=REEFER` | filter-empty | "No reefer containers match this filter" | "Clear the filter to see all equipment, or register your first reefer." | `Clear filter` (clears query string) | `Register reefer → /equipment/new?type=REEFER` |
| `/repair` | empty | "No repair jobs yet" | "Open a repair job to start CEDEX-coded estimation for an in-yard container." | `Open repair job → /repair/new` | — |
| `/repair?severity=critical` | filter-empty | "No critical repairs right now" | "Nothing in the critical bucket — that's a good sign. Clear the filter to see all jobs." | `Clear filter` | — |
| `/repair/REP-DOES-NOT-EXIST` | not-found | "This repair job doesn't exist" | "The reference {ID} wasn't found in the repair register. It may have been archived." (Plus: "Did you mean REP-2026-0042?" if Levenshtein ≤ 2 or matching numeric prefix.) | `← Back to Repair Register → /repair` | `Search by reference → /repair?q={ID}` |
| `/survey` | empty | "No surveys recorded yet" | "Start a DRY, TANK, or REEFER survey to log a container's condition and trigger any IICL-6 repair flags." | `New survey → /survey/new` | `Browse seed examples → /survey?demo=1` |
| `/survey/SUR-12345` | not-found | "This survey doesn't exist" | "The reference {ID} wasn't found. It may have been deleted or never created." | `← Back to Survey Register → /survey` | — |
| `/cleaning` | empty | "No cleaning jobs in the queue" | "Open a cleaning job for a tank or dry-box that arrived dirty — washouts, vacuum cleans, and reefer wipes all land here." | `New cleaning job → /cleaning/new` | — |
| `/storage` | empty | "No containers in storage" | "Containers placed on storage hold appear here with their per-diem accrual. Use Equipment to put one on hold." | `View equipment → /equipment` | — |
| `/parts` | empty | "Parts catalogue is empty" | "Add a part to start tracking inventory and pairing parts with CEDEX repair lines." | `Add part → /parts/new` | — |
| `/billing` | empty | "No invoices generated yet" | "Once repair, survey, or storage jobs complete, billable lines surface here for invoicing." | `View unbilled services → /billing/unbilled` (stub OK) | — |
| `/tariff/rate-cards` | empty | "No rate cards configured" | "Rate cards define standard depot pricing per service. Add one to start quoting." | `New rate card → /tariff/rate-cards/new` | — |
| `/tariff/contracts` | empty | "No contracts on file" | "Contracts override standard rate cards for specific customers — typically Platinum and Gold tier shipping lines." | `New contract → /tariff/contracts/new` | — |
| `/tariff/customer-rates` | empty | "No customer rate overrides" | "Customers without overrides bill at standard rate-card pricing. Add an override to deviate." | `New customer rate → /tariff/customer-rates/new` | — |
| `/tariff/surcharges` | empty | "No surcharges configured" | "Surcharges apply on top of base rates — e.g. peak-season, hazmat handling, after-hours gate." | `New surcharge → /tariff/surcharges/new` | — |
| `/tariff/simulator` | empty | "Run a price simulation" | "Pick a customer, equipment type, and service to preview the all-in quoted price using current rate cards, contracts, and surcharges." | `Start simulation` (modal) | — |
| `/tariff/history` | empty | "No price changes logged yet" | "Once you publish rate-card or contract changes, the audit trail appears here." | — | — |
| `/modification` | empty | "No modification jobs yet" | "Open a modification job for a class-society-approved structural change (e.g. tank coating upgrade, reefer plug retrofit)." | `New modification → /modification/new` | — |
| `/emergency` | empty | "No emergency jobs open" | "Spill response, hazmat incidents, and rapid-repair-on-deck jobs land here when they happen — none active right now." | — | — |
| `/dashboard` | empty | n/a | (Dashboard always has KPI tiles — empty state only triggers if seed data is wiped. Title: "No operational data yet" / Description: "Seed data loaded? Try refreshing.") | `Reload` | — |

### 10.2 Loading copy

Across all routes, the loading skeleton renders WITHOUT text. The detail-page
`<DetailSpinner>` uses route-aware labels:

| Route family | Label |
|--------------|-------|
| `/repair/[id]` | `Loading repair job…` |
| `/equipment/[id]` | `Loading container…` |
| `/survey/[id]` | `Loading survey…` |
| `/cleaning/[id]` | `Loading cleaning job…` |
| `/parts/[id]` | `Loading part…` |
| `/billing/[id]` | `Loading invoice…` |
| `/tariff/contracts/[id]` | `Loading contract…` |
| `/tariff/customer-rates/[customerId]` | `Loading customer rates…` |
| (catch-all) | `Loading…` |

### 10.3 Error copy

| Route family | Title | Description |
|--------------|-------|-------------|
| `/equipment` | "We couldn't load the equipment register" | "Something interrupted the request. Try again, or contact support if it keeps failing." |
| `/repair` | "We couldn't load the repair register" | (same shape) |
| `/survey` | "We couldn't load the survey register" | (same shape) |
| `/dashboard` | "We couldn't load the dashboard" | "One or more KPI sources failed. Try again." |
| (catch-all) | "Something went wrong" | "We hit an error loading this page. Try again, or contact support." |

### 10.4 Brand string lockdown (CONTEXT.md §D-16)

- All `logicon-mnr` / `logicon` strings → `Gecko M&R` / `Gecko` (the
  auditor greps case-insensitively across `src/`, excluding `node_modules`,
  `.next`, comments-of-record).
- `<title>` template (in `app/layout.tsx` metadata): `%s · Gecko M&R`
- Landing-page hero brand text: `Gecko M&R`
- Login left-panel testimonial (CONTEXT.md §D-17): replace
  `Somchai Prasert, Operations Manager, CMA CGM Thailand` with one of
  these realistic alternates (stable, single quote in Phase 1):
  - *"Gecko gave our depot crew the standards alignment we'd been chasing on spreadsheets for years."* — **Tan Wei Ming, Yard Operations Manager, PSA-affiliated ICD, Singapore**
  - or *"We run dry, tank, and reefer side-by-side; Gecko is the first M&R tool that treats all three as first-class."* — **Somchai Kraisorn, Senior Surveyor, Laem Chabang ICD**

Pick one and freeze in Phase 1.

---

## 11 · Animation Tokens

| Token | Value | Used for |
|-------|-------|----------|
| `gecko-shimmer` keyframe | 1.8s linear infinite (already locked) | All skeleton elements |
| `gecko-fade-in` keyframe | already defined `gecko_design_system_components.css:1213-` | EmptyState mount transition (200ms, ease-out) |
| `--gecko-transition-fast` (150ms ease) | already defined | Hover transitions on interactive surfaces (buttons, nav items, table rows, severity pills) |
| `--gecko-transition-base` (200ms ease) | already defined | Background-colour transitions on buttons, state changes |
| `--gecko-transition-slow` (300ms ease) | already defined | Sidebar collapse/expand, drawer open/close |

**State-transition rule for Phase 1.** When a page switches from
`Loading` → `Empty` / `Error` / `Data`, the outgoing skeleton fades out
over 150ms and the incoming state fades in over 200ms. Apply via
`animation: gecko-fade-in 200ms ease-out;` on the incoming state's
outer wrapper.

Hover transitions on `.gecko-btn`, `.gecko-nav-item`, `.gecko-tab`,
`.gecko-table tbody tr` are ALREADY locked at 150ms — DO NOT change.

---

## 12 · 47-Route Audit Checklist Mapping

The planner generates `01-AUDIT.md` from this matrix. Each row is one
URL × one state. The "Required" column lists the state cells the
auditor must verify.

Total: **47 routes**, counted from `Glob('src/app/**/page.tsx')`.

### 12.1 List routes (28) — all need Empty / Filter-Empty / Loading / Error

| # | Route | Empty | Filter | Load | Error | Notes |
|---|-------|:-----:|:------:|:----:|:-----:|-------|
| 1 | `/dashboard` | ✓ | — | ✓ | ✓ | Filter-empty N/A (always shows KPIs); empty only triggers if seed is empty |
| 2 | `/equipment` | ✓ | ✓ (`?type=REEFER`) | ✓ | ✓ | |
| 3 | `/repair` | ✓ | ✓ (`?severity=critical`) | ✓ | ✓ | Kanban view; empty applies per-column too |
| 4 | `/survey` | ✓ | ✓ (`?type=TANK`) | ✓ | ✓ | |
| 5 | `/cleaning` | ✓ | ✓ | ✓ | ✓ | |
| 6 | `/storage` | ✓ | ✓ | ✓ | ✓ | |
| 7 | `/parts` | ✓ | ✓ | ✓ | ✓ | |
| 8 | `/billing` | ✓ | ✓ (`?status=overdue`) | ✓ | ✓ | |
| 9 | `/modification` | ✓ | ✓ | ✓ | ✓ | |
| 10 | `/emergency` | ✓ | ✓ | ✓ | ✓ | |
| 11 | `/tariff` | ✓ | — | ✓ | ✓ | Overview/hub page |
| 12 | `/tariff/rate-cards` | ✓ | ✓ | ✓ | ✓ | |
| 13 | `/tariff/customer-rates` | ✓ | ✓ | ✓ | ✓ | |
| 14 | `/tariff/contracts` | ✓ | ✓ | ✓ | ✓ | |
| 15 | `/tariff/surcharges` | ✓ | ✓ | ✓ | ✓ | |
| 16 | `/tariff/simulator` | ✓ | — | ✓ | ✓ | Empty = "Run a simulation" CTA |
| 17 | `/tariff/history` | ✓ | ✓ | ✓ | ✓ | |
| 18 | `/settings` | — | — | ✓ | ✓ | Hub page, no list |
| 19 | `/settings/profile` | — | — | ✓ | ✓ | Form page |
| 20 | `/settings/notifications` | — | — | ✓ | ✓ | Form page |
| 21 | `/settings/language` | — | — | ✓ | ✓ | Form page |
| 22 | `/settings/company` | — | — | ✓ | ✓ | Form page |
| 23 | `/settings/display` | — | — | ✓ | ✓ | Form page |
| 24 | `/settings/users` | ✓ | ✓ | ✓ | ✓ | List of users |
| 25 | `/settings/integrations` | ✓ | — | ✓ | ✓ | List of integrations |
| 26 | `/equipment/new`, `/repair/new`, etc. (form pages — 11 total) | — | — | ✓ | ✓ | Loading on form submit, error on submit failure |

### 12.2 Detail routes (10) — need Loading + Not-Found

| # | Route | Load | Not-Found | Notes |
|---|-------|:----:|:---------:|-------|
| 27 | `/equipment/[id]` | ✓ | ✓ | Test with `/equipment/DOES-NOT-EXIST` |
| 28 | `/repair/[id]` | ✓ | ✓ | |
| 29 | `/survey/[id]` | ✓ | ✓ | |
| 30 | `/cleaning/[id]` | ✓ | ✓ | |
| 31 | `/parts/[id]` | ✓ | ✓ | |
| 32 | `/billing/[id]` | ✓ | ✓ | |
| 33 | `/modification/[id]` | ✓ | ✓ | |
| 34 | `/emergency/[id]` | ✓ | ✓ | |
| 35 | `/tariff/contracts/[id]` | ✓ | ✓ | |
| 36 | `/tariff/customer-rates/[customerId]` | ✓ | ✓ | |
| 37 | `/tariff/customer-rates/[customerId]/edit` | ✓ | ✓ | Form-detail variant |

### 12.3 Form / create routes (11)

`/equipment/new` is listed below the inline detail rows so the table
stays scannable. They need Loading + Error on submit only.

37–47: `/repair/new`, `/survey/new`, `/cleaning/new`, `/parts/new`,
`/modification/new`, `/tariff/rate-cards/new`,
`/tariff/customer-rates/new`, `/tariff/contracts/new`,
`/tariff/surcharges/new`. (Plus the existing `/equipment/new` if added
in Phase 3 — currently absent from the Glob, so 47 ≠ 47+1.)

### 12.4 Public / chromeless (3 — narrower bar per D-15)

| # | Route | Required | Notes |
|---|-------|----------|-------|
| 45 | `/` | brand string only | Landing splash. Brand text `Gecko M&R`. Testimonial per §10.4. |
| 46 | `/login` | Loading (on submit) + Error (on auth fail) | Inline `gecko-alert gecko-alert-error` |
| 47 | `/forgot-password` | Loading + Error | Same |

### 12.5 Audit cell vocabulary

Each cell in `01-AUDIT.md` is one of:

- `☐ Pending` — not yet verified in browser
- `✓ Verified YYYY-MM-DD` — agent visually confirmed at `npm run dev`
- `n/a` — state doesn't apply to this route (e.g. filter-empty on a form
  page)
- `⚠ Deviation: <reason>` — implemented but with a documented deviation
  (e.g. dashboard's filter-empty is n/a but the equipment-type-filter
  itself can render zero results — handled via a sub-pattern)

### 12.6 Spot-screenshot routes (8, per CONTEXT.md §D-13)

For attachment to the Phase 1 sign-off summary:

1. `/dashboard` — KPI tile density
2. `/equipment` — list table density
3. `/equipment?type=REEFER&empty=1` — filter-empty render
4. `/repair/REP-DOES-NOT-EXIST` — not-found render
5. `/survey/[id]?loading=1` — detail spinner
6. `/cleaning?error=1` — error state with disclosure
7. `/billing` — table card density
8. `/tariff/contracts/[id]` — detail page header (verifies no big H1)

---

## 13 · MNR Overlay §6.4 — full block to ship

Phase 1 appends this single new section to
`src/app/gecko_mnr_overlay.css`. NO existing sections (§6.1, §6.2, §6.3)
are modified.

```css
/* ============================================================
   6.4   PHASE 1 — DENSITY & STATE HELPERS
   ------------------------------------------------------------
   Adds the four MNR-specific helpers Phase 1 needs that the
   shared bundle doesn't already cover:
     - Empty-state variant icon-disc tints (4 variants)
     - Compact empty-state padding for in-card use
     - Compact card padding for list/KPI surfaces
     - Page-actions inline row
     - Error-state disclosure styling
   All values resolve to existing --gecko-* tokens.
   Promote to the shared bundle if TOS adopts the same patterns.
   ============================================================ */

/* Empty-state variant icon tints */
.gecko-empty-state-empty       .gecko-empty-state-icon { background: var(--gecko-primary-50);  color: var(--gecko-primary-600); }
.gecko-empty-state-filter-empty .gecko-empty-state-icon { background: var(--gecko-bg-subtle);  color: var(--gecko-text-disabled); }
.gecko-empty-state-not-found   .gecko-empty-state-icon { background: var(--gecko-warning-100); color: var(--gecko-warning-700); }
.gecko-empty-state-error       .gecko-empty-state-icon { background: var(--gecko-error-100);   color: var(--gecko-error-700); }

/* Compact empty state (in-card use) */
.gecko-empty-state-compact { padding: var(--gecko-space-8) var(--gecko-space-6); }

/* Compact card */
.gecko-card-compact .gecko-card-header { padding: var(--gecko-space-4); }
.gecko-card-compact .gecko-card-body   { padding: var(--gecko-space-4); }
.gecko-card-compact .gecko-card-footer { padding: var(--gecko-space-3) var(--gecko-space-4); }
.gecko-card-compact .gecko-card-title  { font-size: var(--gecko-text-sm); }

/* Page actions inline row */
.mnr-page-actions {
  display: flex;
  align-items: center;
  gap: var(--gecko-space-3);
  margin-bottom: var(--gecko-space-4);
  flex-wrap: wrap;
}
.mnr-page-actions-spacer { flex: 1; }

/* Error-state disclosure */
.gecko-error-disclosure {
  font-size: var(--gecko-text-xs);
  color: var(--gecko-text-secondary);
  cursor: pointer;
  margin-top: var(--gecko-space-4);
}
.gecko-error-disclosure[open] summary { color: var(--gecko-text-primary); }
.gecko-error-disclosure-body {
  margin-top: var(--gecko-space-3);
  padding: var(--gecko-space-3) var(--gecko-space-4);
  background: var(--gecko-bg-subtle);
  border: 1px solid var(--gecko-border);
  border-radius: var(--gecko-radius-md);
  font-family: var(--gecko-font-mono);
  font-size: var(--gecko-text-xs);
  text-align: left;
  max-width: 480px;
}

/* KPI tile compact (matches TOS dashboard density) */
.gecko-stat-card-compact {
  padding: var(--gecko-space-4);
  gap: var(--gecko-space-3);
}
.gecko-stat-card-compact .gecko-stat-value { font-size: var(--gecko-text-2xl); }
```

The MNR overlay table of contents at the top of the file also gains the
6.4 entry.

---

## 14 · Quality Gates (auditor checklist)

The `gsd-ui-checker` validates against these six dimensions. Each must
pass before the UI-SPEC moves from `draft` → `approved`.

| Dimension | Pass criterion |
|-----------|----------------|
| **Density mirrors TOS** | Side-by-side at 1440×900: MNR `/dashboard` shows 4 KPI tiles in one row + first chart above the fold, matching TOS `/dashboard/overview` |
| **No big page-body H1** | `grep -r "<h1" src/app/` returns ONLY hits on `/`, `/login`, `/forgot-password`. No occurrences in `AppShell`-wrapped routes |
| **Token discipline** | No new hex literals outside `gecko_mnr_overlay.css §6.4`. Every padding / size value resolves to a `--gecko-*` token or a literal that matches an existing TOS literal (32/30/40/42/15/11). |
| **State coverage** | Every list route in §12.1 has all four states (empty/filter/load/error) reachable via `?` dev params. Every detail route in §12.2 has both states reachable. |
| **Copy realism** | No `Customer A`, `Container 12345`, `Lorem`, `$100`, `Sample Co` strings remain in `src/` outside `/test/`. BIC check digits all compute correctly via the util. |
| **Brand string** | `grep -ri "logicon" src/` returns zero hits outside `.gitignore` and comments-of-record |

---

## 15 · Out-of-scope reminders (do NOT introduce in Phase 1)

Per CONTEXT.md §Deferred:

- Inline form validation (BIC check-digit on FORM input) — lands Phase 3
- Mobile responsiveness < 768px — lands strategic Phase C
- Accessibility audit (WCAG 2.1 AA) — lands strategic Phase D
- Illustration-driven empty states (commissioned SVGs) — out of scope
- i18n translation of empty-state copy — strings are i18n-ready in
  `src/data/copy/empty-states.ts`, but translations land strategic Phase D
- Empty-state analytics instrumentation — future phase

---

*UI-SPEC drafted: 2026-05-17. Status: draft. Next: `gsd-ui-checker`
verifies the six quality gates before promoting to `approved`.*
