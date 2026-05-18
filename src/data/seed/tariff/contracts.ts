/**
 * Seed: Customer master contracts.
 * Plan 01.07, Task 2.
 *
 * Contracts FK to `customers[].code` and override the public rate-card line
 * rates for the named services. Platinum + Gold tier customers get contracts;
 * Silver and Standard fall back to depot rate cards.
 */

export type ContractStatus = 'active' | 'expired' | 'draft';

export interface ContractLine {
  /** Internal service-code key, e.g. 'survey_dry_20'. */
  serviceCode: string;
  overrideRateThb: number;
  notes?: string;
}

export interface Contract {
  /** e.g. 'CTR-2026-0042'. */
  id: string;
  /** Human-readable, e.g. 'Maersk Line 2026 Master'. */
  name: string;
  /** FK to `customers[].code`. */
  customerCode: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: ContractStatus;
  lines: ContractLine[];
}

export const contracts: Contract[] = [
  // 1. Maersk Line — Platinum master, full 2026 calendar year
  { id: 'CTR-2026-0001', name: 'Maersk Line 2026 Master', customerCode: 'C-MSKU',
    effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', status: 'active',
    lines: [
      { serviceCode: 'survey_dry_20',  overrideRateThb:   350, notes: 'Platinum survey rate, 20\' DRY' },
      { serviceCode: 'survey_dry_40',  overrideRateThb:   425 },
      { serviceCode: 'repair_hourly',  overrideRateThb:   300, notes: 'Volume-discounted labour rate' },
      { serviceCode: 'storage_dry_pd', overrideRateThb:    35, notes: 'Platinum per-diem (THB)' },
      { serviceCode: 'pti_reefer',     overrideRateThb:  1800 },
    ],
  },

  // 2. CMA CGM (Thailand) — Platinum, Q2-aligned
  { id: 'CTR-2026-0002', name: 'CMA CGM (Thailand) 2026 H1', customerCode: 'C-CMAU',
    effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30', status: 'active',
    lines: [
      { serviceCode: 'survey_dry_40',  overrideRateThb:   450 },
      { serviceCode: 'repair_hourly',  overrideRateThb:   325 },
      { serviceCode: 'storage_dry_pd', overrideRateThb:    45 },
    ],
  },

  // 3. MSC — Gold
  { id: 'CTR-2026-0003', name: 'MSC Mediterranean Shipping 2026', customerCode: 'C-MSCU',
    effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', status: 'active',
    lines: [
      { serviceCode: 'survey_dry_40',  overrideRateThb:   475 },
      { serviceCode: 'tank_washout',   overrideRateThb:  9500 },
      { serviceCode: 'storage_dry_pd', overrideRateThb:    55 },
    ],
  },

  // 4. ONE — Gold, H1 expiring
  { id: 'CTR-2026-0004', name: 'Ocean Network Express 2026 H1', customerCode: 'C-ONEU',
    effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30', status: 'active',
    lines: [
      { serviceCode: 'survey_dry_40_hc', overrideRateThb:   525 },
      { serviceCode: 'storage_dry_pd',   overrideRateThb:    65 },
    ],
  },

  // 5. Hapag-Lloyd — Gold draft awaiting countersign
  { id: 'CTR-2026-0005', name: 'Hapag-Lloyd 2026 Master (draft)', customerCode: 'C-HLXU',
    effectiveFrom: '2026-06-01', effectiveTo: '2027-05-31', status: 'draft',
    lines: [
      { serviceCode: 'survey_dry_40',  overrideRateThb:   485 },
      { serviceCode: 'repair_hourly',  overrideRateThb:   340 },
      { serviceCode: 'storage_dry_pd', overrideRateThb:    60 },
    ],
  },

  // 6. Evergreen — expired Silver demo (proves the expired status filter)
  { id: 'CTR-2025-0042', name: 'Evergreen Marine 2025', customerCode: 'C-EVRU',
    effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31', status: 'expired',
    lines: [
      { serviceCode: 'survey_dry_20',  overrideRateThb:   400 },
      { serviceCode: 'repair_hourly',  overrideRateThb:   340 },
    ],
  },
];
