/**
 * Canonical tariff charge-row type — shared across Standard, Liner, Vendor.
 * Phase 7.
 */

import type { BillingUnit, ChargeType } from '@/data/seed/_shared/charge-codes';
import type { CargoCategory } from '@/data/seed/_shared/cargo-categories';

export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';
export type PaymentTerm = 'CASH' | 'CREDIT';
export type SizeCode = '20' | '40' | '45';
export type BilledTo = 'AGENT'; // pinned per Phase 7 D-08

export interface SlabDayRule {
  fromDay: number;
  toDay: number;
  rateThb: number;
}

export interface SlabTeuRule {
  fromTeu: number;
  toTeu: number;
  rateThb: number;
}

export interface ChargeRow {
  /** Stable id within the parent tariff card; e.g. `r-1`. */
  id: string;
  /** FK to chargeCodes (e.g. 'LIN-PAT', 'SVC-PTI'). */
  chargeCode: string;
  /** FK to orderTypes. */
  orderType: string;
  /** FK to movementCodes. */
  movementCode: string;
  chargeType: ChargeType;
  billingUnit: BillingUnit;
  size?: SizeCode;
  isoType?: string;
  truckCategory?: string;
  cargoCategory: CargoCategory;
  paymentTerm: PaymentTerm;
  billedTo: BilledTo;
  originalRateThb: number;
  discountType: DiscountType;
  discountRate?: number;
  sellingRateThb: number;
  rebate?: number;
  creditTermDays?: number;
  slabDay?: SlabDayRule;
  slabTeu?: SlabTeuRule;
}

export type {
  BillingUnit,
  ChargeType,
} from '@/data/seed/_shared/charge-codes';
export type { CargoCategory } from '@/data/seed/_shared/cargo-categories';
