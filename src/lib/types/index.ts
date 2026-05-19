// Canonical entity types barrel. The rest of the app imports from here:
//   import type { EquipmentRecord, RepairJob } from '@/lib/types';
//
// Each per-entity file re-exports from the seed file under @/data/seed/,
// keeping the seed as the single source of truth while exposing types at a
// stable, layer-respecting import path. Plan 02.01.

export type * from './equipment';
export type * from './repair';
export type * from './survey';
export type * from './cleaning';
export type * from './storage';
export type * from './parts';
export type * from './billing';
export type * from './modification';
export type * from './emergency';
export type * from './integrations';
export type * from './users';

// Tariff sub-domain
// v1.0 entity types (kept while legacy pages/repos exist; retired at end of Phase 7).
export type * from './tariff/rate-cards';
export type * from './tariff/customer-rates';
export type * from './tariff/contracts';
export type * from './tariff/surcharges';
export type * from './tariff/history';
// Phase 7 3-tier tariff types.
export type * from './tariff/charge-row';
export type * from './tariff/standard';
export type * from './tariff/liner';
export type * from './tariff/vendor';
