/**
 * Zod schemas for tariff card authoring.
 * Phase 7.
 */

import { z } from 'zod';
import { chargeCodes } from '@/data/seed/_shared/charge-codes';
import { orderTypes } from '@/data/seed/_shared/order-types';
import { movementCodes } from '@/data/seed/_shared/movement-codes';
import { cargoCategories } from '@/data/seed/_shared/cargo-categories';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const chargeCodeEnum = z.enum(
  chargeCodes.map((c) => c.code) as [string, ...string[]],
  { errorMap: () => ({ message: 'Pick a charge code' }) },
);
const orderTypeEnum = z.enum(
  orderTypes.map((c) => c.code) as [string, ...string[]],
  { errorMap: () => ({ message: 'Pick an order type' }) },
);
const movementCodeEnum = z.enum(
  movementCodes.map((c) => c.code) as [string, ...string[]],
  { errorMap: () => ({ message: 'Pick a movement code' }) },
);
const cargoCategoryEnum = z.enum(
  cargoCategories.map((c) => c.code) as [string, ...string[]],
);

export const chargeRowSchema = z.object({
  id: z.string().min(1),
  chargeCode: chargeCodeEnum,
  orderType: orderTypeEnum,
  movementCode: movementCodeEnum,
  chargeType: z.enum(['REPAIR', 'SURVEY', 'PTI', 'CLEANING', 'STORAGE', 'GATE', 'EMERGENCY', 'LABOR', 'UTILITY']),
  billingUnit: z.enum(['CONT', 'TEU', 'HOUR', 'DAY', 'JOB', 'KG', 'M']),
  size: z.enum(['20', '40', '45']).optional(),
  isoType: z.string().optional(),
  truckCategory: z.string().optional(),
  cargoCategory: cargoCategoryEnum,
  paymentTerm: z.enum(['CASH', 'CREDIT']),
  billedTo: z.literal('AGENT'),
  originalRateThb: z.coerce.number().nonnegative(),
  discountType: z.enum(['NONE', 'PERCENT', 'FIXED']),
  discountRate: z.coerce.number().nonnegative().optional(),
  sellingRateThb: z.coerce.number().nonnegative(),
  rebate: z.coerce.number().nonnegative().optional(),
  creditTermDays: z.coerce.number().int().nonnegative().optional(),
  slabDay: z
    .object({
      fromDay: z.coerce.number().int().nonnegative(),
      toDay: z.coerce.number().int().positive(),
      rateThb: z.coerce.number().nonnegative(),
    })
    .optional(),
  slabTeu: z
    .object({
      fromTeu: z.coerce.number().int().nonnegative(),
      toTeu: z.coerce.number().int().positive(),
      rateThb: z.coerce.number().nonnegative(),
    })
    .optional(),
});

const freeDaysGroup = z.object({
  normal: z.coerce.number().int().nonnegative(),
  reefer: z.coerce.number().int().nonnegative(),
  dg: z.coerce.number().int().nonnegative(),
});
const emptyFreeDaysGroup = z.object({
  normal: z.coerce.number().int().nonnegative(),
  reefer: z.coerce.number().int().nonnegative(),
});

export const standardCardSchema = z.object({
  depotCode: z.string().min(2),
  effectiveDate: isoDate,
  expiryDate: isoDate,
  rows: z.array(chargeRowSchema),
});

export const linerCardSchema = z.object({
  agentCode: z.string().regex(/^C-[A-Z]{4}$/, 'Pick a liner'),
  salesPerson: z.string().min(1),
  contactNo: z.string().optional(),
  effectiveDate: isoDate,
  expiryDate: isoDate,
  freeDays: z.object({
    fullExport: freeDaysGroup,
    fullImport: freeDaysGroup,
    emptyImport: emptyFreeDaysGroup,
  }),
  waiveStorageForEmptyDmContainers: z.boolean(),
  rows: z.array(chargeRowSchema),
});

export const vendorCardSchema = z.object({
  vendorId: z.string().regex(/^V-/, 'Pick a vendor'),
  procurementContact: z.string().min(1),
  effectiveDate: isoDate,
  expiryDate: isoDate,
  rows: z.array(chargeRowSchema),
});

export type ChargeRowInput = z.infer<typeof chargeRowSchema>;
export type StandardCardInput = z.infer<typeof standardCardSchema>;
export type LinerCardInput = z.infer<typeof linerCardSchema>;
export type VendorCardInput = z.infer<typeof vendorCardSchema>;
