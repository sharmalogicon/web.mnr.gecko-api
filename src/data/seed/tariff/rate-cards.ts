/**
 * Seed: Tariff rate cards.
 * Plan 01.07, Task 2.
 *
 * One rate card per depot — currency mix per UI-SPEC §9.6:
 *   - TH depots (LCB, LKR):  THB (80% of demo data anchors here)
 *   - MY depots (PKN, PGU):  MYR (15%)
 *   - SG depots (JUR, PPP):  SGD (5%)
 *
 * Line rates use UI-SPEC §9.5 cost anchors. THB anchors are the source-of-truth;
 * MYR/SGD lines convert at:  1 THB ≈ 0.13 MYR  ≈ 0.04 SGD (May 2026 reference).
 */

export type RateCardCategory = 'DRY' | 'TANK' | 'REEFER';
export type RateCardServiceCode =
  | 'survey'
  | 'washout'
  | 'repair_hourly'
  | 'pti'
  | 'storage_per_diem'
  | 'pressure_test';

export interface RateCardLine {
  service: RateCardServiceCode;
  category: RateCardCategory;
  /** Field intentionally named `unitRateThb` (THB-internal) even when published in MYR/SGD;
   *  the `currency` field on the parent card determines the display unit. */
  unitRateThb: number;
  unit: 'flat' | 'per_hour' | 'per_day';
}

export interface RateCard {
  /** e.g. 'RC-LCB-2026-Q2'. */
  id: string;
  /** e.g. 'Laem Chabang Q2 2026'. */
  name: string;
  /** FK to `depots[].code`. */
  depotCode: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lines: RateCardLine[];
  currency: 'THB' | 'MYR' | 'SGD';
}

export const rateCards: RateCard[] = [
  // 1. Laem Chabang — THB
  { id: 'RC-LCB-2026-Q2', name: 'Laem Chabang Q2 2026', depotCode: 'LCB',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'THB',
    lines: [
      { service: 'survey',           category: 'DRY',    unitRateThb:   425, unit: 'flat' },
      { service: 'survey',           category: 'TANK',   unitRateThb:  3200, unit: 'flat' },
      { service: 'survey',           category: 'REEFER', unitRateThb:   750, unit: 'flat' },
      { service: 'washout',          category: 'TANK',   unitRateThb: 11500, unit: 'flat' },
      { service: 'repair_hourly',    category: 'DRY',    unitRateThb:   350, unit: 'per_hour' },
      { service: 'pti',              category: 'REEFER', unitRateThb:  2100, unit: 'flat' },
      { service: 'storage_per_diem', category: 'DRY',    unitRateThb:    75, unit: 'per_day' },
      { service: 'pressure_test',    category: 'TANK',   unitRateThb:  3200, unit: 'flat' },
    ],
  },

  // 2. Lat Krabang — THB
  { id: 'RC-LKR-2026-Q2', name: 'Lat Krabang ICD Q2 2026', depotCode: 'LKR',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'THB',
    lines: [
      { service: 'survey',           category: 'DRY',    unitRateThb:   450, unit: 'flat' },
      { service: 'washout',          category: 'TANK',   unitRateThb: 10800, unit: 'flat' },
      { service: 'repair_hourly',    category: 'DRY',    unitRateThb:   350, unit: 'per_hour' },
      { service: 'storage_per_diem', category: 'DRY',    unitRateThb:    75, unit: 'per_day' },
    ],
  },

  // 3. Port Klang Northport — MYR (rates stored in THB-equivalent, display in MYR)
  { id: 'RC-PKN-2026-Q2', name: 'Port Klang Northport Q2 2026', depotCode: 'PKN',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'MYR',
    lines: [
      { service: 'survey',           category: 'DRY',    unitRateThb:   500, unit: 'flat' },
      { service: 'repair_hourly',    category: 'DRY',    unitRateThb:   400, unit: 'per_hour' },
      { service: 'storage_per_diem', category: 'DRY',    unitRateThb:    70, unit: 'per_day' },
    ],
  },

  // 4. Pasir Gudang — MYR
  { id: 'RC-PGU-2026-Q2', name: 'Pasir Gudang Q2 2026', depotCode: 'PGU',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'MYR',
    lines: [
      { service: 'survey',           category: 'TANK',   unitRateThb:  2800, unit: 'flat' },
      { service: 'washout',          category: 'TANK',   unitRateThb: 14750, unit: 'flat' },
      { service: 'pressure_test',    category: 'TANK',   unitRateThb:  3600, unit: 'flat' },
      { service: 'storage_per_diem', category: 'TANK',   unitRateThb:    80, unit: 'per_day' },
    ],
  },

  // 5. Jurong Port — SGD
  { id: 'RC-JUR-2026-Q2', name: 'Jurong Port Q2 2026', depotCode: 'JUR',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'SGD',
    lines: [
      { service: 'survey',           category: 'DRY',    unitRateThb:   550, unit: 'flat' },
      { service: 'repair_hourly',    category: 'DRY',    unitRateThb:   450, unit: 'per_hour' },
      { service: 'storage_per_diem', category: 'DRY',    unitRateThb:    80, unit: 'per_day' },
    ],
  },

  // 6. PSA Pasir Panjang — SGD
  { id: 'RC-PPP-2026-Q2', name: 'PSA Pasir Panjang Q2 2026', depotCode: 'PPP',
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30', currency: 'SGD',
    lines: [
      { service: 'survey',           category: 'REEFER', unitRateThb:   825, unit: 'flat' },
      { service: 'pti',              category: 'REEFER', unitRateThb:  2400, unit: 'flat' },
      { service: 'repair_hourly',    category: 'REEFER', unitRateThb:   500, unit: 'per_hour' },
      { service: 'storage_per_diem', category: 'REEFER', unitRateThb:    90, unit: 'per_day' },
    ],
  },
];
