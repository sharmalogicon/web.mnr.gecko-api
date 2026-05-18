/**
 * Shared seed: BIC owner-code registry.
 * Source of truth: UI-SPEC §9.1 (18 BIC owner codes — 12 carriers + 6 lessors).
 *
 * Every code referenced in plan 07's equipment seed MUST appear here. Phase 3
 * EQUIP-04 will additionally validate this registry against the BIC public list
 * (https://www.bic-code.org/identification-number/) at build time.
 *
 * Cross-table FK:
 *   - Carriers: customerCode → Customer.code in `customers.ts`
 *   - Lessors:  lessorCode   → Lessor.code   in `lessors.ts`
 *
 * NOTE: This file deliberately does NOT import the BIC check-digit util
 * (`src/lib/iso6346/check-digit.ts`) — owner codes are 4 letters only; check
 * digits apply to the full 11-char container number, which is constructed in
 * plan 07's `equipment.ts` where validation occurs.
 */

export type BicOwnerRole = 'carrier' | 'lessor';

export interface BicOwnerEntry {
  /** 4-letter BIC owner code, e.g. 'MSKU'. Uppercase. */
  code: string;
  /** Owner human-readable name. */
  name: string;
  role: BicOwnerRole;
  /** FK to Customer.code when role === 'carrier'. */
  customerCode?: string;
  /** FK to Lessor.code when role === 'lessor'. */
  lessorCode?: string;
}

/**
 * BIC owner-code registry per UI-SPEC §9.1 (18 entries total).
 * Carrier entries (12) cover the 10 shipping lines; Maersk has 3 BIC codes
 * (MSKU dry, MNBU reefer, MWCU Star Cool) all FK'ing to C-MSKU.
 * Lessor entries (6) — Triton has 2 codes (TCNU dry, TGHU reefer) → L-TRTN.
 */
export const bicOwnerCodes: BicOwnerEntry[] = [
  // Carriers (12 entries)
  { code: 'MSKU', name: 'Maersk Line',                   role: 'carrier', customerCode: 'C-MSKU' },
  { code: 'MNBU', name: 'Maersk Reefer',                 role: 'carrier', customerCode: 'C-MSKU' },
  { code: 'MWCU', name: 'Maersk Star Cool',              role: 'carrier', customerCode: 'C-MSKU' },
  { code: 'CMAU', name: 'CMA CGM',                       role: 'carrier', customerCode: 'C-CMAU' },
  { code: 'MSCU', name: 'MSC Mediterranean Shipping',    role: 'carrier', customerCode: 'C-MSCU' },
  { code: 'ONEU', name: 'Ocean Network Express',         role: 'carrier', customerCode: 'C-ONEU' },
  { code: 'HLXU', name: 'Hapag-Lloyd',                   role: 'carrier', customerCode: 'C-HLXU' },
  { code: 'EVRU', name: 'Evergreen Marine',              role: 'carrier', customerCode: 'C-EVRU' },
  { code: 'COSU', name: 'COSCO Shipping',                role: 'carrier', customerCode: 'C-COSU' },
  { code: 'YMLU', name: 'Yang Ming',                     role: 'carrier', customerCode: 'C-YMLU' },
  { code: 'HMMU', name: 'HMM',                           role: 'carrier', customerCode: 'C-HMMU' },
  { code: 'ZIMU', name: 'ZIM',                           role: 'carrier', customerCode: 'C-ZIMU' },

  // Lessors (6 entries)
  { code: 'TCNU', name: 'Triton International',          role: 'lessor',  lessorCode: 'L-TRTN' },
  { code: 'TGHU', name: 'Triton International (Reefer)', role: 'lessor',  lessorCode: 'L-TRTN' },
  { code: 'BEAU', name: 'Beacon Intermodal Leasing',     role: 'lessor',  lessorCode: 'L-BEAC' },
  { code: 'SEKU', name: 'SeaCo Global',                  role: 'lessor',  lessorCode: 'L-SEAC' },
  { code: 'FCIU', name: 'Florens Container Services',    role: 'lessor',  lessorCode: 'L-FLOR' },
  { code: 'CARU', name: 'Caribbean Container Services',  role: 'lessor',  lessorCode: 'L-CARI' },
];

export function getBicOwner(code: string): BicOwnerEntry | undefined {
  return bicOwnerCodes.find(b => b.code === code.toUpperCase());
}

export function bicOwnersByRole(role: BicOwnerRole): BicOwnerEntry[] {
  return bicOwnerCodes.filter(b => b.role === role);
}
