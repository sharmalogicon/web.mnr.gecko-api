---
phase: 04-cedex-repair-coding-iicl6
type: context
generated: 2026-05-19
status: locked
upstream:
  - .planning/REQUIREMENTS.md (REPAIR-01..REPAIR-04)
  - .planning/ROADMAP.md §"Phase 4"
  - src/data/seed/repair.ts (existing CEDEX-shaped fields)
---

# Phase 4 — CEDEX Repair Coding & IICL-6 Thresholds — CONTEXT

## Why this phase exists

Plans 01.07 + 03 left the repair entity at: 11 seed records with CEDEX-shaped string codes (`location`, `component`, `damage`, `repair`), no enumeration of valid codes anywhere, and a `/repair/new` stub form using hardcoded damage types. Phase 4 makes the CEDEX coding system **real** — drop-down pickers backed by lookup tables — and surfaces IICL-6 verdicts inline as the user enters damage dimensions, with an estimator → approver hand-off as the gatekeeper for `awaiting_approval → approved` state transitions.

## Decisions (locked)

| ID | Decision | Why |
|----|----------|-----|
| D-01 | **CEDEX codes are plausible stubs, not the full canonical CEDEX dictionary.** Tables hold ~12 codes each for Location / Component / Damage / Repair = ~48 codes total. Documented as a Phase 4 residual to backfill from the actual CEDEX standard later. | User direction 2026-05-19: "Continue anyway with plausible stubs." Real CEDEX requires the published standard which this session cannot fetch. |
| D-02 | **IICL-6 thresholds: per-component dimension limits per equipment type.** Stored as `iicl6Thresholds[component]: { dryMaxCm, tankMaxCm, reeferMaxCm }`. Components without thresholds skip the verdict. | REPAIR-02 success criterion #2. |
| D-03 | **`getIicl6Verdict(component, dimensionCm, category)` helper** lives at `src/lib/cedex/iicl6.ts`. Returns `'acceptable' \| 'must-repair' \| 'no-threshold'`. Verdict surfaces inline in the form when user enters a `dimensionCm`. | Pure function; testable. |
| D-04 | **CEDEX picker is a four-step chain.** Location → filters Component options to those valid in that location; Component → filters Damage options; Damage → filters Repair options. For v1 simplicity, each step shows the full code list with a small `relatedTo` hint rather than strict relational filtering (relational filtering can be added later if it improves UX). | Avoids encoding the full CEDEX relational graph in v1 stubs. |
| D-05 | **Zod schema validates the full RepairJob.** A line is valid when (location, component, damage, repair) are all known codes, hours > 0, costThb > 0, responsibility is one of the 5 enum values. | REPAIR-01 + REPAIR-03. |
| D-06 | **Repair-line authoring lives on `/repair/new`.** Existing stub replaced. User picks equipment, adds N lines via the CEDEX chain + qty/dimension/material/hours/cost/responsibility inputs, sees IICL-6 verdict inline when a dimension is entered. Submit → calls `repairRepo.create()` with status='estimated' and a generated `REP-YYYY-NNNN` reference. | REPAIR-01 + REPAIR-03. |
| D-07 | **Approver workflow on `/repair/[id]`.** When status='awaiting_approval', show two action buttons: "Approve" → status='approved', "Reject" → status='estimated'. No real role-gating in v1 (any user can approve in the demo) — documented as a residual since the project has no auth context yet. | REPAIR-04, demo-only milestone. |
| D-08 | **RepairRepo grows additively with `create(record)` + `update(id, patch)`** matching the Phase 3 pattern. Phase 2's single-wiring-file swap point remains intact. | REPAIR-01 + REPAIR-04. |
| D-09 | **Reference generation:** new repair jobs get `REP-2026-NNNN` where NNNN is the count of existing repairs + 1, zero-padded. Trivial; collision-safe enough for demo. | YAGNI |
| D-10 | **Severity computed from total cost:** total < 5000 THB → 'minor'; 5000–25000 → 'normal'; > 25000 → 'critical'. User can override. | Reasonable default. |
| D-11 | **Phase 4 ships when:** (a) CEDEX seeds exist at `src/data/seed/_shared/cedex.ts`, (b) IICL-6 thresholds + helper at `src/lib/cedex/iicl6.ts` + tests, (c) RepairRepo writes added, (d) `/repair/new` is a CEDEX-coded line authoring form (not the stub), (e) `/repair/[id]` has Approve/Reject buttons when awaiting_approval, (f) tsc + tests pass. | Goal-backward exit criteria. |

## Out of scope

- Full CEDEX dictionary (residual)
- Auth/role enforcement on Approve (residual — no auth context exists in v1)
- Photo upload on repair lines (existing chrome handles this)
- IICL-6 thresholds for components not in our 12-code stub (returns 'no-threshold')
- Survey-driven repair line auto-creation (Phase 5/6 scope)
