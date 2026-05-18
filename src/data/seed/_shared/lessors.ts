/**
 * Shared seed: Lessor registry.
 * Source of truth: UI-SPEC §9.3 (6 real lessors).
 *
 * Lessor codes follow `L-{4letter}` convention. Each lessor declares the BIC
 * owner codes they operate under — Triton uses both TCNU (dry) and TGHU (reefer),
 * for example. Plan 07's equipment seed FKs equipment.bicOwnerCode → lessors via
 * the bicOwnerCodes intermediate registry.
 */

export interface Lessor {
  /** `L-{4-letter}` convention. */
  code: string;
  /** Human-readable name. Literal per UI-SPEC §9.3 — auditor greps for these. */
  name: string;
  /** All BIC owner codes this lessor operates under (e.g. ['TCNU', 'TGHU'] for Triton). */
  bicOwnerCodes: string[];
}

/** 6 real lessors per UI-SPEC §9.3. */
export const lessors: Lessor[] = [
  { code: 'L-TRTN', name: 'Triton International',            bicOwnerCodes: ['TCNU', 'TGHU'] },
  { code: 'L-BEAC', name: 'Beacon Intermodal Leasing',       bicOwnerCodes: ['BEAU'] },
  { code: 'L-SEAC', name: 'SeaCo Global',                    bicOwnerCodes: ['SEKU'] },
  { code: 'L-FLOR', name: 'Florens Container Services',      bicOwnerCodes: ['FCIU'] },
  { code: 'L-TEXT', name: 'Textainer',                       bicOwnerCodes: ['TEMU'] },
  { code: 'L-CARI', name: 'Caribbean Container Services',    bicOwnerCodes: ['CARU'] }, // a.k.a SeaCastle
];

export function getLessorByBicCode(bicCode: string): Lessor | undefined {
  return lessors.find(l => l.bicOwnerCodes.includes(bicCode));
}

export function getLessorByCode(code: string): Lessor | undefined {
  return lessors.find(l => l.code === code);
}
