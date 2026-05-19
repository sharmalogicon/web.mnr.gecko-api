# Milestones — Gecko M&R

Track-record of shipped milestones. Nothing yet — the project is entering
its first GSD-tracked milestone.

## v1.0 — In progress

**M&R Phase A — Standards Foundations**

See `.planning/ROADMAP.md` for the active phase plan.

### Phase 1 — UI/UX Audit & Polish — SHIPPED (with deferred human-verify residual)

- 2026-05-18: 10 of 10 plans executed; autonomous quality gates 8/8 pass; tsc + 17/17 tests clean.
- 2 in-place gap-closures landed: G-1 (page-body `<h1>` removal × 18 files, commit `4d8fac3`) and G-2 (USD → THB × 4 files, commit `15361c8`).
- Side-scope chore: centralized `<Icon>` migration across 42 files (commit `9ac7ea6`).
- Plan 01.10 Task 3 (browser walkthrough + 8 screenshots + density side-by-side) deferred per user decision; turn-key checklist at `.planning/phases/01-ui-ux-audit-polish/01.10-WALKTHROUGH.md`.
- Close-out artefact: [`.planning/phases/01-ui-ux-audit-polish/01.10-SUMMARY.md`](phases/01-ui-ux-audit-polish/01.10-SUMMARY.md).
- Phase 2 (Data Layer Foundation) green-lit; cursor advances.

### Phase 2 — Data Layer Foundation — SHIPPED (clean, no residual)

- 2026-05-18: 4 of 4 plans executed; 8 of 8 autonomous gates pass; tsc + 17/17 tests clean.
- 17 canonical type files at `src/lib/types/` + 17 repo files at `src/lib/repos/` + 1 HTTP stub.
- 29 pages migrated off direct seed imports.
- `src/lib/repos/index.ts` is the single REST-swap wiring point (DATA-02).
- REST swap recipe + REST team contract documented in [02-SUMMARY.md](phases/02-data-layer-foundation/02-SUMMARY.md).
- Phase 3 (Equipment Master & ISO 6346) green-lit; cursor advances.

### Phase 3 — Equipment Master & ISO 6346 — SHIPPED (with deferred form-walk residual)

- 2026-05-19: 9 of 9 autonomous gates pass; tsc + 23/23 tests clean (17 prior + 6 new schema tests).
- EquipmentRecord schema extended with EQUIP-04 universal physical specs, EQUIP-05 certifications (CSC/ACEP/exam/structural/intermediate), EQUIP-06 ATP plate validity on REEFER.
- All 20 seed records backfilled with realistic values.
- Zod + react-hook-form + @hookform/resolvers deps added; discriminated-union schema with BIC superRefine.
- Shared EquipmentForm component, 6 Card sections, category-conditional tank/reefer extensions.
- New routes: `/equipment/new` (registration) + `/equipment/[id]/edit`. Detail page tabs (Specs / Certs / Type-specific) now bind to real record fields.
- Form-walk visual residual deferred per Phase 1 D-12 pattern.
- Hand-off artefact: [03-SUMMARY.md](phases/03-equipment-master-iso6346/03-SUMMARY.md).
- Phase 4 (CEDEX Repair Coding & IICL-6 Thresholds) green-lit; cursor advances.

### Phase 4 — CEDEX Repair Coding & IICL-6 Thresholds — SHIPPED (with stub-data residuals)

- 2026-05-19: 9 of 9 autonomous gates pass; tsc + 29/29 tests clean (23 prior + 6 new IICL-6 tests).
- CEDEX code seed (50 codes across 4 axes) — PLAUSIBLE STUBS not the canonical CEDEX dictionary.
- IICL-6 threshold lookup (8 components × 3 categories) + `getIicl6Verdict()` helper.
- RepairRepo extended with `create()` / `update()` / `nextReference()`.
- `/repair/new` rebuilt as a CEDEX-coded multi-line authoring form with inline IICL-6 verdict per line.
- `/repair/[id]` approver workflow: "Submit for approval" / "Approve" / "Reject" buttons.
- Residuals: CEDEX stub data, IICL-6 stub data, no auth/role gating on Approve.
- Hand-off artefact: [04-SUMMARY.md](phases/04-cedex-repair-coding-iicl6/04-SUMMARY.md).
- Phase 5 (DRY & TANK Survey Workflows) green-lit; cursor advances.

### Phase 5 — DRY & TANK Survey Workflows — SHIPPED (with stub-data residual)

- 2026-05-19: 45 of 100 checklist items live (DRY 25 + TANK 20); REEFER 30 + PTI 25 drafted (used by Phase 6).
- `src/data/seed/_shared/survey-checklists.ts` houses all 4 type checklists with measurement + CEDEX-component metadata for IICL-6 lookup.
- SurveyRepo extended with `create()` / `update()` / `nextReference()`.
- `/survey/new` rebuilt as a checklist-driven form: type-aware items grouped by category, pass/fail/na radio, dimension input with inline IICL-6 verdict on off-hire, photo-angle placeholders (6 DRY / 4 TANK / 5 REEFER), notes-on-fail.
- Residual: checklist phrasing is plausible-stub, not from a single published standard.
- Hand-off artefact: [05-SUMMARY.md](phases/05-dry-tank-survey-workflows/05-SUMMARY.md).
- Phase 6 (Reefer Survey & PTI Workflow) green-lit; mostly needs the PTI certificate route since the form already handles REEFER + PTI.

### Phase 6 — Reefer Survey & PTI Workflow — SHIPPED (clean)

- 2026-05-19: REEFER (30) + PTI (25) checklists already live from Phase 5; certificate route is the only Phase 6 add.
- `/survey/[id]/certificate` route — print-friendly single-column certificate body inside a double-border, ATP plate validity highlighted, signature block + depot stamp slot. Renders only when `type === 'pti' && outcome === 'pass'`; otherwise renders a "Certificate unavailable" explainer.
- Uses `window.print()` + `@media print` to hide controls; no PDF library.
- Residuals: certificate currently reachable only by direct URL (no UI button yet — trivial follow-up); browser print-to-PDF vs native PDF gen.
- Hand-off artefact: [06-SUMMARY.md](phases/06-reefer-survey-pti/06-SUMMARY.md).

## v1.1-A — In progress

**M&R Phase B — Tariff + Quote**

Building on v1.0's foundation. Restructures the tariff system into 3 clean
lanes (Standard / Liner / Vendor) modeled on the TOS Customer Rate Profile
screen, then wires up margin-aware quoting on top.

### Phase 7 — 3-Tier Tariff Restructure — SHIPPED (2026-05-19)

- 6 atomic commits (`07-01` through `07-06`); tsc + 29/29 tests clean.
- 5 shared catalog seeds (charge-codes 40 / order-types 6 / movement-codes 5 / cargo-categories 4 / vendors 12). Charge codes derived from Phase 4 CEDEX seed (`<component>-<repair>` combos like `LIN-PAT`, `FNX-STR`, `GAS-RPL`) + `SVC-*` namespace for non-repair services.
- 3 tariff card seeds: standard × 7 (one per depot), liner × 10 (one per shipping line, 9 APPROVED + 1 DRAFT to demo state machine), vendor × 12.
- 3 repos with `clone` / `approve` / `unapprove` / `nextQuotationNo` (`QU-YYYY-NNNNN` for liner, `VQ-YYYY-NNNNN` for vendor).
- 4 shared components: `<TariffStatusBadge>`, `<ChargesTable>`, `<ChargeRowEditor>` (modal with react-hook-form + zodResolver), `<TariffCardFooter>` with Save / Print (window.print) / Approve / Un Approve / Clone / Close.
- 12 new routes (3 lanes × 4 routes each) + hub rewire to show 3 primary lane cards + 4 secondary tiles (Simulator / Surcharges / History / Clone).
- 9 legacy redirects: `/tariff/rate-cards*` → `/tariff/standard`; `/tariff/customer-rates*` → `/tariff/liner`; `/tariff/contracts*` → `/tariff/liner`.
- Simulator upgraded with Revenue (Liner→Standard fallback) + Cost (Vendor) + Margin, including explicit lookup-path display.
- Residual: tariff-form visual-walk pending; `<ChargeRowEditor>` ~280 lines could be split in a future polish pass.
- Hand-off artefact: [07-SUMMARY.md](phases/07-three-tier-tariff/07-SUMMARY.md).

---

## 🎉 Milestone v1.0 — M&R Phase A — Standards Foundations — COMPLETE

**All 6 phases shipped 2026-05-18 → 2026-05-19.** All 21 v1 requirements (UI-01..UI-03, DATA-01..DATA-02, EQUIP-01..EQUIP-06, REPAIR-01..REPAIR-04, SURV-01..SURV-06) are addressed by deliverable code.

### Per-phase verdict

| Phase | Status | Residuals |
|-------|--------|-----------|
| 1. UI/UX Audit & Polish | ✓ shipped | Task 3 human-verify walk-through deferred |
| 2. Data Layer Foundation | ✓ shipped | clean |
| 3. Equipment Master & ISO 6346 | ✓ shipped | form-walk visual verify deferred |
| 4. CEDEX Repair Coding & IICL-6 | ✓ shipped | CEDEX + IICL-6 stub data; auth on Approve |
| 5. DRY & TANK Surveys | ✓ shipped | checklist phrasing stub |
| 6. Reefer Survey & PTI | ✓ shipped | direct-URL only certificate link |

### Verification at milestone close

- `npx tsc --noEmit` clean
- `npm test` 29/29 passing (4 BIC validation + 13 ISO 6346 check-digit + 6 Phase 3 equipment schema + 6 Phase 4 IICL-6)
- BIC CI guard still green (Phase 1 D-10)
- Single-wiring-file REST swap point preserved at `src/lib/repos/index.ts` across all repo extensions (DATA-02)
- 23 commits across the session

### Ready for hand-off

- All artefacts under `.planning/phases/01..06/` with SUMMARY.md per phase
- STATE.md cursor reads "milestone complete"
- Suggested next: `/gsd-complete-milestone` to archive v1.0 and stand up v1.1

## Prior work (pre-GSD, not milestone-tracked)

- **2026-05 — Gecko design system adoption.** Six gecko CSS files imported
  byte-identical from `web.tos.gecko-api`; layered CSS architecture so
  Tailwind utilities + page overrides win over gecko defaults; AppShell
  rebuilt on TOS shape with MNR's nav tree; Icon + Toast ported verbatim;
  shadcn UI wrappers (button, input, badge, card, table, label, textarea)
  refactored to emit gecko classes; 41 pages/components refactored across
  3 parallel sub-agents; build passes clean on 47 routes. Not tracked as
  a GSD milestone — landed before milestone discipline was set up.

---
*Last updated: 2026-05-19 — Phase 7 close-out (Milestone v1.1-A Phase B — Tariff + Quote, in progress).*
