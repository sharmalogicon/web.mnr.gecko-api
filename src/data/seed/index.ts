/**
 * Seed barrel — single import point for all 16 entity seeds + shared tables.
 * Plan 01.07, Task 3.
 *
 * Usage (page-level):
 *   import { equipment, repairs, surveys, customers, depots } from '@/data/seed';
 *
 * Tariff sub-domain uses namespace re-exports to keep the shared `lines` /
 * `effectiveFrom` field names from colliding across the 5 sub-files:
 *   import { tariffRateCards, tariffContracts } from '@/data/seed';
 *   tariffRateCards.rateCards.forEach(...)
 *   tariffContracts.contracts.forEach(...)
 */

// Per-entity seed exports (12 main + 4 supplementary per B-1)
export * from './equipment';
export * from './repair';
export * from './survey';
export * from './cleaning';
export * from './storage';
export * from './parts';
export * from './billing';
export * from './modification';
export * from './emergency';
export * from './users';
export * from './integrations';

// Tariff sub-domain (namespaced to avoid `lines` / `effectiveFrom` collisions)
export * as tariffRateCards     from './tariff/rate-cards';
export * as tariffContracts     from './tariff/contracts';
export * as tariffCustomerRates from './tariff/customer-rates';
export * as tariffSurcharges    from './tariff/surcharges';
export * as tariffHistory       from './tariff/history';

// Shared tables (customers, depots, lessors, surveyors, bicOwnerCodes, isoSizeTypes)
export * from './_shared';
