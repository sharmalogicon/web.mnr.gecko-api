/**
 * Standard tariff card — depot baseline price list.
 * Phase 7 D-01.
 */

import type { ChargeRow } from './charge-row';

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
  rows: ChargeRow[];
}
