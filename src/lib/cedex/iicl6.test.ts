import { describe, it, expect } from 'vitest';
import { getIicl6Verdict } from './iicl6';

describe('getIicl6Verdict (Phase 4)', () => {
  it('returns "acceptable" for a corner-casting dent within the dry threshold', () => {
    expect(getIicl6Verdict('CCS', 3, 'DRY')).toBe('acceptable');
  });

  it('returns "must-repair" for a corner-casting dent beyond the dry threshold', () => {
    expect(getIicl6Verdict('CCS', 8, 'DRY')).toBe('must-repair');
  });

  it('applies the stricter tank threshold for the same component', () => {
    // CCS dryMaxCm=5, tankMaxCm=3. A 4cm dent passes on DRY but fails on TANK.
    expect(getIicl6Verdict('CCS', 4, 'DRY')).toBe('acceptable');
    expect(getIicl6Verdict('CCS', 4, 'TANK')).toBe('must-repair');
  });

  it('returns "no-threshold" when the component has no threshold for the category', () => {
    // FLR (floor plank) is tankMaxCm=0 — n/a on tanks.
    expect(getIicl6Verdict('FLR', 10, 'TANK')).toBe('no-threshold');
  });

  it('returns "no-threshold" for unknown components', () => {
    expect(getIicl6Verdict('XYZ', 5, 'DRY')).toBe('no-threshold');
  });

  it('handles tank-only components (lining) correctly', () => {
    expect(getIicl6Verdict('LIN', 10, 'TANK')).toBe('acceptable');
    expect(getIicl6Verdict('LIN', 25, 'TANK')).toBe('must-repair');
    expect(getIicl6Verdict('LIN', 5, 'DRY')).toBe('no-threshold');
  });
});
