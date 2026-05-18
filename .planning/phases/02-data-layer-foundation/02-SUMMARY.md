---
phase: 02-data-layer-foundation
type: summary
generated: 2026-05-18
status: shipped
---

# Phase 2 — Data Layer Foundation — SUMMARY

## What shipped

- **17 canonical type files** under `src/lib/types/` (11 main entities + 5 tariff entities + barrel). Each re-exports types from the matching seed file so the seed remains the data source of truth while consumers depend on a stable type-import path.
- **17 repository files** under `src/lib/repos/` (16 entity repos + the wiring file `index.ts`). Each entity gets:
  - An `<Entity>Repo` interface with sync `list()` + `get(key)` methods
  - An `InMemory<Entity>Repo` class backed by the seed array
  - The wiring file `src/lib/repos/index.ts` constructs all 16 instances and is the **single swap point** (DATA-02).
- **1 HTTP-stub example** at `src/lib/repos/http/equipment.ts` demonstrating the future async signature (`fetch()`-based). Not wired in v1.0 per D-02; included as documentation.
- **29 pages migrated** off direct `@/data/seed/<entity>` imports. Now consume `@/lib/repos` for data + `@/lib/types` for types. Page-local `Seed*` aliases removed where applicable.
- **Shared reference imports preserved** per D-06: `customers`, `depots`, `surveyors`, `lessors`, `bic-owner-codes`, `iso-6346-size-types` all stay as direct seed imports under `@/data/seed/_shared/*`.

## Stats

| Metric | Value |
|--------|-------|
| Type files created | 17 |
| Repo files created | 17 |
| HTTP stubs | 1 (equipment.ts) |
| Pages migrated | 29 |
| Plans drafted / executed | 4 / 4 |
| Commits | 5 (planning + 02.01 + 02.02 + 02.03 + 02.04 close-out) |
| tsc | clean |
| Tests | 17/17 |
| Autonomous gates passed | 8/8 |
| Human-verify residual | none |

## REST swap recipe (DATA-02 single-file change)

When the REST API team's endpoints arrive, swap to HTTP via:

1. **Confirm contract** — the REST endpoints (`GET /equipment`, `GET /equipment/:id`, etc.) must accept the keys the repos expose (`id` for most; `reference` for repair/survey/cleaning/modification/emergency/storage; `sku` for parts).
2. **Promote interfaces to async** — in each `src/lib/repos/<entity>.ts`, change `list(): T[]` → `list(): Promise<T[]>` and `get(k): T | undefined` → `get(k): Promise<T | null>`. Update the matching `InMemory<Entity>Repo` to `async` (the implementation already returns the right values; just add the keyword).
3. **Add hook layer** — introduce `src/lib/hooks/use<Entity>List.ts` / `use<Entity>Get.ts` wrappers that handle `{ data, loading, error }` state. The dev-param state machines from Phase 1 (`?loading=1`, `?error=1`, `?empty=1`) already model the expected UX.
4. **Migrate pages** — change page-side `equipmentRepo.list()` to `const { data: records, loading, error } = useEquipmentList();`. The state-component branches from Phase 1 already handle loading/error.
5. **The single-file swap** — in `src/lib/repos/index.ts`, change:
   ```ts
   // before
   import { InMemoryEquipmentRepo } from './equipment';
   export const equipmentRepo: EquipmentRepo = new InMemoryEquipmentRepo();
   ```
   to:
   ```ts
   // after
   import { HttpEquipmentRepo } from './http/equipment';
   export const equipmentRepo: EquipmentRepo = new HttpEquipmentRepo(
     process.env.NEXT_PUBLIC_API_BASE!,
   );
   ```

Steps 2–4 are the larger refactor that v1.0 explicitly defers. Step 5 alone is the "single wiring file" change required by DATA-02 and is genuinely a one-file edit (~16 lines) once the interface is async.

## Hand-off note to the REST API team

The shape the frontend will consume from each endpoint matches the existing seed `interface` declarations in `src/data/seed/<entity>.ts`. Stable type paths for the REST team's reference:

- `EquipmentRecord` (key: `id` — BIC identifier, e.g. `MSKU2345671`)
- `RepairJob` (key: `reference`, e.g. `REP-2026-0042`)
- `SurveyRecord` (key: `reference`, e.g. `SUR-2026-0123`)
- `CleaningJob` (key: `reference`, e.g. `CLN-2026-0042`)
- `StorageRecord` (key: `reference`, e.g. `STO-2026-0001`)
- `Part` (key: `sku`, e.g. `PRT-PAN-001`)
- `Invoice` (key: `id`, e.g. `INV-26-009412`)
- `ModificationJob` (key: `reference`, e.g. `MOD-2026-0042`)
- `EmergencyJob` (key: `reference`, e.g. `EMG-2026-0042`)
- `IntegrationEntry` (key: `id`)
- `UserRecord` (key: `id`)
- Tariff: `RateCard`, `CustomerRate`, `Contract`, `Surcharge`, `TariffHistoryEntry` (all `id`)

## Decisions log

See `02-CONTEXT.md` for the 14 locked decisions (D-01 sync API, D-02 documented seam, D-03 types lib location, D-04 alias collapse, D-05 keep seed as TS, D-06 shared tables stay, D-07 seed barrel preserved, D-08 no hooks v1, D-09 tariff has repos, D-10 single wiring file, D-11 read-only API, D-12 no entity renaming, D-13 grep gate, D-14 exit criteria).

## Recommendation for Phase 3

**Green-light Phase 3 (Equipment Master & ISO 6346).** All Phase 2 gates pass cleanly. The repo seam is in place for Phase 3 to introduce write operations (`create`, `update`) additively on the existing interfaces when the equipment-registration forms become real.

Phase 3 should:
- Add `EquipmentRepo.create(rec: EquipmentRecord)` + `update(id, partial)` to the interface
- Refine the equipment seed shape to match the 6 EQUIP requirements (ISO 6346 fields, CSC/ACEP/ATP plates, etc.)
- Build the equipment-registration form against the typed repo

## Phase 1 deferred residual unchanged

Phase 1 plan 01.10 Task 3 (browser walkthrough + 8 screenshots) remains deferred. WALKTHROUGH.md script is ready at `.planning/phases/01-ui-ux-audit-polish/01.10-WALKTHROUGH.md` for pickup when the user is ready.

---

*Closed: 2026-05-18 by Claude in autonomous execute-phase mode. Phase 2 ships clean.*
