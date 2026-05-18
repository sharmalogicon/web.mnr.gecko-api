/**
 * Shared seed: Customer (shipping-line) registry.
 * Source of truth: UI-SPEC §9.3 (10 real shipping-line customers).
 * Tier mix: UI-SPEC §9.6 — collapsed for 10-customer set to
 *   2 Platinum / 3 Gold / 4 Silver / 1 Standard.
 *
 * The full 16-customer mix (2P/3G/5S/4Standard/2Bronze) lands in Phase 2
 * when lessors are surfaced as billable customers too.
 *
 * Customer codes follow `C-{4-letter BIC owner code}` convention so plan 07's
 * equipment.bicOwnerCode → bicOwnerCodes → customers FK chain stays trivially
 * derivable from the BIC code printed on the container.
 */

export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';

export interface Customer {
  /** `C-{BIC}` convention. */
  code: string;
  /** Human-readable name. Literal per UI-SPEC §9.3 — auditor greps for these. */
  name: string;
  tier: CustomerTier;
  country?: 'TH' | 'MY' | 'SG' | 'INTL';
}

/** 10 real shipping-line customers per UI-SPEC §9.3. Tier assigned per §9.6 mix. */
export const customers: Customer[] = [
  { code: 'C-MSKU', name: 'Maersk Line',                            tier: 'platinum', country: 'INTL' },
  { code: 'C-CMAU', name: 'CMA CGM (Thailand) Co., Ltd.',           tier: 'platinum', country: 'TH'   },
  { code: 'C-MSCU', name: 'MSC Mediterranean Shipping',             tier: 'gold',     country: 'INTL' },
  { code: 'C-ONEU', name: 'Ocean Network Express (ONE)',            tier: 'gold',     country: 'INTL' },
  { code: 'C-HLXU', name: 'Hapag-Lloyd',                            tier: 'gold',     country: 'INTL' },
  { code: 'C-EVRU', name: 'Evergreen Marine',                       tier: 'silver',   country: 'INTL' },
  { code: 'C-COSU', name: 'COSCO Shipping',                         tier: 'silver',   country: 'INTL' },
  { code: 'C-YMLU', name: 'Yang Ming',                              tier: 'silver',   country: 'INTL' },
  { code: 'C-HMMU', name: 'HMM',                                    tier: 'silver',   country: 'INTL' },
  { code: 'C-ZIMU', name: 'ZIM',                                    tier: 'standard', country: 'INTL' },
];

export function getCustomerByCode(code: string): Customer | undefined {
  return customers.find(c => c.code === code);
}
