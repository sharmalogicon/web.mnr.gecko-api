/**
 * Shared seed: ISO 6346 size/type code registry.
 * Source of truth: UI-SPEC §9.1 + REQUIREMENTS.md cross-cutting acceptance line 12.
 *
 * The 4-character ISO 6346 size/type code is the printed "type code" on every
 * container (e.g. 22G1 = 20' standard dry; 45R1 = 40' high-cube reefer).
 *
 * Coverage (16 codes total):
 *   - DRY    (G group): 22G1, 22G2, 42G1, 42G2, 45G1
 *   - TANK   (T group): 22T1, 22T2, 22T3, 22T6, 42T1
 *   - REEFER (R group): 22R1, 22R8, 42R1, 45R1
 *   - BULK   (B group): 22B1
 *   - FLAT   (P group): 22P1
 *
 * BULK and FLAT are STUBS per REQUIREMENTS.md EQUIP-03 — selectable in the UI
 * but no dedicated workflows in v1.
 */

export type IsoCategory = 'DRY' | 'TANK' | 'REEFER' | 'BULK' | 'FLAT' | 'OPEN-TOP';

export interface IsoSizeType {
  /** 4-char ISO 6346 size/type code, e.g. '22G1'. Uppercase. */
  code: string;
  /** Human-readable label, e.g. "20' standard dry". */
  label: string;
  category: IsoCategory;
  lengthFt: 20 | 40;
  /** True if High Cube (9'6" / 2.9 m external height). */
  heightHc: boolean;
}

/** ISO 6346 size/type code registry per UI-SPEC §9.1 + REQUIREMENTS.md cross-cutting bar. */
export const isoSizeTypes: IsoSizeType[] = [
  // DRY (G group) — 5 codes
  { code: '22G1', label: "20' standard dry",        category: 'DRY',    lengthFt: 20, heightHc: false },
  { code: '22G2', label: "20' open-top dry",        category: 'DRY',    lengthFt: 20, heightHc: false },
  { code: '42G1', label: "40' standard dry",        category: 'DRY',    lengthFt: 40, heightHc: false },
  { code: '42G2', label: "40' open-top dry",        category: 'DRY',    lengthFt: 40, heightHc: false },
  { code: '45G1', label: "40' high-cube dry",       category: 'DRY',    lengthFt: 40, heightHc: true  },

  // TANK (T group) — 5 codes
  { code: '22T1', label: "20' T11 IMO 1 tank",      category: 'TANK',   lengthFt: 20, heightHc: false },
  { code: '22T2', label: "20' T12 IMO 2 tank",      category: 'TANK',   lengthFt: 20, heightHc: false },
  { code: '22T3', label: "20' T7 tank",             category: 'TANK',   lengthFt: 20, heightHc: false },
  { code: '22T6', label: "20' T14 IMO 4 tank",      category: 'TANK',   lengthFt: 20, heightHc: false },
  { code: '42T1', label: "40' T11 IMO 1 tank",      category: 'TANK',   lengthFt: 40, heightHc: false },

  // REEFER (R group) — 4 codes
  { code: '22R1', label: "20' reefer",              category: 'REEFER', lengthFt: 20, heightHc: false },
  { code: '22R8', label: "20' reefer (port-power)", category: 'REEFER', lengthFt: 20, heightHc: false },
  { code: '42R1', label: "40' reefer",              category: 'REEFER', lengthFt: 40, heightHc: false },
  { code: '45R1', label: "40' high-cube reefer",    category: 'REEFER', lengthFt: 40, heightHc: true  },

  // Stubs per REQUIREMENTS.md EQUIP-03 (selectable; no dedicated workflows in v1)
  { code: '22B1', label: "20' bulk",                category: 'BULK',   lengthFt: 20, heightHc: false },
  { code: '22P1', label: "20' flat-rack",           category: 'FLAT',   lengthFt: 20, heightHc: false },
];

export function getIsoSizeType(code: string): IsoSizeType | undefined {
  return isoSizeTypes.find(i => i.code === code.toUpperCase());
}

export function isoSizeTypesByCategory(category: IsoCategory): IsoSizeType[] {
  return isoSizeTypes.filter(i => i.category === category);
}
