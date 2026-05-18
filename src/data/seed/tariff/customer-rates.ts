/**
 * Seed: One-off customer rate overrides.
 * Plan 01.07, Task 2.
 *
 * Used for ad-hoc per-customer rate exceptions that fall outside the master
 * contracts table — e.g. a one-time discount, a temporary peak-season uplift,
 * or a new customer's pre-contract pilot rate.
 */

export interface CustomerRate {
  /** e.g. 'CRT-2026-0001'. */
  id: string;
  /** FK to `customers[].code`. */
  customerCode: string;
  /** Internal service-code key matching `contracts.ContractLine.serviceCode`. */
  serviceCode: string;
  overrideRateThb: number;
  effectiveFrom: string;
  notes?: string;
}

export const customerRates: CustomerRate[] = [
  // 1. COSCO peak-season DRY survey uplift
  { id: 'CRT-2026-0001', customerCode: 'C-COSU', serviceCode: 'survey_dry_40',
    overrideRateThb: 525, effectiveFrom: '2026-04-15',
    notes: 'Peak-season Apr-Jun uplift, COSCO pre-contract' },

  // 2. Yang Ming one-off off-hire survey discount (volume gesture)
  { id: 'CRT-2026-0002', customerCode: 'C-YMLU', serviceCode: 'survey_dry_20',
    overrideRateThb: 380, effectiveFrom: '2026-02-01',
    notes: 'Off-hire batch survey, ~40 boxes' },

  // 3. HMM new-customer pilot rate (DRY repair)
  { id: 'CRT-2026-0003', customerCode: 'C-HMMU', serviceCode: 'repair_hourly',
    overrideRateThb: 320, effectiveFrom: '2026-03-01',
    notes: 'Pilot quarter rate; revisit Q3' },

  // 4. ZIM ad-hoc reefer evaporator clean
  { id: 'CRT-2026-0004', customerCode: 'C-ZIMU', serviceCode: 'reefer_evaporator_clean',
    overrideRateThb: 3450, effectiveFrom: '2026-04-27',
    notes: 'One-off, REP-2026-0011 estimate basis' },

  // 5. CMA CGM emergency-rate uplift
  { id: 'CRT-2026-0005', customerCode: 'C-CMAU', serviceCode: 'emergency_callout',
    overrideRateThb: 1500, effectiveFrom: '2026-01-01',
    notes: 'After-hours emergency callout flat fee, agreed verbally pre-contract' },

  // 6. Evergreen DRY repair hourly post-expiry bridge
  { id: 'CRT-2026-0006', customerCode: 'C-EVRU', serviceCode: 'repair_hourly',
    overrideRateThb: 360, effectiveFrom: '2026-01-01',
    notes: 'Bridge rate while CTR-2026 contract renegotiated' },

  // 7. ONE storage per-diem cap
  { id: 'CRT-2026-0007', customerCode: 'C-ONEU', serviceCode: 'storage_dry_pd',
    overrideRateThb: 60, effectiveFrom: '2026-05-01',
    notes: 'Capped at 60 THB/day for fleet > 50 boxes in storage' },
];
