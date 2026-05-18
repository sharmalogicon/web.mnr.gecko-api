---
phase: 02-data-layer-foundation
type: patterns
generated: 2026-05-18
---

# Phase 2 — Patterns & File Map

## Existing patterns to follow

### Seed file structure (template — every seed file looks like this today)

```ts
// src/data/seed/equipment.ts
export type EquipmentCategory = 'DRY' | 'TANK' | 'REEFER' | ...;
export type EquipmentStatus = 'available' | 'in_service' | ...;
export interface EquipmentRecord {
  id: string;
  // ...
}
export const equipment: EquipmentRecord[] = [
  { id: 'MSKU2345671', /* ... */ },
  // ...
];
```

### Existing page-side import pattern (about to change)

```ts
// src/app/equipment/page.tsx — current state (post Phase 1)
import { equipment as seedEquipment, type EquipmentRecord } from "@/data/seed/equipment";
// ...
const records = forceEmpty ? [] : seedEquipment;
```

### New page-side import pattern (target after Phase 2)

```ts
// src/app/equipment/page.tsx — target state
import { equipmentRepo } from "@/lib/repos";
import type { EquipmentRecord } from "@/lib/types";
// ...
const records = forceEmpty ? [] : equipmentRepo.list();
```

### Existing barrel + index conventions

| Existing barrel | What it does |
|-----------------|--------------|
| `src/data/seed/index.ts` | Re-exports all seed files (created plan 01.07) |
| `src/data/seed/_shared/index.ts` | Re-exports shared reference tables |
| `src/components/shared/index.ts` | Component barrel (DataTable, StatsCard, etc.) |
| `src/components/ui/index.ts` *(does not exist)* — each UI component is its own import path |

→ Phase 2 adds two new barrels:
- `src/lib/types/index.ts`
- `src/lib/repos/index.ts` (this is the wiring file per DATA-02)

## New file map

```
src/lib/
├── iso6346/              # existing
├── levenshtein.ts        # existing
├── utils.ts              # existing
├── types/                # NEW
│   ├── index.ts          #   barrel re-exporting all entity types
│   ├── equipment.ts      #   re-exports EquipmentRecord + status/category unions from seed (single source)
│   ├── repair.ts
│   ├── survey.ts
│   ├── cleaning.ts
│   ├── storage.ts
│   ├── parts.ts
│   ├── billing.ts
│   ├── modification.ts
│   ├── emergency.ts
│   ├── integrations.ts
│   ├── users.ts
│   └── tariff/
│       ├── rate-cards.ts
│       ├── customer-rates.ts
│       ├── contracts.ts
│       ├── surcharges.ts
│       └── history.ts
└── repos/                # NEW
    ├── index.ts          #   THE WIRING FILE (DATA-02). Exports active repo instances.
    ├── equipment.ts      #   EquipmentRepo interface + InMemoryEquipmentRepo class
    ├── repair.ts
    ├── survey.ts
    ├── cleaning.ts
    ├── storage.ts
    ├── parts.ts
    ├── billing.ts
    ├── modification.ts
    ├── emergency.ts
    ├── integrations.ts
    ├── users.ts
    ├── tariff/
    │   ├── rate-cards.ts
    │   ├── customer-rates.ts
    │   ├── contracts.ts
    │   ├── surcharges.ts
    │   └── history.ts
    └── http/             # NEW — stub for future REST swap
        └── equipment.ts  #   one example HttpEquipmentRepo (async, returns Promise) — not wired in
```

## File templates

### `src/lib/types/<entity>.ts`

```ts
// src/lib/types/equipment.ts
// Canonical entity types. Re-exports from the seed file so the seed remains
// the data source while the type lives at a stable import path for the rest
// of the app to depend on.
export type {
  EquipmentRecord,
  EquipmentCategory,
  EquipmentStatus,
} from '@/data/seed/equipment';
```

### `src/lib/types/index.ts` (barrel)

```ts
export type * from './equipment';
export type * from './repair';
// ... (per entity)
export type * from './tariff/rate-cards';
// ... (per tariff entity)
```

### `src/lib/repos/<entity>.ts`

```ts
// src/lib/repos/equipment.ts
import { equipment as seedEquipment } from '@/data/seed/equipment';
import type { EquipmentRecord } from '@/lib/types';

export interface EquipmentRepo {
  list(): EquipmentRecord[];
  get(id: string): EquipmentRecord | undefined;
}

export class InMemoryEquipmentRepo implements EquipmentRepo {
  list(): EquipmentRecord[] {
    return seedEquipment;
  }
  get(id: string): EquipmentRecord | undefined {
    return seedEquipment.find((e) => e.id === id);
  }
}
```

### `src/lib/repos/index.ts` (THE WIRING FILE)

```ts
// src/lib/repos/index.ts
// THE wiring file referenced by REQUIREMENTS DATA-02:
// To swap from in-memory to HTTP, change the right-hand side of each export.
//
// Example:
//   // before:
//   export const equipmentRepo: EquipmentRepo = new InMemoryEquipmentRepo();
//   // after:
//   export const equipmentRepo: EquipmentRepo = new HttpEquipmentRepo(env.API_BASE);
//
// (HTTP variants live under ./http/<entity>.ts. Currently only the equipment
//  HTTP stub exists as a documented example.)

import { InMemoryEquipmentRepo, type EquipmentRepo } from './equipment';
import { InMemoryRepairRepo, type RepairRepo } from './repair';
// ... (per entity)

export const equipmentRepo: EquipmentRepo = new InMemoryEquipmentRepo();
export const repairRepo: RepairRepo = new InMemoryRepairRepo();
// ... (per entity)

export type { EquipmentRepo, RepairRepo /* ... */ } from './<paths>';
```

### `src/lib/repos/http/equipment.ts` (HTTP stub — not wired)

```ts
// src/lib/repos/http/equipment.ts
// Stub demonstrating the async HTTP variant. Not wired in v1.0.
//
// To activate: in src/lib/repos/index.ts, replace:
//   import { InMemoryEquipmentRepo } from './equipment';
//   export const equipmentRepo = new InMemoryEquipmentRepo();
// with:
//   import { HttpEquipmentRepo } from './http/equipment';
//   export const equipmentRepo = new HttpEquipmentRepo(process.env.NEXT_PUBLIC_API_BASE!);
// AND extend the EquipmentRepo interface to async signatures across the codebase.
import type { EquipmentRecord } from '@/lib/types';

export class HttpEquipmentRepo {
  constructor(private base: string) {}
  async list(): Promise<EquipmentRecord[]> {
    const res = await fetch(`${this.base}/equipment`);
    if (!res.ok) throw new Error(`Equipment list failed: ${res.status}`);
    return (await res.json()) as EquipmentRecord[];
  }
  async get(id: string): Promise<EquipmentRecord | null> {
    const res = await fetch(`${this.base}/equipment/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Equipment get failed: ${res.status}`);
    return (await res.json()) as EquipmentRecord;
  }
}
```

## Page migration table (Plan 02.03)

| Page file | Current direct seed import | After Phase 2 |
|-----------|----------------------------|---------------|
| `app/equipment/page.tsx` | `equipment as seedEquipment, type EquipmentRecord` | `equipmentRepo` from `@/lib/repos`; `EquipmentRecord` from `@/lib/types` |
| `app/equipment/[id]/page.tsx` | `equipment` | `equipmentRepo` |
| `app/repair/page.tsx` | `repairs as seedRepairs, type RepairJob as SeedRepairJob` | `repairRepo`; `RepairJob` from `@/lib/types` (no alias) |
| `app/repair/[id]/page.tsx` | `repairs` | `repairRepo` |
| `app/survey/page.tsx` | `surveys as seedSurveys, type SurveyRecord` | `surveyRepo`; `SurveyRecord` from `@/lib/types` |
| `app/survey/[id]/page.tsx` | `surveys` | `surveyRepo` |
| `app/cleaning/page.tsx` | `cleaningJobs as seedCleaningJobs, type CleaningJob as SeedCleaningJob` | `cleaningRepo`; `CleaningJob` from `@/lib/types` |
| `app/cleaning/[id]/page.tsx` | `cleaningJobs` | `cleaningRepo` |
| `app/storage/page.tsx` | `storage as seedStorage` | `storageRepo` |
| `app/parts/page.tsx` | `parts as seedParts, type Part as SeedPart` | `partRepo`; `Part` from `@/lib/types` |
| `app/parts/[id]/page.tsx` | `parts` | `partRepo` |
| `app/billing/page.tsx` | `invoices as seedInvoices, type Invoice as SeedInvoice` | `invoiceRepo`; `Invoice` from `@/lib/types` |
| `app/billing/[id]/page.tsx` | `invoices` | `invoiceRepo` |
| `app/modification/page.tsx` | `modifications as seedModifications, type ModificationJob` | `modificationRepo`; `ModificationJob` from `@/lib/types` |
| `app/modification/[id]/page.tsx` | `modifications` | `modificationRepo` |
| `app/emergency/page.tsx` | `emergencyJobs as seedEmergencyJobs, type EmergencyJob` | `emergencyRepo`; `EmergencyJob` from `@/lib/types` |
| `app/emergency/[id]/page.tsx` | `emergencyJobs` | `emergencyRepo` |
| `app/settings/integrations/page.tsx` | `integrations as seedIntegrations, type IntegrationEntry` | `integrationRepo`; `IntegrationEntry` from `@/lib/types` |
| `app/settings/users/page.tsx` | `users as seedUsers, type UserRecord, type UserRole` | `userRepo`; `UserRecord, UserRole` from `@/lib/types` |
| `app/dashboard/page.tsx` | 4 entities (equipment, repair, survey, cleaning) | 4 repos |
| `app/tariff/page.tsx` | 4 tariff (rateCards, contracts, customerRates, tariffHistory) | 4 tariff repos |
| `app/tariff/rate-cards/page.tsx` | `rateCards, type RateCardServiceCode` | `rateCardRepo`; type from `@/lib/types` |
| `app/tariff/customer-rates/page.tsx` | `customerRates as seedCustomerRates, type CustomerRate as SeedCustomerRate` | `customerRateRepo`; type from `@/lib/types` |
| `app/tariff/customer-rates/[customerId]/page.tsx` | `customerRates` | `customerRateRepo` |
| `app/tariff/customer-rates/[customerId]/edit/page.tsx` | `customerRates` | `customerRateRepo` |
| `app/tariff/contracts/page.tsx` | `contracts as seedContracts, type Contract as SeedContract` | `contractRepo`; type from `@/lib/types` |
| `app/tariff/contracts/[id]/page.tsx` | `contracts, customers` | `contractRepo`; `customers` keeps direct seed import (D-06) |
| `app/tariff/surcharges/page.tsx` | `surcharges as seedSurcharges, type Surcharge, type SurchargeTrigger` | `surchargeRepo`; types from `@/lib/types` |
| `app/tariff/history/page.tsx` | `tariffHistory as seedHistory, type TariffHistoryEntry` | `historyRepo`; type from `@/lib/types` |

**Total page files touched:** ~30 page.tsx files. Mostly mechanical import-line swap.

## Pages NOT touched (per D-06)

These pages import shared reference tables only — they keep their seed imports:
- Any page importing `customers` from `@/data/seed/_shared/customers` (e.g. tariff contracts detail, customer-rates pages) — keeps the direct import.

## Verification gates (Plan 02.04)

| Gate | Command | Pass condition |
|------|---------|----------------|
| Repo coverage | `ls src/lib/repos/*.ts \| wc -l` + tariff sub-dir count | 11 main + 5 tariff = 16 entity repos + 1 index = 17 files |
| Type coverage | `ls src/lib/types/*.ts` + tariff | 11 main + 5 tariff = 16 type files + 1 index = 17 files |
| No page imports from `@/data/seed/<entity>` | `grep -rE "from \"@/data/seed/(equipment\|repair\|survey\|cleaning\|storage\|parts\|billing\|modification\|emergency\|integrations\|users\|tariff/)" src/app/` | 0 hits |
| `_shared` still allowed | `grep -rE "from \"@/data/seed/_shared" src/app/` | > 0 hits OK |
| Wiring file is single swap point | `grep -rE "new InMemory" src/` | only matches in `src/lib/repos/index.ts` |
| HTTP stub exists | `test -f src/lib/repos/http/equipment.ts` | exists |
| tsc clean | `npx tsc --noEmit` | exit 0 |
| Tests pass | `npm test` | 17/17 |
| BIC CI guard still works | covered by tsc + tests | same as Phase 1 |

---

*Generated: 2026-05-18 by Claude in autonomous plan-phase mode after locking 02-CONTEXT.md.*
