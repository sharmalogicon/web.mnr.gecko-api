---
phase: 02-data-layer-foundation
type: context
generated: 2026-05-18
status: locked
upstream:
  - .planning/REQUIREMENTS.md (DATA-01, DATA-02)
  - .planning/ROADMAP.md §"Phase 2: Data Layer Foundation"
  - .planning/phases/01-ui-ux-audit-polish/* (seed file inventory)
---

# Phase 2 — Data Layer Foundation — CONTEXT

## Why this phase exists

Phase 1 wired every list and detail route to gecko state components driven by direct imports from `src/data/seed/*`. That worked for Phase 1's UI polish goal, but every page now hard-codes a coupling to a specific seed file and many pages redeclare their own row aliases. Phase 2 introduces a thin **repository layer** between the seed files and the pages so:

1. Pages depend on a **port** (`equipmentRepo`, `repairRepo`, …) instead of a concrete file. The current implementation is `InMemory*Repo` reading the seed; a future `Http*Repo` swaps in via the wiring file in `src/lib/repos/index.ts`.
2. Entity types live in **one canonical place** (`src/lib/types/`) and pages drop their local `SeedX` / `XRow` aliases.

This is **frontend plumbing**, not a backend. Per `.planning/PROJECT.md` + user direction (2026-05-18), v1.0 stays demo-only — repos hold dummy data inline (the current seed TS files). The strict-async + hooks variant of the repo pattern is **not** pursued in this milestone; see D-08 below.

## Decisions (locked)

| ID | Decision | Why | Source |
|----|----------|-----|--------|
| D-01 | **Sync repository API.** Repo methods return `T[]` / `T \| undefined` directly, NOT `Promise<T[]>`. | Demo-only milestone; user direction 2026-05-18: "keep the provision but we have to speed up by using some inline dummy data." Async + hooks would multiply page-rewrite cost without paying off until the REST team ships their endpoint (separate milestone). | User lane decision |
| D-02 | **HTTP-swap is a documented seam, not a built deliverable.** A stub `src/lib/repos/http/<entity>.ts` directory is established and one example file shipped (likely `equipment`) demonstrating the planned async signature. The wiring file `src/lib/repos/index.ts` is the documented single-file swap point. Production swap to async will happen in a future milestone alongside the REST API team's deliverable. | DATA-02 success criterion #2 is met "in principle" — the seam exists — without paying the page-rewrite cost in v1.0. | D-01 |
| D-03 | **Canonical types live at `src/lib/types/<entity>.ts`.** One file per entity. Re-exported through `src/lib/types/index.ts`. Seed files import their types from `@/lib/types` (or the type is moved entirely and seed file imports back). | Single source-of-truth for types so future writes (forms, API layer) reference the same shape as reads. | DATA-01 #3 |
| D-04 | **Collapse page-local aliases.** Every page currently using `type EquipmentRecord as SeedEquipment` / `type Invoice as SeedInvoice` etc. drops the alias and uses the canonical name. Presentation-only row reshapings (`type CleaningRow` etc.) keep their local definitions because they're truly view-specific. | User direction 2026-05-18 ("Yes — collapse local aliases too"). Keeps types DRY without losing presentation flexibility. | User lane decision |
| D-05 | **Seed file contents stay as TypeScript.** Not migrated to JSON. Reason: seed files have computed properties (BIC check-digit derivation in `equipment.ts`), tests reference them at type-level (`equipment.validation.test.ts`), and the BIC CI guard from plan 01.07 still must run on type-checked data. JSON would lose those guarantees. The user's note about "stored as JSON at some place" is interpreted as one acceptable option; we picked TS for the safety reasons above. | Phase 1 D-10 (permanent BIC validation CI guard) requires type-checked seed data | D-01 + Phase 1 D-10 |
| D-06 | **Shared reference tables stay where they are.** `_shared/customers.ts`, `_shared/depots.ts`, `_shared/surveyors.ts`, `_shared/lessors.ts`, `_shared/bic-owner-codes.ts`, `_shared/iso-6346-size-types.ts` continue to live under `src/data/seed/_shared/`. These are reference data (countries, depots), not first-class entities that pages list/edit. They don't get a repo — pages keep direct imports. | Premature abstraction. Reference tables don't need a port. | Pragmatism |
| D-07 | **`src/data/seed/index.ts` barrel remains the seed entry point.** Repos import from it (or from per-entity seed files). The barrel was created by plan 01.07 and is referenced by the BIC CI guard. | No need to break Phase 1's stable surface. | Phase 1 |
| D-08 | **No new React hooks layer in this phase.** Pages call `equipmentRepo.list()` directly during render (sync). Phase 1's dev-param state machines (`?loading=1`/`?error=1`/`?empty=1` gated behind `process.env.NODE_ENV !== 'production'`) remain the source of UI state simulation. When HTTP variant ships in a future milestone, a thin `useEntityList()` hook layer can be added then. | Same reason as D-01: speed for the demo. | D-01 |
| D-09 | **Tariff sub-domain gets repos too**, parallel to main entities. 5 tariff repos: `rateCardRepo`, `customerRateRepo`, `contractRepo`, `surchargeRepo`, `historyRepo`. Same sync API. | DATA-01 #1 says "every list/detail page" — tariff pages are listed in UI-SPEC §12 and were wired in plan 01.08/01.09; they qualify. | Coverage |
| D-10 | **`repos/index.ts` is the wiring file** documented by DATA-02 #2. It exports the active instances: `export const equipmentRepo: EquipmentRepo = new InMemoryEquipmentRepo();`. To swap to HTTP later, change `InMemoryEquipmentRepo` to `HttpEquipmentRepo` on the right-hand side. **No other file** in the codebase should construct or re-instantiate a repo. | Single point of swap; auditable by grep. | DATA-02 |
| D-11 | **Repo interface includes only `list()` + `get(id)` for v1.0.** Write methods (`create`, `update`, `remove`) are not introduced because no page actually persists writes in this milestone (forms simulate). When write-back becomes a real feature (separate milestone), the interface grows additively. | YAGNI for v1.0; the seam is already there for additive extension. | Scope |
| D-12 | **Entity-name canonicalization.** Keep existing exported type names from the seed files — they're already canonical (`EquipmentRecord`, `RepairJob`, `Invoice`, `Surveyor`, `Contract`, etc.). Do NOT rename `EquipmentRecord → Equipment` or similar in this phase. Page-local **aliases** (`as SeedEquipment`, `as SeedInvoice`) get removed; the canonical type name passes through unchanged. | Renaming would touch the test file + BIC CI guard + ~20 pages for cosmetic gain. Risk > reward. | Pragmatism |
| D-13 | **Verification surface.** No page imports from `@/data/seed/<entity>` directly (except `_shared/*` per D-06). Enforce via grep gate in plan 02.04. Tariff page imports must go through `@/lib/repos`. | Audit gate. | DATA-01 + DATA-02 |
| D-14 | **Phase 2 ships when all 11 main entities + 5 tariff entities + 0 shared (per D-06) have repos in `src/lib/repos/` AND every page that previously imported from `@/data/seed/<entity>` now imports from `@/lib/repos`. tsc + 17/17 tests pass. Plus an HTTP-stub example for `equipment` exists at `src/lib/repos/http/equipment.ts`.** | Falsifiable phase exit criteria. | Goal-backward |

## Entity inventory (input)

**Main entities (11):** equipment, repair, survey, cleaning, storage, parts, billing, modification, emergency, integrations, users

**Tariff entities (5):** rate-cards, customer-rates, contracts, surcharges, history

**Shared reference (no repo per D-06):** customers, depots, surveyors, lessors, bic-owner-codes, iso-6346-size-types

## Out of scope

- Async / Promise-based repo API (D-01, D-08)
- React hooks layer (D-08)
- Write operations on the repo interface (D-11)
- Entity-name renaming (D-12)
- Shared reference table repos (D-06)
- Migrating seed contents to JSON (D-05)
- Actually wiring the HTTP variant — stub-only (D-02)

## Risk & mitigations

| Risk | Mitigation |
|------|-----------|
| Page rewrites introduce regressions in dev-param state machines | Plan 02.03 does mechanical import-line swap only; logic unchanged. tsc + test suite is the safety net |
| HTTP-swap claim turns out to be hollow when REST team arrives | Plan 02.02 ships at least one HTTP stub demonstrating the async signature. Plan 02.04 documents the actual swap path step-by-step in `02-SUMMARY.md` |
| Tariff sub-domain has namespace re-exports in seed barrel (per plan 01.07 D-9) that could break | Plan 02.02 verifies tariff barrel-import compatibility. Pages have always reached `tariffContracts.contracts` style; repos provide `contractRepo.list()` as the new path |
| BIC CI guard test breaks | Plan 02.01 keeps the type on the seed file (or re-exports it from the new location); test continues to compile |

---

*Locked: 2026-05-18 by Claude in autonomous discuss-phase mode after user lane decisions on (a) async vs sync repo shape, (b) type-alias collapse. No further discussion items pending.*
