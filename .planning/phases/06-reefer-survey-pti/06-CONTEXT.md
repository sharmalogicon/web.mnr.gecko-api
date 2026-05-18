---
phase: 06-reefer-survey-pti
type: context
generated: 2026-05-19
status: locked
---

# Phase 6 — Reefer Survey & PTI Workflow — CONTEXT

## Why this phase exists

Phase 5 left REEFER (30 items) + PTI (25 items) checklists already living in `src/data/seed/_shared/survey-checklists.ts` and the `/survey/new` form already renders them when the user picks REEFER equipment or selects `type='pti'`. The remaining Phase 6 scope is the **PTI certificate** (SURV-05) — when a PTI survey passes, the system generates a printable certificate showing date, surveyor, and ATP refs.

## Decisions (locked)

| ID | Decision | Why |
|----|----------|-----|
| D-01 | **REEFER checklist (30 items) + PTI checklist (25 items) live in the Phase 5 checklist seed.** Phase 6 uses what Phase 5 wrote; no schema or seed work needed. | Form is already type-aware via `getChecklist(containerType, isPti)`. |
| D-02 | **PTI is a distinct survey type already** — `'pti'` is in the existing `SurveyType` union and selectable from the form's type dropdown. SURV-04 met. | Existing model. |
| D-03 | **PTI certificate route at `/survey/[id]/certificate`.** Renders a print-friendly view (single column, no AppShell chrome) showing: title "PTI Certificate", reference, performed date, surveyor name, equipment id + owner, ATP plate validity (from EquipmentRecord), ATP class declaration, and a signature block. Print via the browser's native dialog (window.print()). | SURV-05 success criterion. |
| D-04 | **Certificate is only valid when `type === 'pti' && outcome === 'pass'`.** Otherwise render a "Certificate unavailable" state with the reason. | SURV-05 says "passing PTI generates the certificate." |
| D-05 | **Same plausible-stub residual as Phase 5** for PTI checklist phrasing. Carried forward. | Phase 5 D-T5-Checklists. |
| D-06 | **Phase 6 ships when:** /survey/[id]/certificate route exists + renders the right artifact for pass-PTI surveys + tsc + tests clean. | Goal-backward. |

## Out of scope

- Real PDF generation (we use the browser's print-to-PDF instead — sufficient for v1)
- Persisting PTI controller log files on the survey record (would need storage)
- Signature capture (signature block has a printed name + line for handwritten signature)
- Certificate numbering scheme (we use the survey reference as the certificate id)
