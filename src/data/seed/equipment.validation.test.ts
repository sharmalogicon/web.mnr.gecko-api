/**
 * Permanent CI guard — every equipment seed record has a valid BIC check digit.
 * Implements CONTEXT D-10 ("CI / unit test guards against a regression").
 *
 * Runs on every `npm test` invocation. A failure here means someone authored
 * a container number whose 11th digit doesn't pass the BIC ISO 6346 algorithm
 * — fix the digit in `equipment.ts` (use `computeCheckDigit(ownerCode+serial)`).
 *
 * Plan 01.07, Task 3, Step B (preferred vitest variant).
 */

import { describe, it, expect } from 'vitest';
import { equipment } from './equipment';
import { isValidContainerNumber } from '../../lib/iso6346/check-digit';

describe('seed/equipment — BIC validity (CI guard per D-10)', () => {
  it('every equipment record has a valid BIC check digit', () => {
    const fails = equipment.filter(r => !isValidContainerNumber(r.id));
    expect(fails.map(r => r.id)).toEqual([]);
  });

  it('has at least 18 records', () => {
    expect(equipment.length).toBeGreaterThanOrEqual(18);
  });

  it('covers DRY / TANK / REEFER categories', () => {
    const cats = new Set(equipment.map(r => r.category));
    expect(cats.has('DRY')).toBe(true);
    expect(cats.has('TANK')).toBe(true);
    expect(cats.has('REEFER')).toBe(true);
  });

  it('contains all 7 D-11 anchor container numbers (corrected check digits)', () => {
    const ids = equipment.map(r => r.id);
    const anchors = [
      'MSKU2345671', // Maersk dry
      'CMAU4129351', // CMA CGM dry
      'ONEU7865430', // ONE 40' HC dry
      'TCNU8453210', // Triton IMO 1 tank
      'BEAU2671941', // Beacon IMO 4 food-grade tank
      'MNBU4598321', // Maersk reefer
      'MWCU6784034', // Maersk Star Cool reefer
    ];
    for (const anchor of anchors) {
      expect(ids).toContain(anchor);
    }
  });
});
