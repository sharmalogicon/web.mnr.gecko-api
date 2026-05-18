/**
 * Shared seed: CEDEX code lookup tables.
 * Phase 4, D-01: PLAUSIBLE STUBS — not the full CEDEX standard dictionary.
 *
 * CEDEX (Container Equipment Damage Exchange) is the industry-standard taxonomy
 * for container repair line items. The full dictionary has hundreds of codes
 * across 4 axes: Location (where on the box), Component (what part), Damage
 * (what's wrong), Repair (what to do). This file ships ~12 codes per axis as
 * a representative subset so the UI + IICL-6 verdict logic can be exercised
 * end-to-end. Phase 4 D-01 documents this as a backfill residual.
 *
 * Reference: existing repair seed at src/data/seed/repair.ts already uses
 * these code shapes (e.g. location '8200' = front panel zone; component 'FNX'
 * = front nose; damage 'BEN' = bent; repair 'STR' = straighten).
 */

export interface CedexCode {
  code: string;
  label: string;
  /** Optional hint about where this code is typically used. */
  notes?: string;
}

/** ISO 6346 zone-style location codes — where on the container the damage is. */
export const cedexLocations: CedexCode[] = [
  { code: '1100', label: 'Door header / top rail',         notes: 'Door end, upper' },
  { code: '1200', label: 'Door lock / cam latch zone',     notes: 'Door end, latches + cams' },
  { code: '1300', label: 'Door bottom sill',               notes: 'Door end, lower' },
  { code: '4100', label: 'Reefer machinery (compressor)',  notes: 'Reefer unit, plant room' },
  { code: '4200', label: 'Reefer controller / sensor',     notes: 'Reefer unit, electrical' },
  { code: '4300', label: 'Reefer evaporator',              notes: 'Reefer unit, evap coil' },
  { code: '4400', label: 'Reefer fan / blower',            notes: 'Reefer unit, fans' },
  { code: '5000', label: 'Tank shell',                     notes: 'Tank, structural shell' },
  { code: '5100', label: 'Tank valves',                    notes: 'Tank, top + bottom valves' },
  { code: '5200', label: 'Tank lining / coating',          notes: 'Tank, internal lining' },
  { code: '5300', label: 'Tank manhole / dome',            notes: 'Tank, access hatch' },
  { code: '6100', label: 'Floor — front section',          notes: 'Dry box floor' },
  { code: '7100', label: 'Corner casting',                 notes: 'Structural corners' },
  { code: '8200', label: 'Front-end panel',                notes: 'Dry box, front (non-door) panel' },
  { code: '8300', label: 'Side panel',                     notes: 'Dry box, side wall' },
];

/** Component codes — what part is being addressed. */
export const cedexComponents: CedexCode[] = [
  { code: 'CAM', label: 'Cam latch'              },
  { code: 'CCS', label: 'Corner casting'         },
  { code: 'CMP', label: 'Compressor (reefer)'    },
  { code: 'DRH', label: 'Door header'            },
  { code: 'EVA', label: 'Evaporator coil'        },
  { code: 'FAN', label: 'Fan / blower'           },
  { code: 'FLR', label: 'Floor plank'            },
  { code: 'FNX', label: 'Front nose panel'       },
  { code: 'GAS', label: 'Gasket / seal'          },
  { code: 'LCK', label: 'Lock rod / handle'      },
  { code: 'LIN', label: 'Lining / coating'       },
  { code: 'MAN', label: 'Manhole / dome'         },
  { code: 'SDR', label: 'Side door / side panel' },
  { code: 'SHL', label: 'Tank shell'             },
  { code: 'SNS', label: 'Sensor (reefer)'        },
  { code: 'VLV', label: 'Valve'                  },
];

/** Damage codes — what's wrong with that component. */
export const cedexDamages: CedexCode[] = [
  { code: 'BEN', label: 'Bent / deformed'                },
  { code: 'BRK', label: 'Broken'                         },
  { code: 'COR', label: 'Corroded'                       },
  { code: 'CRK', label: 'Cracked'                        },
  { code: 'FLT', label: 'Faulty (functional failure)'    },
  { code: 'FOL', label: 'Fouled (build-up)'              },
  { code: 'HOL', label: 'Hole / puncture'                },
  { code: 'LEK', label: 'Leaking'                        },
  { code: 'MIS', label: 'Missing'                        },
  { code: 'SPL', label: 'Split / splintered'             },
  { code: 'WRN', label: 'Worn'                           },
];

/** Repair codes — what action to take. */
export const cedexRepairs: CedexCode[] = [
  { code: 'CLN', label: 'Clean'                          },
  { code: 'COA', label: 'Re-coat'                        },
  { code: 'CRT', label: 'Certify / inspect'              },
  { code: 'PAT', label: 'Patch'                          },
  { code: 'REP', label: 'Repair (general)'               },
  { code: 'RPL', label: 'Replace'                        },
  { code: 'STR', label: 'Straighten'                     },
  { code: 'WLD', label: 'Weld'                           },
];

export function findCedexCode(
  list: CedexCode[],
  code: string,
): CedexCode | undefined {
  return list.find((c) => c.code === code);
}
