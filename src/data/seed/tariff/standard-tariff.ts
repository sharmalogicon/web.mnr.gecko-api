/**
 * Seed: Standard tariff cards (one per depot).
 * Phase 7 D-01.
 *
 * Each depot publishes its baseline price list. When a Liner job runs at
 * a depot, the Liner card's row (if any) supersedes; otherwise the depot
 * Standard row applies.
 *
 * Realistic THB pricing per UI-SPEC §9.5 anchors:
 *   - 20' DRY survey: 350–500 THB
 *   - 40' HC reefer survey: 600–900 THB
 *   - Tank pressure test: 2,500–4,000 THB
 *   - Reefer PTI: 1,500–2,500 THB
 *   - Storage per-diem: 75 THB normal, 120 reefer, 200 DG
 */

import type { ChargeRow } from '@/lib/types';
import type { StandardTariffCard } from '@/lib/types';

/** Helper to build a row with sensible defaults. */
function r(
  id: string,
  chargeCode: string,
  orderType: string,
  movementCode: string,
  chargeType: ChargeRow['chargeType'],
  billingUnit: ChargeRow['billingUnit'],
  sellingRateThb: number,
  overrides: Partial<ChargeRow> = {},
): ChargeRow {
  return {
    id,
    chargeCode,
    orderType,
    movementCode,
    chargeType,
    billingUnit,
    cargoCategory: 'GENERAL',
    paymentTerm: 'CASH',
    billedTo: 'AGENT',
    originalRateThb: sellingRateThb,
    discountType: 'NONE',
    sellingRateThb,
    ...overrides,
  };
}

/** Common base rows shared across depots. */
function baseRowsFor(depot: string): ChargeRow[] {
  const _ = depot; // referenced for traceability; depot-specific values applied via overrides
  return [
    r('r-1', 'SVC-SURVEY-DRY',  'M&R-IN',  'FULL IN', 'SURVEY',   'CONT', 425),
    r('r-2', 'SVC-SURVEY-TANK', 'M&R-IN',  'FULL IN', 'SURVEY',   'CONT', 3200),
    r('r-3', 'SVC-SURVEY-REEF', 'M&R-IN',  'FULL IN', 'SURVEY',   'CONT', 750, { cargoCategory: 'REEFER' }),
    r('r-4', 'SVC-PTI',         'PTI-ONLY','M&R MOVE','PTI',      'CONT', 2100, { cargoCategory: 'REEFER' }),
    r('r-5', 'SVC-WASH-STD',    'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 1800),
    r('r-6', 'SVC-WASH-FOOD',   'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 30000, { cargoCategory: 'FOODGRADE' }),
    r('r-7', 'SVC-WASH-CHEM',   'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 8500, { cargoCategory: 'HAZMAT' }),
    r('r-8', 'SVC-STG-NORM',    'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 75),
    r('r-9', 'SVC-STG-REEF',    'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 120, { cargoCategory: 'REEFER' }),
    r('r-10', 'SVC-STG-DG',     'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 200, { cargoCategory: 'HAZMAT' }),
    r('r-11', 'SVC-GATE-IN',    'M&R-IN',  'FULL IN', 'GATE',     'CONT', 350),
    r('r-12', 'SVC-GATE-OUT',   'M&R-OUT', 'FULL OUT','GATE',     'CONT', 350),
    r('r-13', 'SVC-EMERG',      'EMERGENCY','M&R MOVE','EMERGENCY','HOUR',1500),
    r('r-14', 'SVC-LABOR-HR',   'REPAIR-ONLY','M&R MOVE','LABOR', 'HOUR', 350),
    r('r-15', 'SVC-PLUG-IN',    'STORAGE', 'M&R MOVE','UTILITY',  'DAY', 180, { cargoCategory: 'REEFER' }),
    // CEDEX repair examples
    r('r-16', 'GAS-RPL', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 2400),
    r('r-17', 'FNX-STR', 'REPAIR-ONLY','M&R MOVE','REPAIR','M',   45),
    r('r-18', 'CCS-WLD', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 6500),
    r('r-19', 'FLR-RPL', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 850),
    r('r-20', 'CMP-REP', 'REPAIR-ONLY','M&R MOVE','REPAIR','HOUR', 1200, { cargoCategory: 'REEFER' }),
  ];
}

export const standardTariffCards: StandardTariffCard[] = [
  // Thailand depots
  {
    id: 'STD-LCB-2026', depotCode: 'LCB',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('LCB'),
  },
  {
    id: 'STD-LKR-2026', depotCode: 'LKR',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('LKR'),
  },
  // Malaysia depots — slight uplift on labor + storage to reflect MY cost base
  {
    id: 'STD-PKN-2026', depotCode: 'PKN',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('PKN').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, originalRateThb: 380, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, originalRateThb: 80, sellingRateThb: 80 } :
      row,
    ),
  },
  {
    id: 'STD-PKW-2026', depotCode: 'PKW',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('PKW').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, originalRateThb: 380, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, originalRateThb: 80, sellingRateThb: 80 } :
      row,
    ),
  },
  {
    id: 'STD-PGU-2026', depotCode: 'PGU',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('PGU').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, originalRateThb: 380, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, originalRateThb: 80, sellingRateThb: 80 } :
      row,
    ),
  },
  // Singapore depots — premium cost base
  {
    id: 'STD-JUR-2026', depotCode: 'JUR',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('JUR').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, originalRateThb: 480, sellingRateThb: 480 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, originalRateThb: 100, sellingRateThb: 100 } :
      row.chargeCode === 'SVC-STG-REEF' ? { ...row, originalRateThb: 160, sellingRateThb: 160 } :
      row,
    ),
  },
  {
    id: 'STD-PPP-2026', depotCode: 'PPP',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    rows: baseRowsFor('PPP').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, originalRateThb: 480, sellingRateThb: 480 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, originalRateThb: 100, sellingRateThb: 100 } :
      row.chargeCode === 'SVC-STG-REEF' ? { ...row, originalRateThb: 160, sellingRateThb: 160 } :
      row,
    ),
  },
];
