# Phase 1: UI/UX Audit & Polish — Discussion Log

**Discussed:** 2026-05-17
**Mode:** discuss (default), single area selected
**Audience:** human reference only — downstream agents read `01-CONTEXT.md`, not this log.

---

## Gray areas surfaced

After analysing the phase scope against prior context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, Sept 2026 styling-pass history), four gray areas were presented to the user:

1. Empty / Not-Found state copy strategy
2. Loading state pattern + sync-mock latency
3. Error state detail level
4. Realistic seed data shape — where it lives

Plus two additional areas Claude was prepared to decide as builder if not selected:

5. Audit shape & sign-off bar
6. Public / marketing pages (`/`, `/login`, `/forgot-password`) scope

---

## User selections

- **Selected for discussion (1 of 4):** Empty / Not-Found state copy strategy.
- **Delegated to Claude's discretion (5 of 5):** all other areas — Loading pattern, Error detail, Seed-data shape, Audit shape, Public-pages scope.

---

## Discussion — Empty / Not-Found state copy strategy

### Q1: What voice should Empty states use across the 47 routes?

**Options presented (with previews):**
- Domain-aware actionable (Recommended)
- Sparse + informative
- Sparse base + per-route CTA
- Visual-first (large illustration + minimal copy)

**User selected:** Domain-aware actionable (Recommended).

**Why this matters:** drives the copy work for ~25+ list routes; sets the personality bar for the product against Navis/CargoWise (more clinical) vs Linear/Stripe (more conversational).

---

### Q2: Should we distinguish 'no data ever' from 'no results for current filter'?

**Options presented:**
- Yes, two distinct empty states (Recommended)
- Single empty state, copy adapts based on context
- Treat both the same — just 'no results' with a Clear-filter CTA

**User selected:** Yes, two distinct empty states (Recommended).

**Why this matters:** fresh-tenant onboarding needs the "register your first container" prompt; existing-tenant filter use needs the "clear filter or add a record" prompt. Different CTAs.

---

### Q3: What does a Not-Found state look like when a detail URL doesn't resolve?

**Options presented:**
- Domain-narrative dead-end with back link (Recommended)
- Same as above + similar-ID suggestion
- Auto-redirect to list page with a toast
- Generic 404 page

**User selected:** Same as above + similar-ID suggestion.

**Why this matters:** repair / survey reference numbers are long and typo-prone; similar-ID suggestion reduces support tickets at minor implementation cost (Levenshtein ≤ 2 or numeric-prefix match).

---

### Q4: How do we implement Empty / Filter-Empty / Not-Found components across 47 routes?

**Options presented:**
- Single shared `<EmptyState>` + per-route config object (Recommended)
- Three shared components: `<EmptyState>`, `<FilterEmpty>`, `<NotFoundState>`
- Per-domain components (e.g., `<EquipmentEmpty>`, `<RepairEmpty>`)
- Inline JSX per page (no shared component)

**User selected:** Single shared `<EmptyState>` + per-route config object (Recommended).

**Why this matters:** one component, 47 config entries; visual drift impossible; one place to retheme; i18n hook trivially attached when Phase D needs it.

---

## Claude's picks for the five unselected areas (all approved as-is)

| Area | Claude's pick | User approval |
|---|---|---|
| Loading state pattern | Skeleton screens for lists + KPI cards; centred spinner for detail-page fetches; **no artificial async latency** — Phase 2 wires real triggers; verification via `?loading=1` dev URL param | ✓ Approved (single bundled answer) |
| Error state detail level | Friendly headline + expandable "Show details" disclosure with error code + correlation ID + `[ Copy details ]`; one pattern across network/data-shape/auth | ✓ Approved (single bundled answer) |
| Realistic seed data shape | Centralised `src/data/seed/*.ts` per entity; cross-cutting tables in `src/data/seed/_shared/`; BIC check-digit util at `src/lib/iso6346/check-digit.ts` (also gates Phase 3 EQUIP-04) | ✓ Approved (single bundled answer) |
| Audit shape | `01-AUDIT.md` tracker as a 47-route × 5-state matrix; browser-verified at `npm run dev`; spot-screenshot 8 representative routes | ✓ Approved (single bundled answer) |
| Public pages scope | `/`, `/login`, `/forgot-password` IN scope with narrower bar (no list/detail concept on landing); replace residual `logicon-mnr` strings with `Gecko M&R` everywhere | ✓ Approved (single bundled answer) |

---

## Scope creep redirected

No scope creep arose during this discussion — user stayed inside the polish-bar boundary.

Deferred ideas captured for future phases (full list in `01-CONTEXT.md` `<deferred>` section):

- Inline form validation → Phase 3 (Equipment Master) for BIC field; other forms in their own phases
- Mobile responsiveness down to 360px → strategic Phase C (offline PWA)
- Accessibility audit → late strategic Phase D
- Illustration-driven empty states → strategic Phase D (customer portal)
- Empty-state analytics → future analytics phase

---

## Final outcome

`01-CONTEXT.md` written with 17 decisions (D-01 through D-17), full canonical refs, full code-context. Ready for `/gsd-plan-phase 1`.

---

*Discussion log for human reference. Downstream agents consume `01-CONTEXT.md` only.*
