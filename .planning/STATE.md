---
gsd_state_version: 1.0
milestone: v1.1-A
milestone_name: M&R Phase B — Tariff + Quote
status: in-progress
last_updated: "2026-05-19T17:15:00.000Z"
last_activity: "2026-05-19 — Phase 7 fully sealed after 7.1-7.6 polish sweeps. 24 atomic commits total across Phase 7. Lists in TOS data-table layout; detail + edit pages share TOS chrome (header badges + 4 stat cards + progress + tabs + PARTIES & VALIDITY); ChargeRowEditor is a tight modal with grouped Select + Save-and-add-another; <ChargesTable> uses gecko-table with pill badges; FilterPopover + RowMenu wired on all 3 list pages; Approve / Un Approve action restored on detail toolbars; Activity tab reads historyRepo (empty state today — needs historyRepo.add() hook). tsc + 29/29 clean."
session:
  stopped_at: "Phase 7 fully sealed — Phase 8 (Quote Builder) is the next candidate"
  resume_file: ".planning/phases/07-three-tier-tariff/07-SUMMARY.md"
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 100
---

# Project State

## Project Reference

**Core value:** Multi-depot operators in SE Asia get a standards-aligned
(ISO 6346, CEDEX, IICL-6) M&R tool that runs all three ICD container types
(dry, tank, reefer) without enterprise pricing or carrier-required EDI on
day one.

**Current focus:** Milestone v1.0 — M&R Phase A: Standards Foundations.
Turn the current tank-centric demo shell into a real product by landing
standards alignment and first-class workflows for the three ICD container
types.

## Current Position

🚢 MILESTONE v1.1-A — M&R Phase B (Tariff + Quote) — Phase 7 FULLY SEALED.
Phase: 7 — 3-Tier Tariff Restructure ✓ (24 commits: 07-01..06 build + 7.1-7.6 polish sweeps)
Status: 3 lanes (Standard / Liner / Vendor) built on TOS-pattern table-list + detail-chrome + edit-chrome. Shared <TariffCard> primitives. Simulator with Revenue / Cost / Margin. FilterPopover + Row "..." menu (View/Edit/Duplicate/Delete) on lists. Approve / Un Approve on detail. Free-Days grid on Liner view. Activity tab wired (empty state until historyRepo.add() hook lands). tsc + 29/29 tests clean.
Progress: [██████████] 100% (Phase 7 of milestone v1.1-A)
Last activity: 2026-05-19 — Phase 7.6 closed the 5 residuals; phase sealed.

## Milestone v1.0 (archived foundation)

6 phases shipped 2026-05-18 → 2026-05-19. 21 v1 requirements addressed.
See `.planning/MILESTONES.md` for the close-out log.

1. UI/UX Audit & Polish — UI-01, UI-02, UI-03 ✓
2. Data Layer Foundation — DATA-01, DATA-02 ✓
3. Equipment Master & ISO 6346 — EQUIP-01..06 ✓
4. CEDEX Repair Coding & IICL-6 Thresholds — REPAIR-01..04 ✓
5. DRY & TANK Survey Workflows — SURV-01, SURV-02, SURV-06 ✓
6. Reefer Survey & PTI Workflow — SURV-03, SURV-04, SURV-05 ✓

## Milestone v1.1-A current (M&R Phase B — Tariff + Quote)

7. **3-Tier Tariff Restructure** — TARIFF-01, TARIFF-02, TARIFF-03 ✓ FULLY SEALED 2026-05-19
   - 7.0 base build (6 commits)
   - 7.1 TOS pattern alignment for list pages + ChargesTable (3 commits)
   - 7.2 ChargeRowEditor drawer redesign (1 commit, superseded by 7.4)
   - 7.3 Editor modal redesign — back to modal (1 commit, superseded by 7.4)
   - 7.4 ChargeRowEditor compact modal + ChargesTable pill badges (2 commits)
   - 7.5 List page table layout + detail/edit chrome with stat cards + tabs (4 commits)
   - 7.6 Residual closure: Approve action / Free-Days view / FilterPopover / Row menu / Activity (5 commits)
8. *(candidate next)* Quote Builder — wire simulator's "Create Quote" → printable quote with real PDF
9. *(candidate)* RBAC on Approve across all tariff + repair lanes (closes Phase 4 + 7 auth residuals)
10. *(candidate)* historyRepo.add() hook wired into all mutation sites so Activity tab actually populates

## Performance Metrics

- Phases planned: 6
- Plans drafted: 10
- Plans executed: 9 (waves 1–3 done; wave 4 = plan 01.10 at Task 3)
- Requirements covered: 21 / 21

## Accumulated Context

### Decisions

- **Phase 1 (UI/UX Audit & Polish) inserted by buyer direction** — "fix the UI 100% first" before adding new domain capability. Polish bar: every list page has Empty / Loading / Error states; every detail page has Loading / Not-Found states; all visible data is container-industry-realistic.
- Phase 2 (Data Layer) sequenced second so subsequent feature phases don't accrete more per-page mock arrays. **Frontend plumbing, not a backend.**
- Phase 3 (Equipment Master) is gating for the Repair + Survey phases — DRY / TANK / REEFER as first-class types, ATP plate on reefers, and CSC / ACEP fields all unlock downstream work.
- Phases 5 (DRY + TANK surveys) and 6 (Reefer survey + PTI) can run concurrently if survey scaffolding is shared; anchor customer's fleet mix may re-tier.
- No backend in this milestone — repository pattern is the seam where the separate API team's REST backend will plug in later.
- Cross-cutting realistic-data acceptance is in force from Phase 1 onward (PROJECT.md Constraints + REQUIREMENTS.md Cross-cutting acceptance).

### Open Todos

- **Phase 8 (Quote Builder)** is the next candidate per Phase 7 SUMMARY recommendation. Wire the simulator's "Create Quote" stub → printable quote with line items + surcharges + revenue/cost/margin totals. Real PDF (jsPDF or similar) since Phase 7 D-06 deferred via window.print only. New /tariff/quote route + repo + types.
- **historyRepo.add() hook**: small chore phase — wire into approve/unapprove/update/clone mutation sites across all 3 tariff repos so the Activity tab actually populates. Can fold into Phase 8 or be its own quick commit.
- **Deferred from Phase 1**: Plan 01.10 Task 3 human walkthrough (48 routes × dev-param states + 8 screenshots).
- **Deferred from Phase 3**: Form-walk visual verification of `/equipment/new` and `/equipment/[id]/edit`.
- **Stub-data residuals from Phase 4**: CEDEX dictionary backfill, IICL-6 thresholds backfill, auth/role gating on Approve.

### Phase 7 Close-out Log (2026-05-19, sealed after 7.6)

Base build (commits 07-01..06):
- 5 shared catalog seeds (`charge-codes.ts` 40, `order-types.ts` 6, `movement-codes.ts` 5, `cargo-categories.ts` 4, `vendors.ts` 12)
- 3 tariff card seeds (standard × 7, liner × 10, vendor × 12) + 3 repos with clone / approve / nextQuotationNo
- 12 new routes + hub rewire + 9 legacy redirects
- Simulator upgraded with Revenue / Cost / Margin

Polish sweeps (7.1-7.6, 18 follow-up commits):
- TOS data-table chrome on list pages (Status / Type pills, mono date columns, expiry RED if past)
- TOS detail chrome: back-arrow + ID badge + status/type pills + "view only" label, 4 hero stat cards, progress bar, tabs (Overview / Charges / Activity), PARTIES & VALIDITY section card
- Same chrome on edit pages with editable Inputs / DateFields / Selects + Save/Cancel toolbar
- ChargeRowEditor: tight modal, grouped Select for Charge Code (CEDEX / Services optgroups), sections with TOS subtitle labels, dashed dividers, Save-and-add-another carry-forward
- ChargesTable: gecko-table-comfortable with bold mono Charge Code + label, colored pill badges for Type/Unit/Size, hover tint, action icons grouped right end, helpful footer instruction
- Approve / Un Approve toolbar action on detail pages
- Free-Days grid on Liner detail view
- FilterPopover wired on 3 list pages (status / country / tier / category filters per lane)
- Row "..." menu with View / Edit / Duplicate (Liner) / Delete (soft via status=EXPIRED)
- Activity tab reads historyRepo filtered by card id

Total: 24 atomic commits across Phase 7. tsc + 29/29 tests clean throughout.
Open follow-up: `historyRepo.add()` hook wiring (Activity tab shows empty until then).
Hand-off artefact: [07-SUMMARY.md](phases/07-three-tier-tariff/07-SUMMARY.md).

### Phase 4 Close-out Log (v1.0)

- CEDEX seed (50 codes) + IICL-6 thresholds (24 rows) + `getIicl6Verdict()` helper + 6 tests.
- RepairRepo extended with `create()` / `update()` / `nextReference()`.
- `/repair/new` rebuilt as CEDEX-coded multi-line authoring form with inline IICL-6 verdict.
- `/repair/[id]` approve/reject workflow gated on `status === 'awaiting_approval'`.
- 9/9 autonomous gates; 3 stub-data residuals documented.
- Hand-off artefact: [04-SUMMARY.md](phases/04-cedex-repair-coding-iicl6/04-SUMMARY.md).

### Blockers

None.

## Session Continuity

- Roadmap: `.planning/ROADMAP.md` (6 phases, balanced granularity)
- Requirements: `.planning/REQUIREMENTS.md` (21 v1 reqs, traceability filled)
- Strategic roadmap (NOT modified by GSD): `ROADMAP.md` at repo root
- Milestone log: `.planning/MILESTONES.md`
