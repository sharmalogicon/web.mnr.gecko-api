# Phase 1: UI/UX Audit & Polish — Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring every existing route in the 47-route Next.js frontend to a consistent
quality bar before any new domain capability lands on top. Specifically:

1. **Every list route** has gecko-styled Empty / Filter-Empty / Loading /
   Error states. No blank pages. No infinite spinners.
2. **Every detail route** has gecko-styled Loading and Not-Found states.
   `/repair/DOES-NOT-EXIST` lands on a proper page, not a crash.
3. **Every visible data point** across the 47 routes is realistic per the
   cross-cutting acceptance bar in REQUIREMENTS.md — BIC-validated
   container numbers with computed-correct check digits, real ISO 6346
   size/type codes, real TH/MY/SG depots, real carriers and lessors,
   THB-anchored costs, plausibly SE-Asian surveyor names.

**This phase is the polish lockdown that the buyer explicitly mandated
before standards-capability work begins.** It is NOT adding new
capabilities (no form validation, no mobile responsiveness, no
accessibility audit — those land in later phases or future milestones).

</domain>

<decisions>
## Implementation Decisions

### Empty / Filter-Empty / Not-Found State Strategy

- **D-01: Voice is domain-aware actionable.** Each Empty state describes the domain in human terms and offers a clear next action. Example for `/equipment`: *"No containers in the master register yet. Register your first container or import a fleet list to start tracking equipment."* with primary CTA `[ Register container ]` and secondary CTA `[ Import fleet ]`. Different copy per route — generic "No data" is rejected.
- **D-02: Distinguish two empty states.** `/equipment` with zero records ≠ `/equipment?type=REEFER` with zero matching records. The first shows the get-started copy. The second shows *"No reefer containers match this filter. Clear filter or add a reefer."* with `[ Clear filter ]` + `[ Add reefer ]`. Pattern mirrors Navis / Linear / Stripe.
- **D-03: Not-Found is a domain-narrative dead-end with similar-ID suggestion.** Renders inside the AppShell, not a global 404. Copy: *"This repair job doesn't exist or has been archived."* + primary `[ ← Back to Repair Register ]` + secondary `[ Search by reference ]`. **Plus: if the typed reference is close to a real one (Levenshtein ≤ 2 or matching numeric prefix), suggest** *"Did you mean REP-2024-0001?"*. Auto-redirect is rejected because the user loses the URL in the address bar.
- **D-04: Single shared `<EmptyState>` component + per-route config.** One generic component in `src/components/ui/EmptyState.tsx`. Props: `icon: IconName`, `title: string`, `description: string`, `primary?: { label, href }`, `secondary?: { label, href }`, `variant?: 'empty' | 'filter-empty' | 'not-found' | 'error'` (variant changes the icon-bg colour token). Pages import it and pass a route-specific config. Per-route config objects live in `src/data/copy/empty-states.ts` so all 47 strings are translatable from one place when i18n lands in Phase D.

### Loading State Pattern (Claude's discretion — confirmed)

- **D-05: Skeleton screens for lists + KPI cards; centred spinner for detail-page fetches.** Skeletons use the gecko-card shell with a subtle shimmer animation (CSS-only `@keyframes shimmer` driven by `var(--gecko-gray-100)` → `var(--gecko-gray-200)` background slide). Detail-page fetches show a centred `<Spinner>` (already exists from shadcn) with `Loading …` text in `var(--gecko-text-secondary)`.
- **D-06: No artificial async latency in Phase 1.** Loading states get built but are not triggered by real fetches yet — Phase 2's repository pattern will wire that up naturally. For Phase 1 verification, the components support a `?loading=1` URL query param in dev mode that forces them to render in their Loading state. Faking a `setTimeout()` delay now would be thrown away as soon as Phase 2's `await repository.list()` lands.

### Error State Detail Level (Claude's discretion — confirmed)

- **D-07: Friendly headline + expandable "Show details" disclosure.** Default view: friendly copy *(e.g., "We couldn't load the repair register.")* + `[ Try again ]` primary CTA. A small disclosure triangle reveals: error code, correlation ID (placeholder string in Phase 1; wired in Phase 2), and a `[ Copy details ]` button for support escalation.
- **D-08: One pattern across all error classes.** Network failures, data-shape mismatches, and unauthorised responses all use the same `<ErrorState>` component — only the headline copy varies. The same `?error=1` URL query param in dev mode triggers the Error state for verification.

### Realistic Seed Data Shape (Claude's discretion — confirmed)

- **D-09: Centralised seed in `src/data/seed/*.ts` per entity.** Files: `equipment.ts`, `repair.ts`, `survey.ts`, `cleaning.ts`, `storage.ts`, `parts.ts`, `billing.ts`, `tariff/rate-cards.ts`, `tariff/contracts.ts`, `tariff/customer-rates.ts`, `tariff/surcharges.ts`, `tariff/history.ts`. Each file exports a typed `const` array. Pages import from `@/data/seed/<entity>` and drop their local arrays. Cross-cutting tables (customers, lessors, depots, BIC-owner-code registry, ISO 6346 size/type codes) live in `src/data/seed/_shared/`.
- **D-10: BIC check digits MUST be computed correctly.** A small util at `src/lib/iso6346/check-digit.ts` implements the BIC algorithm. Every seed container number passes that util before being committed to the seed file. CI / unit test guards against a regression. (This util is also load-bearing for Phase 3's EQUIP-04 BIC-validation requirement — building it now means Phase 3 inherits a passing test suite.)
- **D-11: Seed-record realism anchors** (concrete examples downstream agents will use):
  - **Dry containers:** `MSKU 234567 5` (Maersk, 22G1, tare 2,370 kg, MGW 30,480 kg, cube 33.2 m³); `CMAU 412935 0` (CMA CGM, 42G1, tare 3,750 kg, MGW 32,500 kg, cube 67.7 m³); `ONEU 786543 2` (ONE, 45G1 HC, tare 3,920 kg, MGW 32,500 kg, cube 76.4 m³).
  - **Tank containers:** `TCNU 845321 8` (Triton, 22T1, T11 IMO 1, 26,000 L, 4 bar working, 316L stainless); `BEAU 267194 6` (Beacon, 22T6, T14 IMO 4, 25,000 L, food-grade lined).
  - **Reefers:** `MNBU 459832 1` (Maersk reefer, 42R1, Carrier 69NT40, R-134a, -25 °C to +25 °C); `MWCU 678403 7` (Maersk Star Cool, 45R1 HC, R-513A, -29 °C to +30 °C).
  - **Depots:** Laem Chabang Port (TH), Lat Krabang ICD (TH), Pasir Gudang (MY), Port Klang Northport (MY), Jurong Port (SG), PSA Pasir Panjang (SG).
  - **Customers:** Maersk Line, CMA CGM (Thailand) Co., Ltd., MSC Mediterranean Shipping, ONE (Ocean Network Express), Hapag-Lloyd, Evergreen, COSCO Shipping, Yang Ming, HMM, ZIM.
  - **Lessors:** Triton International, Beacon Intermodal Leasing, SeaCo, Florens Container Services, Textainer.
  - **Surveyor names:** Somchai Kraisorn (TH), Tan Wei Ming (SG), Ahmad bin Razak (MY), Nguyen Van An (VN-expat in TH), Prasong Suthikorn (TH).
  - **Cost anchors (THB):** 20' DRY survey ≈ 350–500 ; T11 tank washout ≈ 8,000–15,000 ; CEDEX 30 cm dent straighten ≈ 1,200 + 0.5 labour-hr × THB 350/hr ; reefer PTI ≈ 1,500–2,500.

### Audit Shape & Sign-Off Bar (Claude's discretion — confirmed)

- **D-12: AUDIT.md tracker.** Build `.planning/phases/01-ui-ux-audit-polish/01-AUDIT.md` — table of all 47 routes × applicable states (`Empty`, `FilterEmpty`, `Loading`, `Error`, `NotFound`). Each cell starts as ☐ Pending and flips to ✓ Verified after browser check at `npm run dev`. The tracker is the phase's working punch-list.
- **D-13: Browser-verified sign-off.** Sign-off is per-row in the tracker; an agent (or developer) must visually confirm the state in the running dev server. Spot-screenshot 8 representative routes (one per domain: dashboard, equipment list, repair detail, survey detail, cleaning bay, storage zone, billing list, tariff contract detail) and attach them to the DISCUSSION-LOG.
- **D-14: Phase 1 is not "done" until every row in 01-AUDIT.md is ✓.** No partial completion. If a route is genuinely out of scope (rare), document the reason in the tracker.

### Public / Marketing Pages Scope (Claude's discretion — confirmed)

- **D-15: `/`, `/login`, `/forgot-password` are IN scope** with a narrower bar — landing is a static splash with no list/detail concept (no Empty / Not-Found applies); login + forgot-password need Loading state on form submit + Error state on auth failure.
- **D-16: Residual `"logicon-mnr"` strings get replaced with `"Gecko M&R"` everywhere** they linger from the pre-rebrand era. The settings agent's earlier scan noted this; Phase 1 closes it. Includes: page metadata, `<title>` tags, brand text in `app-shell.tsx` (already updated), landing page hero, login left-panel branding, footer.
- **D-17: Landing-page testimonial uses a real-feeling SE-Asia depot quote** — replace the existing `"Somchai Prasert, Operations Manager, CMA CGM Thailand"` with realistic alternates rotated across visits if easy, or kept stable if not. Job title + company + location must be plausible for an ICD operator in TH/MY/SG.

### Claude's Discretion

Areas where downstream agents have flexibility (not gray; just builder-owned):
- **Skeleton animation timing.** `@keyframes shimmer` duration / easing curve — pick something subtle (≈ 1.5s, ease-in-out).
- **Error correlation-ID format.** Pre-Phase-2 it's a placeholder string; pick a format like `MNR-{8-hex-chars}` for the placeholder.
- **Spot-screenshot routes.** I named 8; researcher / planner may swap individual routes for better-coverage ones if rationale is clear.
- **AUDIT.md table layout.** The table can be one big matrix or one section per domain — planner decides; the goal is browseable, not pretty.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Phase scope + cross-cutting acceptance
- `.planning/PROJECT.md` — Core value, constraints, key decisions, current milestone target features. **The "Realistic test data (cross-cutting)" constraint is load-bearing for D-09 through D-11.**
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03 definitions and the "Cross-cutting acceptance" block (BIC owner codes, ISO 6346 size/type codes, physical-spec anchors, depot / carrier / lessor / surveyor / cost lists).
- `.planning/ROADMAP.md` — Phase 1 goal, dependencies, success criteria, dependency-graph position.
- `.planning/MILESTONES.md` — Pre-GSD history (Sept 2026 Gecko design system adoption pass — knowledge of what was already done in styling).

### Strategic context (do not edit during this phase)
- `ROADMAP.md` (repo root) — The strategic 5-phase A–E plan; Phase 1 here corresponds to a prerequisite *before* strategic Phase A capability work begins.

### Design system + existing UI primitives
- `src/app/gecko_design_system.css` — Master entry (loads Tailwind v4 + the four split files + print).
- `src/app/gecko_design_system_tokens.css` — `--gecko-*` token scale (colour, spacing, radius, text-size, etc.) referenced throughout the empty/error/loading components.
- `src/app/gecko_design_system_base.css` — Universal `*` reset; h1–h6 defaults inside `@layer base`.
- `src/app/gecko_design_system_components.css` §5.1–5.17 — `.gecko-btn`, `.gecko-card`, `.gecko-badge`, `.gecko-input`, `.gecko-alert`, `.gecko-empty-state` (existing!), `.gecko-table`, etc. **§5.9 "Empty states" already defines a `gecko-empty-state` class — verify it covers our needs before re-rolling.**
- `src/app/gecko_design_system_layout.css` — `.gecko-app`, `.gecko-sidebar`, `.gecko-header`, `.gecko-content`, `.gecko-page-header`, `.gecko-breadcrumb`.
- `src/app/gecko_mnr_overlay.css` — Existing MNR-only extensions (§6.1 tier badges, §6.2 severity pill, §6.3 equipment chart palette). If Empty/Error/Loading need MNR-specific helpers not in the shared bundle, add §6.4+ here.
- `src/app/globals.css` — Token bridge mapping MNR semantic vars (`--primary`, `--muted-foreground`, etc.) onto gecko tokens via `@theme inline`. Layered import architecture explained in the file header.

### Existing components to consume / extend
- `src/components/ui/Icon.tsx` — Verbatim from TOS; ~95 named glyphs. Empty/Error states use `box`, `alertCircle`, `info`, `fileX`, `search`, `warning`, `filter`, `refresh`.
- `src/components/ui/Toast.tsx` — Verbatim from TOS; surfaces transient errors as gecko-styled toasts (variant: `success`/`warning`/`danger`/`info`). The Error state's `[ Try again ]` failures may surface as toasts.
- `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `table.tsx` — Already refactored to emit `gecko-*` classes. EmptyState component will compose `<Button>` from here.
- `src/components/layout/app-shell.tsx` — Per-page wrap pattern (page imports + uses `<AppShell>`). Not-Found pages render inside AppShell.

### Reference implementations
- TOS repo (`d:\SHARMA\PROJECT\gecko\web.tos.gecko-api`) — Reference empty-state usage if `gecko-empty-state` class exists. Check `src/components/ui/EmptyState.tsx` if present.

### Standards (relevant for D-10 BIC check-digit util)
- BIC ISO 6346 check-digit algorithm — public specification by Bureau International des Containers. The util at `src/lib/iso6346/check-digit.ts` implements this. (No external spec file in-repo; algorithm is well-documented; planner may source pseudocode from BIC's published spec.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`gecko-empty-state` class in §5.9 of `gecko_design_system_components.css`** — verify it before re-rolling. If it provides the right shape (icon slot + title + description + CTA slot), `<EmptyState>` is a thin React wrapper around it; otherwise we extend it in the MNR overlay.
- **`Icon` component** (`src/components/ui/Icon.tsx`) — `<Icon name="box" size={48} />` etc. Already used throughout the AppShell.
- **`Button` component** (`src/components/ui/button.tsx`) — Refactored to emit `gecko-btn gecko-btn-primary` etc. Use `<Button variant="primary">` and `<Button variant="ghost">` for primary/secondary CTAs in empty states.
- **`Toast` + `ToastProvider`** (`src/components/ui/Toast.tsx`) — Wired into AppShell already. Error retries can surface failures as toasts.
- **Tailwind utilities still available** — the layered CSS fix means `flex / items-center / gap-* / py-*` etc. all work for layout inside EmptyState.

### Established Patterns

- **`gecko-*` class first, Tailwind utility second.** Inside EmptyState, use `gecko-card`, `gecko-btn`, `gecko-text-*`, and only reach for Tailwind utilities for layout (`flex`, `flex-col`, `items-center`, etc.).
- **Per-page `<AppShell>` wrapping.** Pages that should render inside the shell wrap their content. Empty/Error/NotFound states render INSIDE the page's existing `<AppShell>` wrap — no special handling needed.
- **No `style={...}` for static visual patterns.** Cross-cutting rule from the Gecko styling pass. EmptyState uses classes; only dynamic values use inline style.
- **CSS layer architecture:** gecko base + components in `@layer base/@layer components`, Tailwind utilities + page overrides in `@layer utilities`. This ensures page-level Tailwind utilities can override gecko defaults when needed.

### Integration Points

- **Every list page** (`src/app/equipment/page.tsx`, `src/app/repair/page.tsx`, `src/app/survey/page.tsx`, etc.) — add `<EmptyState>` render branch when data array is empty. Filter-Empty distinguishes by checking if filters are active.
- **Every detail page** (`src/app/equipment/[id]/page.tsx`, `src/app/repair/[id]/page.tsx`, etc.) — add Loading + Not-Found branches. Loading triggered by `?loading=1` dev param. Not-Found triggered when the URL ID does not resolve in the seed data.
- **Per-route config object location:** `src/data/copy/empty-states.ts` — exported map keyed by route path (or by a route-id enum) returning `{ icon, title, description, primary, secondary }` per state variant. i18n-ready.
- **Seed data import target:** every page currently declaring a local mock array switches to `import { equipment } from '@/data/seed/equipment'` etc. The shape of these arrays is the typed source-of-truth Phase 2 picks up.

</code_context>

<specifics>
## Specific Ideas

- **Container number examples are anchored to real BIC owner codes** with computed-correct check digits. Examples in D-11 (MSKU 234567 5, CMAU 412935 0, ONEU 786543 2, TCNU 845321 8, BEAU 267194 6, MNBU 459832 1, MWCU 678403 7) — verify each check digit before they ship to seed.
- **Skeleton screens style** — subtle, slow (~1.5s ease-in-out), grey-on-grey using `var(--gecko-gray-100)` → `var(--gecko-gray-200)`. NOT the bright pulse-blue that some Tailwind starters use.
- **AUDIT.md is a punch-list, not a report.** Aim for browseable, machine-checkable rows, not narrative prose.
- **Brand string cleanup**: the agent doing the audit must grep for `logicon-mnr` and `logicon` (case-insensitive) and replace with `Gecko M&R` / `Gecko` everywhere outside of comments-of-record and the `.gitignore`. Particular attention: page metadata, `<title>` tags, landing-page hero, login left-panel branding, footer, settings/company defaults, settings/integrations URLs.

</specifics>

<deferred>
## Deferred Ideas

Captured during discussion but explicitly out of Phase 1 scope. Don't lose them:

- **Inline form validation** (BIC check-digit on form input, range checks, required-field highlights) — buyer de-selected this from the polish bar. Lands inside Phase 3 (Equipment Master) for the BIC field specifically; other forms in their own phases.
- **Mobile responsiveness down to 360px** — buyer de-selected this. Comes in Phase C of the strategic roadmap with the offline PWA work.
- **Accessibility audit** (WCAG 2.1 AA conformance, screen-reader walk-through) — not in Phase 1 scope. Should land as a dedicated late-Phase-D activity.
- **Illustration-driven empty states** (commissioned SVGs à la Linear / Stripe) — visually rich but introduces a design dep we don't have today. Revisit when a customer-facing portal is in play (strategic Phase D).
- **Internationalisation of empty-state copy** — strings live in `src/data/copy/empty-states.ts` so i18n is one-step-away, but the actual TH / MS / ZH translation happens in strategic Phase D / D.10.
- **Empty-state analytics** ("track when users hit an empty state and what they do next") — instrumentation belongs in a future analytics phase, not Phase 1.

### Reviewed Todos (not folded)

No pending todos in `.planning/todos/pending/` — fresh GSD scaffolding has no todo backlog yet.

</deferred>

---

*Phase: 01-ui-ux-audit-polish*
*Context gathered: 2026-05-17*
