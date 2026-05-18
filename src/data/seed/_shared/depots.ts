/**
 * Shared seed: Depot registry.
 * Source of truth: UI-SPEC §9.2 (7 real TH/MY/SG depots).
 * Anchors: CONTEXT D-11 + REQUIREMENTS.md cross-cutting acceptance bar.
 *
 * Currency follows UI-SPEC §9.6: THB for TH, MYR for MY, SGD for SG.
 * Every per-entity seed in plan 07 references these by `code`.
 */

export type CountryCode = 'TH' | 'MY' | 'SG';

export interface Depot {
  /** Short 3-letter code used in seeds + UI references. */
  code: string;
  /** Human-readable name. Literal — auditor (plan 10) greps for these. */
  name: string;
  country: CountryCode;
  currency: 'THB' | 'MYR' | 'SGD';
}

/** 7 real TH/MY/SG depots per UI-SPEC §9.2 / REQUIREMENTS.md cross-cutting bar. */
export const depots: Depot[] = [
  { code: 'LCB', name: 'Laem Chabang Port',     country: 'TH', currency: 'THB' },
  { code: 'LKR', name: 'Lat Krabang ICD',       country: 'TH', currency: 'THB' },
  { code: 'PKN', name: 'Port Klang Northport',  country: 'MY', currency: 'MYR' },
  { code: 'PKW', name: 'Port Klang Westport',   country: 'MY', currency: 'MYR' },
  { code: 'PGU', name: 'Pasir Gudang',          country: 'MY', currency: 'MYR' },
  { code: 'JUR', name: 'Jurong Port',           country: 'SG', currency: 'SGD' },
  { code: 'PPP', name: 'PSA Pasir Panjang',     country: 'SG', currency: 'SGD' },
];

export function getDepotByCode(code: string): Depot | undefined {
  return depots.find(d => d.code === code);
}
