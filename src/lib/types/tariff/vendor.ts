/**
 * Vendor tariff card — what a third-party supplier charges us.
 * Phase 7 D-02 (cost side).
 */

import type { ChargeRow, BilledTo, PaymentTerm } from './charge-row';
import type { CargoCategory } from '@/data/seed/_shared/cargo-categories';
import type { TariffStatus } from './standard';

export interface VendorTariffCard {
  /** e.g. 'VND-V-HAZCLEAN-TH-2026'. */
  id: string;
  /** FK to vendors[].id. */
  vendorId: string;
  /** Auto-generated on save: 'VQ-YYYY-NNNNN'. */
  quotationNo: string;
  /** Procurement contact owning the agreement. */
  procurementContact: string;
  effectiveDate: string;
  expiryDate: string;
  status: TariffStatus;
  approvedBy?: string;
  approvedOn?: string;
  createdBy: string;
  createdOn: string;
  modifiedBy?: string;
  modifiedOn?: string;
  // Phase 7.8-A — card-header agreement defaults applied to new rows.
  defaultOrderType?: string;
  defaultMovementCode?: string;
  defaultCargoCategory?: CargoCategory;
  defaultPaymentTerm?: PaymentTerm;
  defaultBilledTo?: BilledTo;
  defaultCreditTermDays?: number;
  defaultTruckCategory?: string;
  rows: ChargeRow[];
}
