---
phase: 06-reefer-survey-pti
type: summary
generated: 2026-05-19
status: shipped-with-stub-data-residual
---

# Phase 6 — Reefer Survey & PTI Workflow — SUMMARY

## What shipped

- **REEFER + PTI checklists already live** in `src/data/seed/_shared/survey-checklists.ts` (drafted in Phase 5 to avoid file-churn split across two commits). 30 + 25 = 55 items. SURV-03 + SURV-04 met.
- **`/survey/new` already handles REEFER + PTI** (Phase 5) — picks the right checklist via `getChecklist(containerType, isPti)`.
- **PTI certificate route** at `/survey/[id]/certificate` (NEW in Phase 6, SURV-05):
  - Print-friendly single-column layout.
  - Renders only when `type === 'pti' && outcome === 'pass'`; otherwise shows a "Certificate unavailable" state explaining why.
  - Shows: reference, performed date, container id + size/type + owner, refrigeration unit + refrigerant + setpoint range, **ATP plate validity** (from EquipmentRecord), depot, surveyor signature block with ATP-qualified flag (when `surveyor.certifications.includes('ATP')`), depot stamp slot.
  - Print via `window.print()`. CSS `@media print` hides the control row.
  - No PDF library — uses the browser's native print-to-PDF.

## Stats

| Metric | Value |
|--------|-------|
| New files | 2 (certificate route + Phase 6 CONTEXT/SUMMARY) |
| Modified files | 0 (Phase 5 already produced the checklists + survey form) |
| REEFER checklist items | 30 |
| PTI checklist items | 25 |
| Phase 6 lines of code | ~200 (certificate page) |
| Test suite | 29/29 |
| Autonomous gates | tsc clean, certificate route exists |

## Success criterion recheck

- **SURV-03** (REEFER ~30-item checklist integrating with PTI workflow): ✓ 30 items grouped External / Doors / Interior / Refrigeration / Plates. PTI is selectable from the same form's type dropdown — "integrates" by living on the same authoring surface.
- **SURV-04** (PTI as distinct survey type + ~25-item checklist with temp ramp / defrost / T-cycle / controller log / ATP): ✓ `type='pti'` selectable; 25 items grouped Setup / Controller / Temp ramp / Defrost / T-cycle / Inspection / ATP.
- **SURV-05** (Passing PTI generates printable certificate with date / surveyor / ATP refs): ✓ `/survey/[id]/certificate` route; renders only on pass-PTI; prints via browser dialog; ATP plate validity highlighted in the cert body.

## Deviations & residuals

| ID | What | Disposition |
|----|------|-------------|
| D-T6-DirectURL | Certificate route reachable only by direct URL — no "View certificate" button on the survey detail page yet | Documented residual; trivial follow-up |
| D-T6-PDF | Uses browser print-to-PDF, not a server-side PDF generator | Pragmatic for v1; documented |
| Phase 5 stub residuals | Carried forward unchanged | — |
| Phase 1 + 3 + 4 residuals | Carried forward unchanged | — |

## Milestone v1.0 status

**With Phase 6 closed, all 6 phases of milestone v1.0 (M&R Phase A — Standards Foundations) are shipped.**

All 21 v1 requirements (UI-01..UI-03 / DATA-01..DATA-02 / EQUIP-01..EQUIP-06 / REPAIR-01..REPAIR-04 / SURV-01..SURV-06) are addressed. Residuals are documented and tracked per phase SUMMARY.md — none block the milestone close, all are clearly-scoped backfills (real CEDEX dictionary, real IICL-6 thresholds, real checklist phrasing, auth context, photo upload, human-verify walk-throughs).

---

*Closed: 2026-05-19 by Claude. Milestone v1.0 ready for archival via `/gsd-complete-milestone`.*
