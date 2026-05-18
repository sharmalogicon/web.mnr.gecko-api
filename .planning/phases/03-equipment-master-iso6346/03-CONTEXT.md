---
phase: 03-equipment-master-iso6346
type: context
generated: 2026-05-18
status: locked
upstream:
  - .planning/REQUIREMENTS.md (EQUIP-01..EQUIP-06)
  - .planning/ROADMAP.md §"Phase 3: Equipment Master & ISO 6346"
  - .planning/phases/02-data-layer-foundation/02-SUMMARY.md (repo seam)
  - src/data/seed/equipment.ts (existing schema baseline)
---

# Phase 3 — Equipment Master & ISO 6346 — CONTEXT

## Why this phase exists

Phase 1+2 left the equipment domain at: 20 seeded records, a list page, a detail page, a typed `EquipmentRecord` shape with the core BIC + ISO fields, and an `EquipmentRepo` with sync read methods. Phase 3 turns the demo equipment surface into a real **registry** — users can register a new container by entering the four ISO 6346 parts, the system enforces BIC check-digit validity inline, and the captured record carries the full standards payload (CSC, ACEP, periodic exam, structural test, ATP for reefer, type-specific extensions).

## What changes

1. **Schema extension** — `EquipmentRecord` grows with EQUIP-04 internal dimensions / door / floor, EQUIP-05 cert fields, EQUIP-06 ATP date.
2. **Seed backfill** — all 20 existing records get values for the new fields (realistic per the cross-cutting bar).
3. **New routes** — `/equipment/new` (registration form), `/equipment/[id]/edit` (edit form).
4. **Validation library** — `zod` + `react-hook-form` + `@hookform/resolvers` added per user lane decision 2026-05-18.
5. **Repo extension** — `EquipmentRepo.create(rec)` + `update(id, partial)` added.
6. **Detail page refresh** — new sections (Certifications, Specs, Type-specific) display the new fields.

## Decisions (locked)

| ID | Decision | Why | Source |
|----|----------|-----|--------|
| D-01 | **Add zod + react-hook-form + @hookform/resolvers as deps.** Use Zod schemas in `src/lib/validators/equipment.ts`; pages use `useForm` with `zodResolver`. | User lane decision 2026-05-18: "Zod + react-hook-form (industry default)." Schemas are the typed validation source so reads and writes stay aligned. | User |
| D-02 | **BIC check-digit validation lives in the Zod schema as a `.refine()` calling the existing `isValidContainerNumber` from Phase 1.** Inline form error message: "Invalid BIC check digit — expected N." | Reuses the Phase 1 CI guard; no parallel implementations. | Phase 1 D-10 + D-01 |
| D-03 | **ISO 6346 four-part input.** Four separate `<Input>` fields: ownerCode (4 chars), categoryIdentifier (single char U/J/Z), serial (6 digits), checkDigit (auto-computed + read-only). User can type the first three; the fourth fills + the form derives the full container id by concatenation. | EQUIP-01 success criterion #1: "enter the four ISO 6346 parts as discrete fields". | EQUIP-01 |
| D-04 | **Size/type-code picker.** Seed-driven `<Select>` reading from `_shared/iso-6346-size-types`. Options grouped (`<SelectGroup>`) by category — dry (`G`) / tank (`T`) / reefer (`R`) / bulk (`B`) / flat (`P`). Selecting an option auto-fills the `category` field (G→DRY, T→TANK, R→REEFER, B→BULK, P→FLAT). | EQUIP-02 + EQUIP-03 success criteria. | EQUIP-02 |
| D-05 | **Category-conditional sections.** Tank section (shell material, pressure, capacity, IMO class) shows only when category=TANK. Reefer section (refrigerant, unit model, setpoint min/max) + the ATP plate date show only when category=REEFER. Implemented via `watch('category')` from react-hook-form. | EQUIP-03 + EQUIP-06. | EQUIP-03 |
| D-06 | **Universal physical specs** (always required): tareKg, maxGrossKg, payloadKg (auto-computed = MGW − tare), cubeM3, internalLengthM, internalWidthM, internalHeightM, doorOpeningWidthM, doorOpeningHeightM, floorType. The first 4 already exist; the latter 5 are added. | EQUIP-04. | EQUIP-04 |
| D-07 | **Certification fields** (always required for EQUIP-05): cscPlateId (string), acepRegistration (string), nextPeriodicExam (date), structuralTestDate (date, 5-year), intermediateTestDate (date, 2.5-year). Additionally for REEFER: atpPlateValidity (date). | EQUIP-05 + EQUIP-06. | EQUIP-05 |
| D-08 | **Form submission writes through the repo.** Form's `onSubmit` calls `equipmentRepo.create(record)`. The InMemory impl pushes onto the shared seed array. No actual persistence (v1.0 frontend-only). After success, redirect to `/equipment/[new-id]`. | Phase 2 D-11 (read-only API) is relaxed for Phase 3 because EQUIP-01 explicitly requires registration. Repo grows additively. | Phase 2 D-11 |
| D-09 | **Edit page reuses the same Zod schema + form component.** `/equipment/[id]/edit` reads via `equipmentRepo.get(id)`, pre-fills the form via `useForm({ defaultValues })`, submits via `equipmentRepo.update(id, partial)`. Container id (ISO 6346 fields) is read-only on edit. | DRY; the schema/form is the contract. | D-01 |
| D-10 | **Existing seed records get backfilled.** All 20 records gain values for the new EQUIP-04/05/06 fields. Realistic values: CSC plate IDs (e.g. `CSC/USA/12-345/2025`), ACEP registrations (e.g. `ACEP/USA/A12345-MSC`), exam dates (within next 30 months), structural test dates (within next 60 months). For non-REEFER records, ATP is `null`. | Cross-cutting realistic-data bar; permanent CI guard from Phase 1 D-10 must still pass. | Phase 1 D-10 |
| D-11 | **Detail page refresh.** A new `<Tabs>` group on `/equipment/[id]/page.tsx` exposes Overview / Specs / Certifications / Type-specific. The Overview tab keeps the existing summary; the other three render the new fields. | EQUIP-04..06 want the data captured AND viewable. | EQUIP-05 |
| D-12 | **No new tests for the form itself in this phase** — vitest covers schema validation (Zod) at unit level. Form behavior is dev-time only (no Playwright in this project per Phase 1 Task 3 deferral). Carry the visual-verify residual into Phase 3 sign-off the same way: Phase 1 Task 3 + Phase 3 form walk are deferrable human checkpoints. | Reuse Phase 1's pattern. | Phase 1 |
| D-13 | **Detail page suggestion logic stays.** `nearestReference(id, allRefs)` keeps using `equipmentRepo.list().map(r => r.id)` — already wired in Phase 2. | No change. | Phase 2 |
| D-14 | **Phase 3 ships when:** (a) seed schema extended + all 20 records backfilled, (b) Zod schemas exist + tested, (c) /equipment/new + /edit forms exist + render the right conditional fields, (d) repo write methods exist, (e) detail page shows new fields, (f) tsc + tests pass, (g) BIC CI guard still green. | Goal-backward exit criteria. | Goal |

## Out of scope

- Form-walk visual verification (deferred per Phase 1 pattern, D-12)
- Real persistence — InMemory only
- Multi-step wizard UI for the registration form — single-page form with collapsible sections per category, NOT a wizard
- Container photo upload (separate concern, deferred)
- Bulk import of containers (out of v1.0)
- Refactor of `_shared/iso-6346-size-types` content — used as-is

## Risk & mitigations

| Risk | Mitigation |
|------|-----------|
| Adding zod + react-hook-form breaks build | Pin versions to current stable (zod ^3.x, react-hook-form ^7.x, @hookform/resolvers ^3.x). Verify `npm install` succeeds before any feature work. |
| Backfilling 20 seed records introduces invalid BIC check digits | New fields don't touch the id/ownerCode/serial/checkDigit — the BIC guard remains green. tsc + test suite catches type mismatches. |
| The seed-driven size/type-code group affecting `_shared/iso-6346-size-types.ts` schema | Read-only consumption; no schema change in `_shared`. |
| Conditional fields break react-hook-form's typing | Use `discriminatedUnion` in Zod schema with `category` as the discriminator. |
| Repo `create()` mutation drift (records pushed during demo session don't persist across reload) | Documented in 03-SUMMARY as expected behavior of in-memory repo. Future HTTP variant handles persistence. |

---

*Locked: 2026-05-18 by Claude in autonomous discuss-phase mode. User lane decisions captured (Zod + react-hook-form, plan + execute autonomously).*
