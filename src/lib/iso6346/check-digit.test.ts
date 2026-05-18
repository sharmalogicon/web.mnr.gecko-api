import { describe, it, expect } from 'vitest';
import { computeCheckDigit, isValidContainerNumber } from './check-digit';

describe('iso6346 check digit — computeCheckDigit', () => {
  it.each([
    ['MSKU234567', 1],   // Maersk dry — D-11 anchor (corrected 2026-05-18)
    ['CMAU412935', 1],   // CMA CGM dry — D-11 anchor (corrected 2026-05-18)
    ['ONEU786543', 0],   // ONE dry — D-11 anchor (corrected 2026-05-18)
    ['TCNU845321', 0],   // Triton tank — D-11 anchor (corrected 2026-05-18)
    ['BEAU267194', 1],   // Beacon tank — D-11 anchor (corrected 2026-05-18)
    ['MNBU459832', 1],   // Maersk reefer — D-11 anchor (already correct)
    ['MWCU678403', 4],   // Maersk Star Cool reefer — D-11 anchor (corrected 2026-05-18)
  ])('computes check digit for %s = %i', (input, expected) => {
    expect(computeCheckDigit(input as string)).toBe(expected);
  });

  it('handles whitespace and lowercase by normalising input', () => {
    expect(computeCheckDigit('msku 234567')).toBe(1);
    expect(computeCheckDigit('MSKU 234567')).toBe(1);
    expect(computeCheckDigit('  CMAU412935  ')).toBe(1);
  });

  it('throws on malformed shape (not 4 letters + 6 digits)', () => {
    expect(() => computeCheckDigit('AAA1234567')).toThrow();   // 3 letters
    expect(() => computeCheckDigit('AAAA12345')).toThrow();     // 5 digits
    expect(() => computeCheckDigit('1234ABCDEF')).toThrow();    // digits then letters
    expect(() => computeCheckDigit('')).toThrow();              // empty
  });
});

describe('iso6346 check digit — isValidContainerNumber', () => {
  it('accepts all 7 D-11 anchor numbers with correct check digit', () => {
    expect(isValidContainerNumber('MSKU2345671')).toBe(true);
    expect(isValidContainerNumber('CMAU4129351')).toBe(true);
    expect(isValidContainerNumber('ONEU7865430')).toBe(true);
    expect(isValidContainerNumber('TCNU8453210')).toBe(true);
    expect(isValidContainerNumber('BEAU2671941')).toBe(true);
    expect(isValidContainerNumber('MNBU4598321')).toBe(true);
    expect(isValidContainerNumber('MWCU6784034')).toBe(true);
  });

  it('rejects wrong check digit', () => {
    expect(isValidContainerNumber('MSKU2345675')).toBe(false); // anchor with wrong CD (old placeholder)
    expect(isValidContainerNumber('CMAU4129350')).toBe(false); // anchor with wrong CD (old placeholder)
  });

  it('rejects malformed shapes', () => {
    expect(isValidContainerNumber('')).toBe(false);
    expect(isValidContainerNumber('MSKU23456')).toBe(false);    // too short
    expect(isValidContainerNumber('MSKU234567')).toBe(false);   // 10 chars (no CD)
    expect(isValidContainerNumber('1234567890A')).toBe(false);  // wrong shape
    expect(isValidContainerNumber('MSKU 2345671')).toBe(true);  // whitespace OK
  });

  it('accepts lowercase input by normalising', () => {
    expect(isValidContainerNumber('msku2345671')).toBe(true);
  });
});
