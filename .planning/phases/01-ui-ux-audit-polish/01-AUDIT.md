---
phase: 01-ui-ux-audit-polish
type: audit
status: in_progress  # → 'complete' when last row flips ✓ / n/a / deviation
generated: 2026-05-18
last_updated: 2026-05-18
---

# Phase 1 — UI/UX Audit Tracker

**Authoritative inventory:** `find src/app -name "page.tsx" | wc -l` returned **48** pages (UI-SPEC §12 expected: 47). **Delta: +1.** Reconciliation: UI-SPEC §12.3 narrative listed 11 form/create routes including a hypothetical `/equipment/new` that is "currently absent from the Glob"; the actual tree contains 9 form routes (`/repair/new`, `/survey/new`, `/cleaning/new`, `/parts/new`, `/modification/new`, `/tariff/rate-cards/new`, `/tariff/customer-rates/new`, `/tariff/contracts/new`, `/tariff/surcharges/new`). Re-counting: 25 list/hub + 11 detail + 9 form + 3 public = **48**. The +1 delta vs UI-SPEC §12's stated 47 is an arithmetic slip in UI-SPEC §12.3 (called out: "47 ≠ 47+1"), not a missing route. Tracker rows below match the actual disk inventory.

**W-1 parity gate:** `find src/app -name page.tsx | wc -l` = **48** ✓ matches sum of rows in Sections B + C + D + E (25 + 11 + 9 + 3 = 48). Pass.

**Cell vocabulary (UI-SPEC §12.5):**
- ☐ Pending — not yet verified
- ✓ YYYY-MM-DD — visually confirmed in browser at `npm run dev`
- n/a — state doesn't apply to this route
- ⚠ Deviation: <reason> — implemented but with a documented deviation

**Sign-off bar:** Phase 1 is not "done" until every row is ✓ / n/a / ⚠ (D-14).

---

## A. Quality Gates (UI-SPEC §14 — automated)

| # | Gate | Command | Result |
|---|------|---------|--------|
| 1 | Density mirrors TOS | Manual side-by-side at 1440×900 | ☐ Pending — checkpoint:human-verify (Task 3) |
| 2 | No big page-body H1 | `grep -rln "<h1" src/app/ \| grep -vE "(src/app/page.tsx\|login/page.tsx\|forgot-password/page.tsx)"` returns 0 | ☐ Pending |
| 3 | Token discipline | `awk '/6.4   PHASE 1/,/^\/\*/' src/app/gecko_mnr_overlay.css \| grep -E "#[0-9a-fA-F]{3,6}\b"` returns 0 | ☐ Pending |
| 4 | State coverage | Every row in §B/C/D/E is ✓ / n/a / ⚠ | ☐ Pending — checkpoint:human-verify (Task 3) |
| 5a | Copy realism — no placeholders | `grep -rE "Customer A\b\|Container 12345\b\|\$[0-9]+\b\|Lorem\|Sample Co\b" src/ \| grep -v test` returns 0 | ☐ Pending |
| 5b | Copy realism — BIC validity | `npm test -- equipment.validation` passes | ☐ Pending |
| 6 | Brand string | `grep -ri "logicon" src/` returns 0 | ☐ Pending |
| 7 | Route-count parity (W-1) | `find src/app -name page.tsx \| wc -l` equals tracker row count | ✓ 2026-05-18 (48 = 48) |
| 8 | Screenshot count (W-2 / D-13) | `[ $(ls .planning/phases/01-ui-ux-audit-polish/screenshots/*.png 2>/dev/null \| wc -l) -ge 8 ]` | ☐ Pending — awaiting Task 3 human checkpoint |
| 9 | NODE_ENV gate on dev params | Every `sp.get('loading'\|'error'\|'empty'\|'filter-empty')` colocated with `process.env.NODE_ENV` | ☐ Pending |
| 10 | No `<PageHeader>` imports | `! grep -rq "components/shared/page-header" src/app/` | ☐ Pending |

(Filled in ☐ → ✓ / ⚠ in Task 2.)

---

## B. List & hub routes (25 routes)

Each row verified by visiting the URL at `npm run dev` with the indicated query params. Filter-Empty params (e.g. `?type=REEFER&filter-empty=1`) per UI-SPEC §12.1 notes.

| # | Route | Empty<br/>`?empty=1` | Filter-Empty<br/>`?filter-empty=1` | Loading<br/>`?loading=1` | Error<br/>`?error=1` | Notes |
|---|-------|:--:|:--:|:--:|:--:|-------|
| 1 | `/dashboard` | ☐ | n/a | ☐ | ☐ | KPI tiles always show; empty only via empty seed |
| 2 | `/equipment` | ☐ | ☐ | ☐ | ☐ | Try `?type=REEFER&filter-empty=1` |
| 3 | `/repair` | ☐ | ☐ | ☐ | ☐ | Kanban; empty replaces whole page; try `?severity=critical&filter-empty=1` |
| 4 | `/survey` | ☐ | ☐ | ☐ | ☐ | |
| 5 | `/cleaning` | ☐ | ☐ | ☐ | ☐ | |
| 6 | `/storage` | ☐ | ☐ | ☐ | ☐ | |
| 7 | `/parts` | ☐ | ☐ | ☐ | ☐ | |
| 8 | `/billing` | ☐ | ☐ | ☐ | ☐ | Try `?status=overdue&filter-empty=1` |
| 9 | `/modification` | ☐ | ☐ | ☐ | ☐ | |
| 10 | `/emergency` | ☐ | ☐ | ☐ | ☐ | |
| 11 | `/tariff` | ☐ | n/a | ☐ | ☐ | Hub page |
| 12 | `/tariff/rate-cards` | ☐ | ☐ | ☐ | ☐ | |
| 13 | `/tariff/customer-rates` | ☐ | ☐ | ☐ | ☐ | |
| 14 | `/tariff/contracts` | ☐ | ☐ | ☐ | ☐ | |
| 15 | `/tariff/surcharges` | ☐ | ☐ | ☐ | ☐ | |
| 16 | `/tariff/simulator` | ☐ | n/a | ☐ | ☐ | Empty = "Run a simulation" CTA |
| 17 | `/tariff/history` | ☐ | ☐ | ☐ | ☐ | |
| 18 | `/settings` | n/a | n/a | ☐ | ☐ | Hub |
| 19 | `/settings/profile` | n/a | n/a | ☐ | ☐ | Form — submit-time states (also in §D) |
| 20 | `/settings/notifications` | n/a | n/a | ☐ | ☐ | Form |
| 21 | `/settings/language` | n/a | n/a | ☐ | ☐ | Form |
| 22 | `/settings/company` | n/a | n/a | ☐ | ☐ | Form |
| 23 | `/settings/display` | n/a | n/a | ☐ | ☐ | Form |
| 24 | `/settings/users` | ☐ | ☐ | ☐ | ☐ | List |
| 25 | `/settings/integrations` | ☐ | n/a | ☐ | ☐ | List |

---

## C. Detail routes (11 routes)

| # | Route | Loading<br/>`?loading=1` | Not-Found<br/>`/<bad-id>` | Notes |
|---|-------|:--:|:--:|-------|
| 26 | `/equipment/[id]` | ☐ | ☐ | Try `/equipment/MSKU2345671?loading=1` + `/equipment/DOES-NOT-EXIST` |
| 27 | `/repair/[id]` | ☐ | ☐ | Try `/repair/REP-2026-0001?loading=1` + `/repair/REP-XYZ`; verify "Did you mean…" |
| 28 | `/survey/[id]` | ☐ | ☐ | |
| 29 | `/cleaning/[id]` | ☐ | ☐ | |
| 30 | `/parts/[id]` | ☐ | ☐ | |
| 31 | `/billing/[id]` | ☐ | ☐ | |
| 32 | `/modification/[id]` | ☐ | ☐ | |
| 33 | `/emergency/[id]` | ☐ | ☐ | |
| 34 | `/tariff/contracts/[id]` | ☐ | ☐ | |
| 35 | `/tariff/customer-rates/[customerId]` | ☐ | ☐ | Test both: customer-doesn't-exist (suggestion) + customer-exists-no-overrides |
| 36 | `/tariff/customer-rates/[customerId]/edit` | ☐ | ☐ | |

---

## D. Form / create routes (9 routes — Loading + Error on submit only)

> **Form-page bar (narrow per D-15 implicit):** the existing form pages already have client-side submit handlers. Phase 1's bar is "Loading state visible during async submit + gecko-styled inline error on failure." If a form has neither (or uses non-gecko Tailwind chrome), mark ⚠ Deviation and either fix-in-this-plan or open gap-closure.

| # | Route | Loading<br/>on submit | Error<br/>on submit | Notes |
|---|-------|:--:|:--:|-------|
| 37 | `/repair/new` | ☐ | ☐ | |
| 38 | `/survey/new` | ☐ | ☐ | |
| 39 | `/cleaning/new` | ☐ | ☐ | |
| 40 | `/parts/new` | ☐ | ☐ | |
| 41 | `/modification/new` | ☐ | ☐ | |
| 42 | `/tariff/rate-cards/new` | ☐ | ☐ | |
| 43 | `/tariff/customer-rates/new` | ☐ | ☐ | |
| 44 | `/tariff/contracts/new` | ☐ | ☐ | |
| 45 | `/tariff/surcharges/new` | ☐ | ☐ | |

---

## E. Public / chromeless routes (3 routes — narrower bar per D-15)

| # | Route | Brand string<br/>`grep -i "logicon"` | Loading<br/>on submit | Error<br/>on submit | Testimonial<br/>(page only) | Notes |
|---|-------|:--:|:--:|:--:|:--:|-------|
| 46 | `/` | ☐ | n/a | n/a | ☐ | Tan Wei Ming quote per UI-SPEC §10.4 |
| 47 | `/login` | ☐ | ☐ | ☐ | n/a | Inline gecko-alert-error on auth fail |
| 48 | `/forgot-password` | ☐ | ☐ | ☐ | n/a | |

---

## F. Spot screenshots (CONTEXT.md §D-13 + UI-SPEC §12.6)

8 representative captures attached at `.planning/phases/01-ui-ux-audit-polish/screenshots/`:

- [ ] `01-dashboard-density.png` — `/dashboard` at 1440×900 — KPI tile density
- [ ] `02-equipment-list.png` — `/equipment` table density
- [ ] `03-equipment-filter-empty.png` — `/equipment?type=REEFER&filter-empty=1` filter-empty
- [ ] `04-repair-not-found.png` — `/repair/REP-DOES-NOT-EXIST` not-found with suggestion
- [ ] `05-survey-detail-loading.png` — `/survey/<real-id>?loading=1` detail spinner
- [ ] `06-cleaning-error-disclosure.png` — `/cleaning?error=1` with `<details>` EXPANDED
- [ ] `07-billing-list.png` — `/billing` table card density
- [ ] `08-tariff-contract-detail.png` — `/tariff/contracts/<real-id>` detail header (verifies no big H1)

Naming convention: `<NN>-<route-slug>-<state>.png`

---

## G. Findings + Deviations

(Filled during walkthrough — empty initially.)

| Row | Status | Action | Owner / Plan |
|-----|--------|--------|--------------|
| — | — | — | — |

---

## Verification dev-param URLs (reference)

For each list route, the verifier should visit:
- `<route>?empty=1` → expect EmptyState
- `<route>?filter-empty=1` → expect FilterEmpty variant
- `<route>?loading=1` → expect TableSkeleton / KpiTileSkeleton
- `<route>?error=1` → expect ErrorState (click "Show details" to expand disclosure)

For each detail route:
- `<route>/INVALID-ID-123` → expect NotFound (with Levenshtein "Did you mean…?" if close match)
- `<route>/<real-id>?loading=1` → expect DetailSpinner
- `<route>/<real-id>?error=1` → expect ErrorState

For each form route:
- Submit the form with valid data → spinner appears in/near submit button
- Trigger simulated failure → inline `gecko-alert gecko-alert-error` appears

---

*Tracker generated: 2026-05-18 by gsd-executor / plan 01.10 Task 1. Walked by: <pending Task 3 human checkpoint>. Sign-off: pending row-by-row completion (D-14).*
