/**
 * IICL-6 threshold lookup.
 * Phase 4, D-02 + D-03.
 *
 * IICL-6 is the Institute of International Container Lessors' 6th-edition
 * damage-vs-acceptable-wear standard. Each component has a maximum damage
 * dimension (typically in cm) beyond which the damage is "must-repair"
 * rather than "acceptable wear". Thresholds vary by equipment category —
 * tanks have stricter tolerances than dry boxes because tank shell integrity
 * has different failure modes.
 *
 * The values below are PLAUSIBLE STUBS in the same spirit as the CEDEX seed
 * (Phase 4 D-01). They reflect industry-typical ranges but are not directly
 * lifted from the IICL-6 publication. Backfill from the actual standard
 * remains a Phase 4 residual.
 */

import type { EquipmentCategory } from '@/lib/types';

interface Iicl6Threshold {
  /** Component code from `cedexComponents`. */
  component: string;
  /** Max acceptable damage dimension (cm) per category. `undefined` means no threshold defined for that category. */
  dryMaxCm?: number;
  tankMaxCm?: number;
  reeferMaxCm?: number;
}

export const iicl6Thresholds: Iicl6Threshold[] = [
  { component: 'CCS', dryMaxCm: 5,  tankMaxCm: 3,  reeferMaxCm: 4  }, // corner casting — strict everywhere
  { component: 'DRH', dryMaxCm: 25, tankMaxCm: 10, reeferMaxCm: 15 }, // door header — lenient on dry, tight on tank
  { component: 'FLR', dryMaxCm: 50, tankMaxCm: 0,  reeferMaxCm: 30 }, // floor plank — n/a on tank
  { component: 'FNX', dryMaxCm: 35, tankMaxCm: 0,  reeferMaxCm: 20 }, // front nose panel
  { component: 'GAS', dryMaxCm: 0,  tankMaxCm: 0,  reeferMaxCm: 0  }, // gasket — always replace, never tolerated
  { component: 'LIN', dryMaxCm: 0,  tankMaxCm: 20, reeferMaxCm: 0  }, // tank lining — n/a outside tank
  { component: 'SDR', dryMaxCm: 40, tankMaxCm: 0,  reeferMaxCm: 25 }, // side panel
  { component: 'SHL', dryMaxCm: 0,  tankMaxCm: 30, reeferMaxCm: 0  }, // tank shell — n/a outside tank
];

export type Iicl6Verdict = 'acceptable' | 'must-repair' | 'no-threshold';

/**
 * Returns the IICL-6 verdict for a damage dimension on a given component +
 * equipment category. Components without a threshold for the category return
 * 'no-threshold' (caller should not surface a verdict UI in that case).
 */
export function getIicl6Verdict(
  component: string,
  dimensionCm: number,
  category: EquipmentCategory,
): Iicl6Verdict {
  const row = iicl6Thresholds.find((t) => t.component === component);
  if (!row) return 'no-threshold';
  const max =
    category === 'TANK'
      ? row.tankMaxCm
      : category === 'REEFER'
        ? row.reeferMaxCm
        : row.dryMaxCm;
  if (max === undefined || max === 0) return 'no-threshold';
  return dimensionCm <= max ? 'acceptable' : 'must-repair';
}
