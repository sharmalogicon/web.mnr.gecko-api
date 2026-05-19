/**
 * Canonical tariff charge-row type — shared across Standard, Liner, Vendor.
 * Phase 7 base + Phase 7.7 expansion (CEDEX-aware repair fields, slab tables).
 */

import type { BillingUnit, ChargeType } from '@/data/seed/_shared/charge-codes';
import type { CargoCategory } from '@/data/seed/_shared/cargo-categories';

export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';
export type PaymentTerm = 'CASH' | 'CREDIT';
export type SizeCode = '20' | '40' | '45';
export type BilledTo = 'AGENT'; // pinned per Phase 7 D-08

/** Phase 7.7 — Man-hours slab tier (labor effort by hour range). */
export interface ManHoursSlabRow {
  fromHour: number;
  toHour: number;
  manHours: number;
}

/** Phase 7.7 — Material-price slab tier (price + cost by quantity range). */
export interface MaterialPriceSlabRow {
  fromQty: number;
  toQty: number;
  priceThb: number;
  costThb: number;
}

/**
 * Phase 7.8-C — `ChargeRow` is now a pure M&R repair-pricing record.
 * Agreement-level concerns (orderType / movementCode / cargoCategory /
 * paymentTerm / billedTo / discountType / discountRate / rebate /
 * creditTermDays / truckCategory / isoType / chargeType) live on the
 * parent tariff card as `default*` fields.
 * `chargeType` is derivable via `findChargeCode(row.chargeCode).chargeType`.
 */
export interface ChargeRow {
  /** Stable id within the parent tariff card; e.g. `r-1`. */
  id: string;
  /** FK to chargeCodes (e.g. 'LIN-PAT', 'SVC-PTI'). */
  chargeCode: string;
  billingUnit: BillingUnit;
  size?: SizeCode;
  sellingRateThb: number;

  // ===== Phase 7.7 — CEDEX-aware repair context + slab tables =====
  /** FK to containerModes (STL / REF / OOG / BB / GP / HC). */
  containerMode?: string;
  /** FK to cedexDamages (Phase 4 seed). */
  damageCode?: string;
  /** FK to cedexRepairs (Phase 4 seed). */
  repairCode?: string;
  /** FK to cedexComponents (Phase 4 seed). */
  component?: string;
  /** FK to uoms (BAG / KG / EA / M / M2 / L / HR / JOB). */
  uom?: string;
  /** Operator may adjust quantity at quote time. */
  adjustable?: boolean;
  /** Hard cap on labor hours billable for this charge. */
  maxHour?: number;
  /** Hard cap on quantity billable for this charge. */
  maxQuantity?: number;
  /** Per-hour labor charge — used as the base when no manHoursSlab tier matches. */
  labourRateThb?: number;
  /** Tiered labor pricing by hour range. */
  manHoursSlab?: ManHoursSlabRow[];
  /** Tiered material pricing by quantity range. */
  materialPriceSlab?: MaterialPriceSlabRow[];
}

export type {
  BillingUnit,
  ChargeType,
} from '@/data/seed/_shared/charge-codes';
export type { CargoCategory } from '@/data/seed/_shared/cargo-categories';
