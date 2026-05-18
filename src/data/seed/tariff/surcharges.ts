/**
 * Seed: Surcharges (peak-season, hazmat, after-hours, weekend, emergency).
 * Plan 01.07, Task 2. UI-SPEC §10.1 worked example references all 5 trigger types.
 *
 * A surcharge is either a flat THB add-on (`amountThb`) or a percentage uplift
 * on the base service rate (`percentage`). Exactly one of the two is set; both
 * being present is a data error caught by the tariff engine in Phase 2.
 */

export type SurchargeTrigger =
  | 'peak_season'
  | 'hazmat'
  | 'after_hours'
  | 'weekend'
  | 'emergency';

export interface Surcharge {
  /** e.g. 'SRC-2026-0001'. */
  id: string;
  /** Human-readable name. */
  name: string;
  trigger: SurchargeTrigger;
  /** Mutually exclusive with `percentage`. */
  amountThb?: number;
  /** 0-100. Mutually exclusive with `amountThb`. */
  percentage?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

export const surcharges: Surcharge[] = [
  // 1. Peak-season (Apr-Jun TH high-traffic window) — 15% uplift
  { id: 'SRC-2026-0001', name: 'Peak Season Surcharge (Apr-Jun)',
    trigger: 'peak_season', percentage: 15,
    effectiveFrom: '2026-04-01', effectiveTo: '2026-06-30',
    notes: 'Applies to all DRY survey + storage services across TH depots' },

  // 2. Hazmat handling — flat THB premium for IMO-classed cargo
  { id: 'SRC-2026-0002', name: 'Hazmat Handling Premium (IMO 1/2/4)',
    trigger: 'hazmat', amountThb: 2500,
    effectiveFrom: '2026-01-01',
    notes: 'Flat per-job premium; cumulative with tank washout' },

  // 3. After-hours gate (18:00–06:00) — 25% uplift on labour
  { id: 'SRC-2026-0003', name: 'After-Hours Gate Uplift',
    trigger: 'after_hours', percentage: 25,
    effectiveFrom: '2026-01-01',
    notes: 'Applies to repair_hourly + emergency callouts outside 06:00-18:00' },

  // 4. Weekend (Sat/Sun) — 20% uplift on labour
  { id: 'SRC-2026-0004', name: 'Weekend Labour Uplift',
    trigger: 'weekend', percentage: 20,
    effectiveFrom: '2026-01-01',
    notes: 'Sat/Sun in-shop and gate work' },

  // 5. Emergency callout flat fee
  { id: 'SRC-2026-0005', name: 'Emergency Callout Flat Fee',
    trigger: 'emergency', amountThb: 3500,
    effectiveFrom: '2026-01-01',
    notes: 'Per-incident, on top of regular labour + parts' },
];
