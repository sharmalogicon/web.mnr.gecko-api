/**
 * BIC ISO 6346 container check-digit algorithm.
 * Reference: Bureau International des Containers (BIC) published specification.
 *
 * Letters map to values per the BIC table (values 11, 22, 33 — multiples of 11 — are skipped):
 *   A=10 B=12 C=13 D=14 E=15 F=16 G=17 H=18 I=19 J=20
 *   K=21 L=23 M=24 N=25 O=26 P=27 Q=28 R=29 S=30 T=31
 *   U=32 V=34 W=35 X=36 Y=37 Z=38
 * Positional weights: 2^0, 2^1, … 2^9.
 * Check digit = (sum_of(value × weight) % 11) % 10.
 * Outer % 10 handles the edge case where sum % 11 == 10 (collapses to 0).
 *
 * Load-bearing for:
 *   - Phase 1 D-10: every seed container number must validate before commit
 *   - Phase 3 EQUIP-04: form-input BIC rejection on invalid check digit
 */

const LETTER_VALUES: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

const TEN_CHAR_SHAPE = /^[A-Z]{4}[0-9]{6}$/;
const ELEVEN_CHAR_SHAPE = /^[A-Z]{4}[0-9]{7}$/;

function normalise(input: string): string {
  return input.toUpperCase().replace(/\s/g, '');
}

/**
 * Returns the 0-9 check digit for a 10-char BIC code (4 letters + 6 digits).
 * Whitespace and case are normalised. Throws on malformed shape.
 */
export function computeCheckDigit(ownerCodeAndSerial: string): number {
  const s = normalise(ownerCodeAndSerial);
  if (!TEN_CHAR_SHAPE.test(s)) {
    throw new Error(
      `Invalid BIC code shape (expected 4 letters + 6 digits): ${ownerCodeAndSerial}`,
    );
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = s[i];
    const v = i < 4 ? LETTER_VALUES[ch] : Number(ch);
    sum += v * (1 << i); // 2^i — positional weight
  }
  return (sum % 11) % 10;
}

/**
 * Returns true iff the 11-char container number's check digit is correct.
 * Whitespace and case are normalised. Returns false on any malformed input.
 */
export function isValidContainerNumber(containerNumber: string): boolean {
  if (typeof containerNumber !== 'string' || containerNumber.length === 0) return false;
  const s = normalise(containerNumber);
  if (!ELEVEN_CHAR_SHAPE.test(s)) return false;
  try {
    return computeCheckDigit(s.slice(0, 10)) === Number(s[10]);
  } catch {
    return false;
  }
}
