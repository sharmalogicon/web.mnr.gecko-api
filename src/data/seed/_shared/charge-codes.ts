/**
 * Shared seed: tariff charge-code master.
 * Phase 7, D-03.
 *
 * Two namespaces:
 *   1) CEDEX-derived (~25 codes) — `<component>-<repair>` combos pulled
 *      from Phase 4's CEDEX seed. These describe repair charges. The
 *      shape mirrors what an M&R operator who already learned Phase 4
 *      repair coding will recognize instantly.
 *   2) SVC-prefix (~15 codes) — non-repair services (surveys, PTI,
 *      washouts, storage per diem, gate, emergency, labor, plug-in).
 *
 * Operator continuity: a CEDEX-derived charge code can be split back
 * into its component + repair parts to look up the underlying Phase 4
 * CEDEX descriptions via `findCedexCode()`.
 */

import {
  cedexComponents,
  cedexRepairs,
  findCedexCode,
} from './cedex';

export type BillingUnit =
  | 'CONT'  // per container
  | 'TEU'   // per twenty-foot equivalent unit
  | 'HOUR'  // labor-hour pricing
  | 'DAY'   // per-diem (storage)
  | 'JOB'   // flat-rate per job
  | 'KG'    // per kilogram (material disposal)
  | 'M';    // per meter (linear straighten/weld)

export type ChargeType =
  | 'REPAIR'
  | 'SURVEY'
  | 'PTI'
  | 'CLEANING'
  | 'STORAGE'
  | 'GATE'
  | 'EMERGENCY'
  | 'LABOR'
  | 'UTILITY';

export interface ChargeCode {
  /** e.g. 'LIN-PAT' or 'SVC-SURVEY-DRY'. */
  code: string;
  /** Human-readable label, e.g. 'Lining patch repair'. */
  label: string;
  defaultBillingUnit: BillingUnit;
  chargeType: ChargeType;
  /** For CEDEX-derived codes — the CEDEX component (FK to cedexComponents). */
  cedexComponent?: string;
  /** For CEDEX-derived codes — the CEDEX repair action (FK to cedexRepairs). */
  cedexRepair?: string;
}

// CEDEX-derived charge codes ----------------------------------------------
// Format: `<COMP>-<REP>` (3 chars each, hyphen-joined).
function cedexCharge(
  component: string,
  repair: string,
  label: string,
  defaultBillingUnit: BillingUnit = 'JOB',
  chargeType: ChargeType = 'REPAIR',
): ChargeCode {
  return {
    code: `${component}-${repair}`,
    label,
    defaultBillingUnit,
    chargeType,
    cedexComponent: component,
    cedexRepair: repair,
  };
}

export const chargeCodes: ChargeCode[] = [
  // ===== CEDEX-derived repair codes =====
  cedexCharge('LIN', 'PAT', 'Lining patch repair'),
  cedexCharge('LIN', 'COA', 'Lining re-coat'),
  cedexCharge('FNX', 'STR', 'Front-nose panel straighten', 'M'),
  cedexCharge('FNX', 'RPL', 'Front-nose panel replace'),
  cedexCharge('SDR', 'STR', 'Side panel straighten', 'M'),
  cedexCharge('SDR', 'RPL', 'Side panel replace'),
  cedexCharge('DRH', 'STR', 'Door header straighten', 'M'),
  cedexCharge('DRH', 'RPL', 'Door header replace'),
  cedexCharge('GAS', 'RPL', 'Gasket / seal replace'),
  cedexCharge('LCK', 'RPL', 'Lock rod / handle replace'),
  cedexCharge('CAM', 'RPL', 'Cam latch replace'),
  cedexCharge('CCS', 'WLD', 'Corner casting weld'),
  cedexCharge('CCS', 'STR', 'Corner casting straighten'),
  cedexCharge('FLR', 'RPL', 'Floor plank replace'),
  cedexCharge('FLR', 'PAT', 'Floor plank patch'),
  cedexCharge('SHL', 'WLD', 'Tank shell weld'),
  cedexCharge('SHL', 'COA', 'Tank shell re-coat'),
  cedexCharge('SHL', 'STR', 'Tank shell straighten', 'M'),
  cedexCharge('VLV', 'RPL', 'Valve replace'),
  cedexCharge('MAN', 'CLN', 'Manhole / dome clean'),
  cedexCharge('MAN', 'RPL', 'Manhole / dome replace'),
  cedexCharge('CMP', 'REP', 'Reefer compressor repair', 'HOUR'),
  cedexCharge('EVA', 'CLN', 'Reefer evaporator clean'),
  cedexCharge('EVA', 'RPL', 'Reefer evaporator replace'),
  cedexCharge('FAN', 'RPL', 'Reefer fan / blower replace'),
  cedexCharge('SNS', 'RPL', 'Reefer sensor replace'),

  // ===== SVC- prefix (non-repair services) =====
  { code: 'SVC-SURVEY-DRY',  label: 'Dry container survey',          defaultBillingUnit: 'CONT', chargeType: 'SURVEY'    },
  { code: 'SVC-SURVEY-TANK', label: 'Tank pressure-test survey',     defaultBillingUnit: 'CONT', chargeType: 'SURVEY'    },
  { code: 'SVC-SURVEY-REEF', label: 'Reefer survey',                 defaultBillingUnit: 'CONT', chargeType: 'SURVEY'    },
  { code: 'SVC-PTI',         label: 'Reefer Pre-Trip Inspection',    defaultBillingUnit: 'CONT', chargeType: 'PTI'       },
  { code: 'SVC-WASH-STD',    label: 'Standard washout',              defaultBillingUnit: 'CONT', chargeType: 'CLEANING'  },
  { code: 'SVC-WASH-FOOD',   label: 'Food-grade washout',            defaultBillingUnit: 'CONT', chargeType: 'CLEANING'  },
  { code: 'SVC-WASH-CHEM',   label: 'Chemical / hazmat washout',     defaultBillingUnit: 'CONT', chargeType: 'CLEANING'  },
  { code: 'SVC-STG-NORM',    label: 'Storage — normal per diem',     defaultBillingUnit: 'DAY',  chargeType: 'STORAGE'   },
  { code: 'SVC-STG-REEF',    label: 'Storage — reefer per diem',     defaultBillingUnit: 'DAY',  chargeType: 'STORAGE'   },
  { code: 'SVC-STG-DG',      label: 'Storage — DG per diem',         defaultBillingUnit: 'DAY',  chargeType: 'STORAGE'   },
  { code: 'SVC-GATE-IN',     label: 'Gate-in handling',              defaultBillingUnit: 'CONT', chargeType: 'GATE'      },
  { code: 'SVC-GATE-OUT',    label: 'Gate-out handling',             defaultBillingUnit: 'CONT', chargeType: 'GATE'      },
  { code: 'SVC-EMERG',       label: 'Emergency response callout',    defaultBillingUnit: 'HOUR', chargeType: 'EMERGENCY' },
  { code: 'SVC-LABOR-HR',    label: 'General labor (per hour)',      defaultBillingUnit: 'HOUR', chargeType: 'LABOR'     },
  { code: 'SVC-PLUG-IN',     label: 'Reefer plug-in (electricity)',  defaultBillingUnit: 'DAY',  chargeType: 'UTILITY'   },
];

export function findChargeCode(code: string): ChargeCode | undefined {
  return chargeCodes.find((c) => c.code === code);
}

/** Resolve a CEDEX-derived charge code back to its component + repair labels. */
export function describeCedexCharge(charge: ChargeCode): string | undefined {
  if (!charge.cedexComponent || !charge.cedexRepair) return undefined;
  const comp = findCedexCode(cedexComponents, charge.cedexComponent);
  const rep = findCedexCode(cedexRepairs, charge.cedexRepair);
  if (!comp || !rep) return undefined;
  return `${comp.label} — ${rep.label}`;
}
