---
phase: 04-cedex-repair-coding-iicl6
type: summary
generated: 2026-05-19
status: shipped-with-stub-data-residual
---

# Phase 4 — CEDEX Repair Coding & IICL-6 Thresholds — SUMMARY

## What shipped

- **CEDEX code seed tables** at `src/data/seed/_shared/cedex.ts`. 4 lists (Location 15 codes / Component 16 / Damage 11 / Repair 8 = 50 codes) covering the major DRY / TANK / REEFER zones. **PLAUSIBLE STUBS, not the full canonical CEDEX dictionary** per D-01.
- **IICL-6 threshold lookup** at `src/lib/cedex/iicl6.ts`. 8 component rows × 3 categories = 24 thresholds. Pure `getIicl6Verdict(component, dimensionCm, category)` helper returning `'acceptable' | 'must-repair' | 'no-threshold'`. 6 unit tests at `iicl6.test.ts` covering happy path, threshold-crossing, category strictness ordering, n/a categories, unknown components.
- **RepairRepo extended** (additively) with `create()` + `update()` + `nextReference(year?)` helper. Phase 2's single-wiring-file swap point unchanged.
- **Zod schema** at `src/lib/validators/repair.ts` — `repairLineSchema` (validates CEDEX codes against the seed enums) + `repairJobInputSchema` (requires equipment, customer, estimator, ≥ 1 line).
- **`/repair/new` rebuilt** as a CEDEX-coded line authoring form using react-hook-form's `useFieldArray` (multi-line add/remove). Per-line CEDEX chain (Location → Component → Damage → Repair) + dimension + material + hours + cost + responsibility. **IICL-6 verdict surfaces inline** as a gecko-alert when dimension is entered and the component has a threshold for the selected equipment's category.
- **Approver workflow on `/repair/[id]`** — when `status === 'awaiting_approval'`, the action row shows "Approve" + "Reject (back to estimate)". When `status === 'estimated'`, it shows "Submit for approval". Both flip `record.status` via `repairRepo.update()` and `router.refresh()` to re-render. The legacy "Edit / Quote / Complete" buttons stay (still stubs from Phase 1's UI polish).

## Stats

| Metric | Value |
|--------|-------|
| New files | 6 (CEDEX seed, IICL-6 + test, repair Zod, /repair/new rewrite, plus Phase 4 docs) |
| Modified files | 2 (repair repo, repair detail page) |
| CEDEX codes seeded | 50 across 4 axes |
| IICL-6 threshold rows | 8 components × 3 categories |
| IICL-6 tests | 6 |
| Total test suite | 29/29 passing |
| Autonomous gates | 9/9 pass |
| Approver state transitions | 3 (estimated → awaiting_approval; awaiting_approval → approved; awaiting_approval → estimated) |

## Success criterion recheck (REQUIREMENTS.md)

- **REPAIR-01** (CEDEX-coded line authoring + qty/dim/mat/hrs/cost): ✓ `/repair/new` per-line `<Select>` chain over the 4 CEDEX tables; numeric inputs for the rest; submit gated by `repairJobInputSchema` (rejects empty lines / missing equipment / etc.).
- **REPAIR-02** (IICL-6 verdict surfaces inline when dimension entered, per equipment type): ✓ `getIicl6Verdict()` runs on every keystroke that changes `dimensionCm` or `component`; verdict block renders with success-100 (acceptable) or warning-100 (must-repair) tones; suppressed when no threshold exists.
- **REPAIR-03** (Responsibility flag per line, visible at job level): ✓ Per-line `<Select>` over `[owner, operator, depot, insurance, warranty]`; existing detail page already renders the responsibility per line.
- **REPAIR-04** (Estimator → Approver hand-off; approver must explicitly sign off before WIP): ✓ State machine via Approve/Reject buttons gated by `status === 'awaiting_approval'`. **Caveat:** no auth context exists in v1, so any user can press Approve in the demo — documented as a residual.

## Deviations & residuals

| ID | What | Disposition |
|----|------|-------------|
| D-T4-CEDEX | CEDEX seed is a 50-code stub, not the canonical CEDEX dictionary | **Documented residual.** Real implementation needs the published CEDEX standard. The Zod schema enums are driven from the seed, so swapping in the full dictionary is a single-file replacement at `cedex.ts`. |
| D-T4-IICL6 | IICL-6 thresholds are industry-typical ranges, not directly lifted from the IICL-6 publication | **Documented residual.** Same pattern — replace `iicl6Thresholds` in `iicl6.ts`. |
| D-T4-Auth | No role enforcement on Approve | **Documented residual.** Project has no auth context in v1; future work. |
| Phase 1 Task 3 + Phase 3 form-walk | Visual residuals carried forward | Unchanged |

## REST swap path — unchanged

Phase 4 extended `RepairRepo` additively. Same single-wiring-file swap recipe from Phase 2 applies.

## Recommendation for Phase 5

**Green-light Phase 5 (DRY & TANK Survey Workflows).** Phase 4 unblocks Phase 5 because the IICL-6 verdict (REPAIR-02) is now a callable function, and SURV-06's off-hire-survey requirement to "surface IICL-6 acceptable-wear vs must-repair on the survey line" can directly import `getIicl6Verdict()`.

## Hand-off notes

- New repair jobs appended via `/repair/new` live only in the current dev-server process (in-memory, same as Phase 3 equipment).
- The CEDEX picker shows all options at each step (no relational filtering yet) per D-04. Pragmatic for v1.
- IICL-6 verdict is computed client-side — no network call. Will continue to work after the REST swap so long as `getIicl6Verdict` stays pure.

---

*Closed: 2026-05-19 by Claude. 9/9 autonomous gates; 3 documented stub-data residuals (CEDEX, IICL-6, auth).*
