/**
 * Liner tariff card — per-shipping-line agreement (revenue side).
 * Phase 7 D-02.
 *
 * Supersedes the v1.0 customer-rates + contracts pair: a Liner tariff
 * card IS the agreement, with the line items being the override rates
 * for the standard depot tariff.
 */

import type { ChargeRow } from './charge-row';
import type { TariffStatus } from './standard';

export interface FreeDaysGrid {
  fullExport: { normal: number; reefer: number; dg: number };
  fullImport: { normal: number; reefer: number; dg: number };
  emptyImport: { normal: number; reefer: number };
}

export interface LinerTariffCard {
  /** e.g. 'LNR-MSKU-2026'. */
  id: string;
  /** FK to customers[].code (the shipping line). */
  agentCode: string;
  /** Auto-generated on save: 'QU-YYYY-NNNNN'. */
  quotationNo: string;
  /** Sales person owning the quotation. */
  salesPerson: string;
  contactNo?: string;
  effectiveDate: string;
  expiryDate: string;
  status: TariffStatus;
  approvedBy?: string;
  approvedOn?: string;
  createdBy: string;
  createdOn: string;
  modifiedBy?: string;
  modifiedOn?: string;
  freeDays: FreeDaysGrid;
  waiveStorageForEmptyDmContainers: boolean;
  rows: ChargeRow[];
}

export type { TariffStatus } from './standard';
