/**
 * Zod schemas for the equipment registration + edit form.
 * Phase 3, Plan 03.02.
 *
 * The discriminated union on `category` lets TANK / REEFER carry their
 * type-specific required fields while DRY / BULK / FLAT / OPEN-TOP stay
 * lean. The BIC check digit is validated by reusing the Phase 1 util
 * `isValidContainerNumber` inside a `superRefine` so we never reimplement
 * the algorithm.
 */

import { z } from 'zod';
import { isValidContainerNumber } from '@/lib/iso6346/check-digit';

// --- Common atoms ----------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

/**
 * BIC owner prefix — 3 uppercase letters per ISO 6346 (e.g. "MSK" for Maersk).
 * Combined with the category identifier this forms the 4-char `ownerCode` on
 * the `EquipmentRecord`.
 */
const ownerPrefix = z
  .string()
  .length(3, 'Three uppercase letters')
  .regex(/^[A-Z]{3}$/, 'Owner prefix must be 3 uppercase letters');

const categoryIdentifier = z.enum(['U', 'J', 'Z'], {
  errorMap: () => ({ message: 'Must be U, J, or Z' }),
});

const serial = z
  .string()
  .length(6, 'Six digits')
  .regex(/^\d{6}$/, 'Serial must be 6 digits');

const checkDigit = z.coerce
  .number()
  .int()
  .min(0)
  .max(9);

const isoSizeType = z
  .string()
  .regex(/^\d{2}[A-Z]\d$/i, 'Must be 4 chars like 22G1');

const cscPlateId = z
  .string()
  .regex(
    /^CSC\/[A-Z]{2,3}\/\d{1,3}-\d{1,5}\/\d{4}$/,
    'Format: CSC/CC/NN-NNNN/YYYY (e.g. CSC/TH/12-345/2025)',
  );

const acepRegistration = z
  .string()
  .regex(
    /^ACEP\/[A-Z]{2,3}\/[A-Z0-9-]+$/,
    'Format: ACEP/CC/REGISTRATION (e.g. ACEP/TH/A12345-MSKU)',
  );

// --- Base shape (all categories share this) -------------------------------

const baseShape = {
  ownerPrefix,
  categoryIdentifier,
  serial,
  checkDigit,
  ownerName: z.string().min(1, 'Required'),
  isoSizeType,
  tareKg: z.coerce.number().int().positive(),
  maxGrossKg: z.coerce.number().int().positive(),
  cubeM3: z.coerce.number().nonnegative(),
  depotCode: z.string().min(2, 'Required'),
  status: z.enum([
    'available',
    'in_service',
    'repair',
    'cleaning',
    'storage',
    'off_hire',
  ]),
  lastSurveyDate: isoDate,
  // EQUIP-04
  internalLengthM: z.coerce.number().nonnegative(),
  internalWidthM: z.coerce.number().nonnegative(),
  internalHeightM: z.coerce.number().nonnegative(),
  doorOpeningWidthM: z.coerce.number().nonnegative(),
  doorOpeningHeightM: z.coerce.number().nonnegative(),
  floorType: z.enum(['hardwood', 'plywood', 'bamboo', 'composite', 'steel']),
  // EQUIP-05
  cscPlateId,
  acepRegistration,
  nextPeriodicExam: isoDate,
  structuralTestDate: isoDate,
  intermediateTestDate: isoDate,
} as const;

const drySchema = z.object({ ...baseShape, category: z.literal('DRY') });

const tankSchema = z.object({
  ...baseShape,
  category: z.literal('TANK'),
  tankShellMaterial: z.enum(['316L stainless', 'food-grade lined', 'carbon steel']),
  tankPressureBar: z.coerce.number().positive(),
  tankCapacityL: z.coerce.number().int().positive(),
  tankImoClass: z.enum(['IMO 1', 'IMO 2', 'IMO 4', 'T7']),
});

const reeferSchema = z.object({
  ...baseShape,
  category: z.literal('REEFER'),
  reeferRefrigerant: z.enum(['R-134a', 'R-513A', 'R-404A']),
  reeferUnitModel: z.string().min(1, 'Required'),
  reeferSetpointMinC: z.coerce.number(),
  reeferSetpointMaxC: z.coerce.number(),
  /** EQUIP-06 — only required for REEFER. */
  atpPlateValidity: isoDate,
});

const stubSchema = z.object({
  ...baseShape,
  category: z.enum(['BULK', 'FLAT', 'OPEN-TOP']),
});

export const equipmentSchema = z
  .discriminatedUnion('category', [drySchema, tankSchema, reeferSchema, stubSchema])
  .superRefine((data, ctx) => {
    // BIC check-digit validation against the canonical Phase 1 algorithm.
    // The canonical ID is `<prefix><categoryIdentifier><serial><checkDigit>`
    // — 4 letters + 6 digits + 1 digit = 11 chars total.
    const id = `${data.ownerPrefix}${data.categoryIdentifier}${data.serial}${data.checkDigit}`;
    if (!isValidContainerNumber(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['checkDigit'],
        message: 'BIC check digit invalid for this owner code + serial',
      });
    }
    // MGW must exceed tare
    if (data.maxGrossKg <= data.tareKg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxGrossKg'],
        message: 'Max gross weight must exceed tare',
      });
    }
    // Reefer setpoint range must be ordered
    if (data.category === 'REEFER' && data.reeferSetpointMinC > data.reeferSetpointMaxC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reeferSetpointMaxC'],
        message: 'Max setpoint must be ≥ min setpoint',
      });
    }
  });

export type EquipmentFormInput = z.input<typeof equipmentSchema>;
export type EquipmentFormOutput = z.output<typeof equipmentSchema>;
