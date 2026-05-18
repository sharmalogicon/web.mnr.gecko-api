---
phase: 01-ui-ux-audit-polish
type: audit
status: in_progress  # → 'complete' when last row flips ✓ / n/a / deviation
generated: 2026-05-18
last_updated: 2026-05-18  # Task 2 (automated gates) complete + G-1/G-2 gap-closure landed in-place; Task 3 (human walkthrough + screenshots) pending
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
| 2 | No big page-body H1 | `grep -rln "<h1" src/app/ \| grep -E "\.tsx$" \| grep -vE "(src/app/page.tsx\|login/page.tsx\|forgot-password/page.tsx)"` returns 0 | ✓ 2026-05-18 (G-1 resolved in commit 4d8fac3 — all 18 page-body h1s removed, action buttons rehomed to `.mnr-page-actions` rows per UI-SPEC §7.2) |
| 3 | Token discipline | `awk '/6.4   PHASE 1/,/^\/\*/' src/app/gecko_mnr_overlay.css \| grep -E "#[0-9a-fA-F]{3,6}\b"` returns 0 | ✓ 2026-05-18 (no hex literals inside §6.4 block) |
| 4 | State coverage | Every row in §B/C/D/E is ✓ / n/a / ⚠ | ☐ Pending — checkpoint:human-verify (Task 3) |
| 5a | Copy realism — no placeholders | `grep -rEn '\$[0-9]+\.[0-9]\{2\}\|\$[0-9]\{2,\}' src/` returns 0 | ✓ 2026-05-18 (G-2 resolved in commit 15361c8 — 13 USD `$NNN` literals replaced with THB-anchored values across 4 files; verification grep returns 0 hits) |
| 5b | Copy realism — BIC validity | `npm test -- equipment.validation` passes | ✓ 2026-05-18 (4/4 tests pass) |
| 6 | Brand string | `grep -ri "logicon" src/` returns 0 | ✓ 2026-05-18 (zero hits) |
| 7 | Route-count parity (W-1) | `find src/app -name page.tsx \| wc -l` equals tracker row count | ✓ 2026-05-18 (48 = 48) |
| 8 | Screenshot count (W-2 / D-13) | `[ $(ls .planning/phases/01-ui-ux-audit-polish/screenshots/*.png 2>/dev/null \| wc -l) -ge 8 ]` | ☐ Pending — awaiting Task 3 human checkpoint |
| 9 | NODE_ENV gate on dev params | Every `sp.get('loading'\|'error'\|'empty'\|'filter-empty')` colocated with `process.env.NODE_ENV` | ✓ 2026-05-18 (30/30 dev-param files reference NODE_ENV; spot-check confirms `isDev && sp.get(...)` gating pattern) |
| 10 | No `<PageHeader>` imports | `! grep -rq "components/shared/page-header" src/app/` | ✓ 2026-05-18 (zero hits) |

**Supplementary autonomous gates (not in original §14 list but recorded for completeness):**
- TypeScript: `npx tsc --noEmit` → ✓ 2026-05-18 (exit 0, clean)
- Test suite: `npm test` → ✓ 2026-05-18 (17/17 pass — 13 BIC check-digit + 4 equipment validation)

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

| ID | Source | Status | Description | Disposition | Owner / Next plan |
|----|--------|--------|-------------|-------------|-------------------|
| G-1 | Gate 2 (Task 2) | ✓ RESOLVED (2026-05-18, commit `4d8fac3`) | 18 `.tsx` page files render a page-body `<h1 className="text-2xl font-bold">` against UI-SPEC §1 + §7.1 (the AppShell header already prints the page title at 15px/600). Files: `dashboard/page.tsx`, `repair/page.tsx`, `repair/[id]/page.tsx`, `repair/new/page.tsx`, `tariff/page.tsx`, `tariff/history/page.tsx`, `tariff/simulator/page.tsx`, `tariff/rate-cards/page.tsx`, `tariff/rate-cards/new/page.tsx`, `tariff/contracts/page.tsx`, `tariff/contracts/[id]/page.tsx`, `tariff/contracts/new/page.tsx`, `tariff/customer-rates/page.tsx`, `tariff/customer-rates/[customerId]/page.tsx`, `tariff/customer-rates/[customerId]/edit/page.tsx`, `tariff/customer-rates/new/page.tsx`, `tariff/surcharges/page.tsx`, `tariff/surcharges/new/page.tsx`. | **gap-closure landed in-place**: Per user opt-in (2026-05-18), fixed in-tree rather than spawning a separate plan. Each `<h1>` removed; where inline actions existed (New X / Edit / Renew / etc.) they were rehomed to `<div className="mnr-page-actions">` per UI-SPEC §7.2 template, with breadcrumbs and back buttons left intact. Verification: `grep -rln "<h1" src/app/` now only matches the 3 public/chromeless pages allowed by UI-SPEC §7.4 (`page.tsx`, `login/page.tsx`, `forgot-password/page.tsx`) + 2 CSS rule files. tsc clean, 17/17 tests pass. | Commit `4d8fac3` (fix(01-10/G-1): remove page-body <h1> from 18 files per UI-SPEC §1). |
| G-2 | Gate 5a (Task 2) | ✓ RESOLVED (2026-05-18, commit `15361c8`) | 10 hits of USD-style `$NNN` placeholder strings against the cross-cutting acceptance bar (THB-anchored costs per REQUIREMENTS.md). Sites: `src/app/tariff/contracts/new/page.tsx:261,269,277,285,388,392,396,400` (`$100`, `$200`, `$850`, `$25/day`, `$80`, `$160`, `$680`, `$20/day`); `src/app/tariff/customer-rates/new/page.tsx:174` (`$850`); `src/components/dashboard/pending-approvals.tsx:43` (`amount: "$650"`). These are stub form-template tables that survived the seed-data wave because the form pages were out-of-scope for plan 01.07 (only existing list/detail seed). | **gap-closure landed in-place**: Per user opt-in (2026-05-18), fixed in-tree. 8+1+3+1 = 13 USD strings (Gate 5a strict regex `\$[0-9]+\.[0-9]\{2\}\|\$[0-9]\{2,\}` actually matched 10 plus the audit missed `pending-approvals.tsx:25,34` and `recent-activity.tsx:69` which are companion stubs in the same dashboard widget pair — folded into the same fix for consistency). THB conversions aligned with plan-01.07 cost anchors (Tank Survey ≈ ฿3,500, Food Grade Clean ≈ ฿30,000, Storage ≈ ฿900/day, repair quotes ฿20k–฿85k). Verification: `grep -rEn '\$[0-9]+\.[0-9]\{2\}\|\$[0-9]\{2,\}' src/` returns 0 hits. tsc clean, 17/17 tests pass. | Commit `15361c8` (fix(01-10/G-2): replace USD strings with THB on 4 files per cross-cutting realism bar). |

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

*Tracker generated: 2026-05-18 by gsd-executor / plan 01.10 Task 1. Automated gates run: 2026-05-18 by gsd-executor / plan 01.10 Task 2. Walked by: <pending Task 3 human checkpoint>. Sign-off: pending row-by-row completion (D-14).*

*Task 2 summary: 6 of 8 autonomous gates initially PASS (3, 5b, 6, 7, 9, 10) + tsc PASS + 17/17 tests PASS. 2 gates failed (Gate 2 H1 × 18 files = G-1, Gate 5a USD × 10 hits = G-2) and per user opt-in (2026-05-18) were resolved in-place rather than spawning a separate gap-closure plan. After fixes: 8 of 8 autonomous gates PASS (Gates 2 + 5a flipped ✓ via commits `4d8fac3` + `15361c8`). 3 gates (1, 4, 8) still explicitly defer to Task 3 human checkpoint (density visual + state coverage walk + 8 screenshots).*
