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

/**
 * Helper to build a row with sensible defaults.
 *
 * Phase 7.8-C — the legacy positional args orderType/movementCode/chargeType
 * are kept here for backward-compat with existing call sites but are now
 * IGNORED in the output. Those values live on the parent card's `default*`
 * fields. The seed file retains them as in-source documentation of intent.
 */
function r(
  id: string,
  chargeCode: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _orderType: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _movementCode: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _chargeType: string,
  billingUnit: ChargeRow['billingUnit'],
  sellingRateThb: number,
  overrides: Partial<ChargeRow> = {},
): ChargeRow {
  return {
    id,
    chargeCode,
    billingUnit,
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
    r('r-3', 'SVC-SURVEY-REEF', 'M&R-IN',  'FULL IN', 'SURVEY',   'CONT', 750),
    r('r-4', 'SVC-PTI',         'PTI-ONLY','M&R MOVE','PTI',      'CONT', 2100),
    r('r-5', 'SVC-WASH-STD',    'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 1800),
    r('r-6', 'SVC-WASH-FOOD',   'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 30000),
    r('r-7', 'SVC-WASH-CHEM',   'M&R-IN',  'FULL IN', 'CLEANING', 'CONT', 8500),
    r('r-8', 'SVC-STG-NORM',    'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 75),
    r('r-9', 'SVC-STG-REEF',    'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 120),
    r('r-10', 'SVC-STG-DG',     'STORAGE', 'M&R MOVE','STORAGE',  'DAY', 200),
    r('r-11', 'SVC-GATE-IN',    'M&R-IN',  'FULL IN', 'GATE',     'CONT', 350),
    r('r-12', 'SVC-GATE-OUT',   'M&R-OUT', 'FULL OUT','GATE',     'CONT', 350),
    r('r-13', 'SVC-EMERG',      'EMERGENCY','M&R MOVE','EMERGENCY','HOUR',1500),
    r('r-14', 'SVC-LABOR-HR',   'REPAIR-ONLY','M&R MOVE','LABOR', 'HOUR', 350, {
      uom: 'HR',
      labourRateThb: 350,
      // Tiered labor — first 8 hrs base, next 8 +20%, overtime +50%.
      manHoursSlab: [
        { fromHour: 0,  toHour: 8,  manHours: 1.0 },
        { fromHour: 9,  toHour: 16, manHours: 1.2 },
        { fromHour: 17, toHour: 24, manHours: 1.5 },
      ],
    }),
    r('r-15', 'SVC-PLUG-IN',    'STORAGE', 'M&R MOVE','UTILITY',  'DAY', 180),
    // CEDEX repair examples
    r('r-16', 'GAS-RPL', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 2400, {
      containerMode: 'STL',
      damageCode: 'WRN',
      repairCode: 'RPL',
      component: 'GAS',
      uom: 'EA',
      adjustable: true,
      maxQuantity: 6,
      labourRateThb: 350,
      manHoursSlab: [
        { fromHour: 0, toHour: 4, manHours: 1.0 },
        { fromHour: 5, toHour: 8, manHours: 1.5 },
      ],
      materialPriceSlab: [
        { fromQty: 1, toQty: 2,  priceThb: 850, costThb: 620 },
        { fromQty: 3, toQty: 6,  priceThb: 780, costThb: 590 },
        { fromQty: 7, toQty: 99, priceThb: 720, costThb: 540 },
      ],
    }),
    r('r-17', 'FNX-STR', 'REPAIR-ONLY','M&R MOVE','REPAIR','M',   45, {
      containerMode: 'STL',
      damageCode: 'BEN',
      repairCode: 'STR',
      component: 'FNX',
      uom: 'M',
      labourRateThb: 350,
    }),
    r('r-18', 'CCS-WLD', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 6500, {
      containerMode: 'STL',
      damageCode: 'CRK',
      repairCode: 'WLD',
      component: 'CCS',
      uom: 'JOB',
      labourRateThb: 480,
      manHoursSlab: [
        { fromHour: 0, toHour: 6,  manHours: 1.0 },
        { fromHour: 7, toHour: 12, manHours: 1.3 },
      ],
    }),
    r('r-19', 'FLR-RPL', 'REPAIR-ONLY','M&R MOVE','REPAIR','JOB', 850, {
      containerMode: 'STL',
      damageCode: 'BRK',
      repairCode: 'RPL',
      component: 'FLR',
      uom: 'M2',
      adjustable: true,
      maxQuantity: 28,
      materialPriceSlab: [
        { fromQty: 1,  toQty: 4,  priceThb: 850, costThb: 640 },
        { fromQty: 5,  toQty: 12, priceThb: 780, costThb: 600 },
        { fromQty: 13, toQty: 99, priceThb: 700, costThb: 540 },
      ],
    }),
    r('r-20', 'CMP-REP', 'REPAIR-ONLY','M&R MOVE','REPAIR','HOUR', 1200, {
      containerMode: 'REF',
      damageCode: 'WRN',
      repairCode: 'REP',
      component: 'CMP',
      uom: 'HR',
      labourRateThb: 1200,
      manHoursSlab: [
        { fromHour: 0, toHour: 2, manHours: 1.0 },
        { fromHour: 3, toHour: 6, manHours: 1.3 },
        { fromHour: 7, toHour: 12, manHours: 1.8 },
      ],
    }),
  ];
}

/** Common card-header defaults applied to every depot Standard card (Phase 7.8-A). */
const STANDARD_DEFAULTS = {
  defaultOrderType: 'M&R-IN',
  defaultMovementCode: 'M&R MOVE',
  defaultCargoCategory: 'GENERAL' as const,
  defaultPaymentTerm: 'CASH' as const,
  defaultBilledTo: 'AGENT' as const,
  defaultCreditTermDays: 0,
  defaultTruckCategory: '',
};

export const standardTariffCards: StandardTariffCard[] = [
  // Thailand depots
  {
    id: 'STD-LCB-2026', depotCode: 'LCB',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('LCB'),
  },
  {
    id: 'STD-LKR-2026', depotCode: 'LKR',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('LKR'),
  },
  // Malaysia depots — slight uplift on labor + storage to reflect MY cost base
  {
    id: 'STD-PKN-2026', depotCode: 'PKN',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('PKN').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, sellingRateThb: 80 } :
      row,
    ),
  },
  {
    id: 'STD-PKW-2026', depotCode: 'PKW',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('PKW').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, sellingRateThb: 80 } :
      row,
    ),
  },
  {
    id: 'STD-PGU-2026', depotCode: 'PGU',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('PGU').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, sellingRateThb: 380 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, sellingRateThb: 80 } :
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
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('JUR').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, sellingRateThb: 480 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, sellingRateThb: 100 } :
      row.chargeCode === 'SVC-STG-REEF' ? { ...row, sellingRateThb: 160 } :
      row,
    ),
  },
  {
    id: 'STD-PPP-2026', depotCode: 'PPP',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'SALE-CO', approvedOn: '2025-12-15',
    createdBy: 'SALE-CO', createdOn: '2025-12-10',
    ...STANDARD_DEFAULTS,
    rows: baseRowsFor('PPP').map((row) =>
      row.chargeCode === 'SVC-LABOR-HR' ? { ...row, sellingRateThb: 480 } :
      row.chargeCode === 'SVC-STG-NORM' ? { ...row, sellingRateThb: 100 } :
      row.chargeCode === 'SVC-STG-REEF' ? { ...row, sellingRateThb: 160 } :
      row,
    ),
  },
];
