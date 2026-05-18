---
phase: 05-dry-tank-survey-workflows
type: summary
generated: 2026-05-19
status: shipped-with-stub-data-residual
---

# Phase 5 — DRY & TANK Survey Workflows — SUMMARY

## What shipped

- **Survey checklist seed** at `src/data/seed/_shared/survey-checklists.ts` covering DRY (25 items) + TANK (20 items) per SURV-01 + SURV-02. Each item has `category` (External / Doors / Interior / etc.), `label`, optional `measurementCm` flag (the surveyor records a damage dimension), and optional `cedexComponent` for IICL-6 verdict lookup. Phase 6 will add REEFER (30) + PTI (25) to the same file (already drafted to reduce file churn).
- **`SurveyRepo` extended** with `create()` + `update()` + `nextReference()` (`SUR-YYYY-NNNN`).
- **Zod schema** at `src/lib/validators/survey.ts` — `checklistResultSchema` (per-item) + `surveyInputSchema` (≥1 line, valid equipment + surveyor + depot + outcome).
- **`/survey/new` rebuilt** as a checklist-driven form:
  - User picks equipment + type; the form looks up the right checklist via `getChecklist(containerType, isPti)`.
  - Items render grouped by category with pass/fail/na radio + optional dimension input + conditional notes (required on fail).
  - **IICL-6 verdict** surfaces inline on **off-hire** surveys when an item has `cedexComponent` + a dimension is entered. Re-uses the Phase 4 `getIicl6Verdict()` helper — no parallel implementation.
  - 6 photo-angle placeholder slots for DRY (per SURV-01) / 4 for TANK / 5 for REEFER (Phase 6). Upload is a labeled placeholder per D-05.
  - Submit calls `surveyRepo.create()` and redirects to `/survey/[ref]`.

## Stats

| Metric | Value |
|--------|-------|
| New files | 4 (checklist seed, validators/survey.ts, Phase 5 CONTEXT + SUMMARY) |
| Modified files | 2 (survey repo, /survey/new rebuild) |
| Checklist items shipped | DRY 25 + TANK 20 = 45 (Phase 5); REEFER 30 + PTI 25 = +55 (drafted, used by Phase 6) |
| Test suite | 29/29 still passing |
| Autonomous gates | tsc clean, repo writes verified, IICL-6 helper unchanged |

## Success criterion recheck

- **SURV-01** (DRY ~25 items + 6 photo angles): ✓ Checklist has 25 items; `dryPhotoAngles` has 6 entries.
- **SURV-02** (TANK ~20 items, pressure/vacuum/valves): ✓ Checklist has 20 items including dedicated Testing category (pressure/vacuum/hydro/leak) + Valves category (5 items).
- **SURV-06** (Off-hire surfaces IICL-6 verdict on damage measurement): ✓ Per-item inline badge gated on `type === 'off_hire'` + measurement + cedexComponent + threshold-exists.

## Deviations & residuals

| ID | What | Disposition |
|----|------|-------------|
| D-T5-Checklists | Checklists are plausible-stub phrasing, not lifted from a single published standard | Documented residual; same pattern as Phase 4 CEDEX D-01 |
| D-T5-Photos | Photo slots are labeled placeholders (no real upload pipeline) | Documented residual; future work needs storage layer |
| D-T5-Persistence | Full checklist answers + photo URLs not persisted on SurveyRecord schema | Phase 6 will expand the schema if needed; v1.0 ships the form UX |
| Phase 1 Task 3 / Phase 3 form-walk / Phase 4 stubs | Carried forward unchanged | — |

## Recommendation for Phase 6

**Green-light Phase 6 (Reefer Survey & PTI Workflow).** The checklist seed already includes REEFER (30 items) and PTI (25 items), and the `/survey/new` form already renders them when the user picks a REEFER equipment or selects type='pti'. Phase 6 remaining scope: PTI certificate generation route (`/survey/[id]/certificate`) per SURV-05.

---

*Closed: 2026-05-19 by Claude.*
