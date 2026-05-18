---
phase: 03-equipment-master-iso6346
type: patterns
generated: 2026-05-18
---

# Phase 3 — Patterns & File Map

## New files

```
src/data/seed/equipment.ts                # extend interface + backfill 20 records (mod)
src/lib/types/equipment.ts                # re-export new types (mod)
src/lib/repos/equipment.ts                # add create() + update() (mod)
src/lib/validators/equipment.ts           # NEW — Zod schemas + tests
src/lib/validators/equipment.test.ts      # NEW — vitest schema tests
src/app/equipment/new/page.tsx            # NEW — registration form
src/app/equipment/[id]/edit/page.tsx      # NEW — edit form
src/app/equipment/[id]/page.tsx           # extend with Specs/Certs/TypeSpecific tabs (mod)
src/components/equipment/EquipmentForm.tsx    # NEW — shared form component
src/components/equipment/IsoSizeTypePicker.tsx # NEW — grouped size/type picker
src/components/equipment/index.ts             # NEW — barrel
```

## Schema extension (EquipmentRecord)

```ts
export interface EquipmentRecord {
  // existing fields...
  id: string;
  ownerCode: string;
  serial: string;
  checkDigit: number;
  ownerName: string;
  isoSizeType: string;
  category: EquipmentCategory;
  tareKg: number;
  maxGrossKg: number;
  payloadKg: number;
  cubeM3: number;
  depotCode: string;
  status: EquipmentStatus;
  lastSurveyDate: string;
  tankShellMaterial?: ...;
  tankPressureBar?: number;
  tankCapacityL?: number;
  tankImoClass?: ...;
  reeferRefrigerant?: ...;
  reeferUnitModel?: string;
  reeferSetpointMinC?: number;
  reeferSetpointMaxC?: number;

  // ---------- NEW in Phase 3 ----------
  // EQUIP-04 internal dimensions + door + floor
  internalLengthM: number;
  internalWidthM: number;
  internalHeightM: number;
  doorOpeningWidthM: number;
  doorOpeningHeightM: number;
  floorType: 'hardwood' | 'plywood' | 'bamboo' | 'composite' | 'steel';

  // EQUIP-05 certifications
  cscPlateId: string;          // e.g. "CSC/USA/12-345/2025"
  acepRegistration: string;    // e.g. "ACEP/USA/A12345-MSC"
  nextPeriodicExam: string;    // ISO date
  structuralTestDate: string;  // ISO date (5-year)
  intermediateTestDate: string;// ISO date (2.5-year)

  // EQUIP-06 ATP plate for REEFER
  atpPlateValidity?: string;   // ISO date — only when category=REEFER
}
```

## Zod schema shape

```ts
// src/lib/validators/equipment.ts
import { z } from 'zod';
import { isValidContainerNumber } from '@/lib/iso6346/check-digit';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const baseSchema = z.object({
  ownerCode: z.string().length(4).regex(/^[A-Z]{4}$/, 'Four uppercase letters'),
  categoryIdentifier: z.enum(['U', 'J', 'Z']),
  serial: z.string().length(6).regex(/^\d{6}$/, 'Six digits'),
  checkDigit: z.number().int().min(0).max(9),
  ownerName: z.string().min(1),
  isoSizeType: z.string().regex(/^\d{2}[A-Z]\d$/),
  tareKg: z.number().int().positive(),
  maxGrossKg: z.number().int().positive(),
  cubeM3: z.number().nonnegative(),
  depotCode: z.string().min(2),
  status: z.enum(['available','in_service','repair','cleaning','storage','off_hire']),
  lastSurveyDate: isoDate,
  internalLengthM: z.number().positive(),
  internalWidthM: z.number().positive(),
  internalHeightM: z.number().positive(),
  doorOpeningWidthM: z.number().positive(),
  doorOpeningHeightM: z.number().positive(),
  floorType: z.enum(['hardwood','plywood','bamboo','composite','steel']),
  cscPlateId: z.string().regex(/^CSC\/[A-Z]{2,3}\/\d{1,3}-\d{1,5}\/\d{4}$/),
  acepRegistration: z.string().regex(/^ACEP\/[A-Z]{2,3}\/[A-Z0-9-]+$/),
  nextPeriodicExam: isoDate,
  structuralTestDate: isoDate,
  intermediateTestDate: isoDate,
});

const drySchema = baseSchema.extend({ category: z.literal('DRY') });
const tankSchema = baseSchema.extend({
  category: z.literal('TANK'),
  tankShellMaterial: z.enum(['316L stainless','food-grade lined','carbon steel']),
  tankPressureBar: z.number().positive(),
  tankCapacityL: z.number().int().positive(),
  tankImoClass: z.enum(['IMO 1','IMO 2','IMO 4','T7']),
});
const reeferSchema = baseSchema.extend({
  category: z.literal('REEFER'),
  reeferRefrigerant: z.enum(['R-134a','R-513A','R-404A']),
  reeferUnitModel: z.string().min(1),
  reeferSetpointMinC: z.number(),
  reeferSetpointMaxC: z.number(),
  atpPlateValidity: isoDate,
});
const stubSchema = baseSchema.extend({
  category: z.enum(['BULK','FLAT','OPEN-TOP']),
});

export const equipmentSchema = z.discriminatedUnion('category', [
  drySchema, tankSchema, reeferSchema, stubSchema,
]).superRefine((data, ctx) => {
  const containerId = `${data.ownerCode}${data.categoryIdentifier}${data.serial}${data.checkDigit}`;
  if (!isValidContainerNumber(containerId)) {
    ctx.addIssue({ code: 'custom', path: ['checkDigit'], message: 'BIC check digit invalid for owner+serial' });
  }
  if (data.maxGrossKg <= data.tareKg) {
    ctx.addIssue({ code: 'custom', path: ['maxGrossKg'], message: 'MGW must exceed tare' });
  }
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
```

## Form structure

Single-page form with `<Card>` sections:
1. ISO 6346 identifier — 4 input fields side-by-side (ownerCode, categoryIdentifier, serial, checkDigit). Read-only on edit.
2. Size/Type & Category — size/type-code picker (auto-fills category)
3. Universal Physical Specs — tareKg, MGW, payload (auto), cube, internal LWH, door WH, floor type
4. Certifications — CSC, ACEP, exam, structural test, intermediate test
5. **TANK only** — shell material, pressure, capacity, IMO class (collapsed when category≠TANK)
6. **REEFER only** — refrigerant, unit model, setpoint min/max, ATP plate (collapsed when category≠REEFER)
7. Submit button with gecko spinner during async (Phase 1 D-04 pattern)

## Verification gates

| # | Gate | Command | Pass |
|---|------|---------|------|
| 1 | Deps installed | `cat package.json \| grep -E "(zod\|react-hook-form\|@hookform/resolvers)"` | 3 hits |
| 2 | Validators present | `ls src/lib/validators/*.ts` | ≥ 2 (schema + test) |
| 3 | Form routes exist | `test -f src/app/equipment/new/page.tsx && test -f src/app/equipment/[id]/edit/page.tsx` | both exist |
| 4 | Shared form component | `test -f src/components/equipment/EquipmentForm.tsx` | exists |
| 5 | Seed schema extended | `grep -E "cscPlateId\|acepRegistration\|atpPlateValidity" src/data/seed/equipment.ts` | ≥ 3 hits |
| 6 | Repo writes added | `grep -E "create\(.*\):.*EquipmentRecord\|update\(" src/lib/repos/equipment.ts` | 2 hits |
| 7 | BIC CI guard still green | `npm test -- equipment.validation` | passes |
| 8 | tsc clean | `npx tsc --noEmit` | exit 0 |
| 9 | All tests pass | `npm test` | green |
