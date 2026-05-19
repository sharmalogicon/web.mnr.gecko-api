/**
 * Standard tariff card — depot baseline price list.
 * Phase 7 D-01.
 */

import type { ChargeRow } from './charge-row';
import type { CargoCategory } from '@/data/seed/_shared/cargo-categories';
import type { BilledTo, PaymentTerm } from './charge-row';

export type TariffStatus = 'DRAFT' | 'APPROVED' | 'EXPIRED';

export interface StandardTariffCard {
  /** e.g. 'STD-LCB-2026'. */
  id: string;
  /** FK to depots[].code. */
  depotCode: string;
  effectiveDate: string;  // ISO date
  expiryDate: string;     // ISO date
  status: TariffStatus;
  approvedBy?: string;
  approvedOn?: string;
  createdBy: string;
  createdOn: string;
  modifiedBy?: string;
  modifiedOn?: string;
  // Phase 7.8-A — card-header agreement defaults (applied to new rows under this card).
  defaultOrderType?: string;
  defaultMovementCode?: string;
  defaultCargoCategory?: CargoCategory;
  defaultPaymentTerm?: PaymentTerm;
  defaultBilledTo?: BilledTo;
  defaultCreditTermDays?: number;
  defaultTruckCategory?: string;
  rows: ChargeRow[];
}
