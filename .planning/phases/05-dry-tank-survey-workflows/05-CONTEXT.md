---
phase: 05-dry-tank-survey-workflows
type: context
generated: 2026-05-19
status: locked
---

# Phase 5 — DRY & TANK Survey Workflows — CONTEXT

## Why this phase exists

Surveys are the main inspection workflow. Phase 1 wired the survey list+detail UI; Phase 2 put it behind the repo; Phase 4 made repair codes real with IICL-6 verdicts. Phase 5 makes the **survey form** real: a checklist of standard items per equipment type, photo-angle prompts, and IICL-6 disposition surfacing on off-hire when the surveyor records a damage measurement.

## Decisions (locked)

| ID | Decision | Why |
|----|----------|-----|
| D-01 | **Survey checklists live in `src/data/seed/_shared/survey-checklists.ts`** as one file containing the DRY (25 items), TANK (20 items), and REEFER (30 items, Phase 6) checklists. Each item has `id`, `category` (External/Internal/Valves/Testing/etc.), `label`, and an optional `measurementCm: boolean` flag indicating that the surveyor records a numeric damage dimension. | Single source of truth; structure mirrors the existing CEDEX seeds. |
| D-02 | **Checklists are PLAUSIBLE STUBS** matching industry conventions — not directly lifted from IICL or any single standard. Phase 5 ships REAL counts (DRY 25 / TANK 20) per requirement, with realistic phrasing. Backfill from a specific source is a documented residual. | Same pattern as Phase 4 CEDEX D-01. |
| D-03 | **Survey form lives at `/survey/new` (rebuild)**. User picks equipment + type, the form renders the checklist matching the equipment's category. Each item is `pass / fail / na` with optional notes. Items with `measurementCm` show a dimension input that triggers `getIicl6Verdict()` inline on **off-hire** surveys per SURV-06. | Reuses Phase 4 helper. |
| D-04 | **6 photo angles for DRY surveys** rendered as labeled placeholder slots (no real upload in v1). For TANK: 4 photo slots (front / left / right / valves). | SURV-01 success criterion #1 requires 6 angles. |
| D-05 | **Survey form submit creates a SurveyRecord** with the picked equipment + type + outcome + cost + notes. Checklist + photos NOT yet persisted on the SurveyRecord schema (would expand the seed shape). Document as a residual for Phase 6 (which already needs schema growth for PTI). | Phase 5 stays focused on the form UX; persistence shape ships in Phase 6. |
| D-06 | **SurveyRepo grows additively** with `create()` + `update()` + `nextReference()`. | Same pattern as Phase 3+4. |
| D-07 | **Phase 5 ships when:** checklist seed + Zod schema + new /survey/new form + IICL-6 verdict on off-hire measurement + SurveyRepo writes + tsc + tests clean. | Goal-backward. |

## Out of scope (deferred to Phase 6 or later)

- REEFER checklist + form rendering (Phase 6)
- PTI checklist + certificate (Phase 6)
- Real photo upload (just labeled placeholders)
- Persisting full checklist + photos on SurveyRecord (Phase 6 schema expansion)
- Specific standard sources (residual)
