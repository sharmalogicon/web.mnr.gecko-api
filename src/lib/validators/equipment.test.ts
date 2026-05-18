import { describe, it, expect } from 'vitest';
import { equipmentSchema } from './equipment';

const baseDry = {
  category: 'DRY' as const,
  ownerPrefix: 'MSK',
  categoryIdentifier: 'U' as const,
  serial: '234567',
  checkDigit: 1,
  ownerName: 'Maersk Line',
  isoSizeType: '22G1',
  tareKg: 2370,
  maxGrossKg: 30480,
  cubeM3: 33.2,
  depotCode: 'LCB',
  status: 'available' as const,
  lastSurveyDate: '2026-04-10',
  internalLengthM: 5.9,
  internalWidthM: 2.35,
  internalHeightM: 2.39,
  doorOpeningWidthM: 2.34,
  doorOpeningHeightM: 2.28,
  floorType: 'hardwood' as const,
  cscPlateId: 'CSC/TH/12-001/2025',
  acepRegistration: 'ACEP/TH/A12001-MSKU',
  nextPeriodicExam: '2027-04-10',
  structuralTestDate: '2023-04-10',
  intermediateTestDate: '2025-10-10',
};

describe('equipmentSchema (Phase 3)', () => {
  it('accepts a valid DRY record with correct BIC check digit', () => {
    const result = equipmentSchema.safeParse(baseDry);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid BIC check digit and points at checkDigit', () => {
    const result = equipmentSchema.safeParse({ ...baseDry, checkDigit: 9 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'checkDigit');
      expect(issue).toBeDefined();
      expect(issue!.message).toMatch(/BIC check digit invalid/);
    }
  });

  it('rejects MGW ≤ tare', () => {
    const result = equipmentSchema.safeParse({ ...baseDry, maxGrossKg: 2000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.join('.') === 'maxGrossKg'),
      ).toBe(true);
    }
  });

  it('requires the ATP plate on REEFER records', () => {
    const reeferMinusAtp = {
      ...baseDry,
      category: 'REEFER' as const,
      ownerPrefix: 'MNB',
      categoryIdentifier: 'U' as const,
      serial: '459832',
      checkDigit: 1,
      ownerName: 'Maersk Reefer',
      isoSizeType: '42R1',
      tareKg: 4800,
      maxGrossKg: 34000,
      reeferRefrigerant: 'R-134a' as const,
      reeferUnitModel: 'Carrier 69NT40',
      reeferSetpointMinC: -25,
      reeferSetpointMaxC: 25,
      // atpPlateValidity intentionally missing
    };
    const result = equipmentSchema.safeParse(reeferMinusAtp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.join('.') === 'atpPlateValidity'),
      ).toBe(true);
    }
  });

  it('rejects a CSC plate in the wrong format', () => {
    const result = equipmentSchema.safeParse({ ...baseDry, cscPlateId: 'no-format' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.join('.') === 'cscPlateId'),
      ).toBe(true);
    }
  });

  it('rejects an out-of-order reefer setpoint range', () => {
    const reeferBadRange = {
      ...baseDry,
      category: 'REEFER' as const,
      ownerPrefix: 'MNB',
      categoryIdentifier: 'U' as const,
      serial: '459832',
      checkDigit: 1,
      ownerName: 'Maersk Reefer',
      isoSizeType: '42R1',
      tareKg: 4800,
      maxGrossKg: 34000,
      reeferRefrigerant: 'R-134a' as const,
      reeferUnitModel: 'Carrier 69NT40',
      reeferSetpointMinC: 10,
      reeferSetpointMaxC: -5,
      atpPlateValidity: '2028-04-22',
    };
    const result = equipmentSchema.safeParse(reeferBadRange);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) => i.path.join('.') === 'reeferSetpointMaxC',
        ),
      ).toBe(true);
    }
  });
});
