/**
 * Seed: Vendor tariff cards (one per vendor — cost side).
 * Phase 7 D-02.
 *
 * What each third-party vendor charges us when we outsource work.
 * Margin = customer-side revenue (Standard / Liner) − vendor-side cost.
 */

import type { ChargeRow } from '@/lib/types';
import type { VendorTariffCard } from '@/lib/types';

/**
 * Phase 7.8-C — slim builder. Legacy positional args (orderType/
 * movementCode/chargeType) accepted but ignored. Agreement-level
 * fields live on the parent card's `default*` fields.
 */
function r(
  id: string,
  chargeCode: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _orderType: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _movementCode: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _chargeType: string,
  billingUnit: ChargeRow['billingUnit'],
  costThb: number,
  overrides: Partial<ChargeRow> = {},
): ChargeRow {
  return {
    id,
    chargeCode,
    billingUnit,
    sellingRateThb: costThb,
    ...overrides,
  };
}

/** Common Vendor card-header agreement defaults (Phase 7.8-A).
 *  Vendors invoice us on CREDIT 45d, repair-mode billing. */
const VENDOR_DEFAULTS = {
  defaultOrderType: 'REPAIR-ONLY',
  defaultMovementCode: 'M&R MOVE',
  defaultCargoCategory: 'GENERAL' as const,
  defaultPaymentTerm: 'CREDIT' as const,
  defaultBilledTo: 'AGENT' as const,
  defaultCreditTermDays: 45,
  defaultTruckCategory: '',
};

export const vendorTariffCards: VendorTariffCard[] = [
  // Hazmat cleaning specialists
  {
    id: 'VND-V-HAZCLEAN-TH-2026', vendorId: 'V-HAZCLEAN-TH',
    quotationNo: 'VQ-2026-00001',
    procurementContact: 'PROC-TH-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-20',
    createdBy: 'PROC-CO', createdOn: '2025-12-15',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SVC-WASH-CHEM', 'M&R-IN', 'FULL IN', 'CLEANING', 'CONT', 5500),
      r('r-2', 'SVC-WASH-FOOD', 'M&R-IN', 'FULL IN', 'CLEANING', 'CONT', 22000),
    ],
  },
  {
    id: 'VND-V-FOOD-LCB-2026', vendorId: 'V-FOOD-LCB',
    quotationNo: 'VQ-2026-00002',
    procurementContact: 'PROC-TH-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-20',
    createdBy: 'PROC-CO', createdOn: '2025-12-15',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SVC-WASH-FOOD', 'M&R-IN', 'FULL IN', 'CLEANING', 'CONT', 20500),
    ],
  },
  // Reefer authorized dealers
  {
    id: 'VND-V-CARRIER-TH-2026', vendorId: 'V-CARRIER-TH',
    quotationNo: 'VQ-2026-00003',
    procurementContact: 'PROC-TH-02',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-22',
    createdBy: 'PROC-CO', createdOn: '2025-12-18',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'CMP-REP',        'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'HOUR', 900),
      r('r-2', 'EVA-CLN',        'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 2200),
      r('r-3', 'EVA-RPL',        'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 18500),
      r('r-4', 'FAN-RPL',        'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 4200),
      r('r-5', 'SVC-PTI',        'PTI-ONLY',    'M&R MOVE', 'PTI',    'CONT', 1500),
    ],
  },
  {
    id: 'VND-V-TKING-MY-2026', vendorId: 'V-TKING-MY',
    quotationNo: 'VQ-2026-00004',
    procurementContact: 'PROC-MY-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-22',
    createdBy: 'PROC-CO', createdOn: '2025-12-18',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'CMP-REP', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'HOUR', 950),
      r('r-2', 'SVC-PTI', 'PTI-ONLY',    'M&R MOVE', 'PTI',    'CONT', 1600),
    ],
  },
  // Valve test shops
  {
    id: 'VND-V-VALVE-SG-2026', vendorId: 'V-VALVE-SG',
    quotationNo: 'VQ-2026-00005',
    procurementContact: 'PROC-SG-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-25',
    createdBy: 'PROC-CO', createdOn: '2025-12-20',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'VLV-RPL', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 3200),
      r('r-2', 'SVC-SURVEY-TANK', 'M&R-IN', 'FULL IN', 'SURVEY', 'CONT', 2400),
    ],
  },
  {
    id: 'VND-V-VALVE-TH-2026', vendorId: 'V-VALVE-TH',
    quotationNo: 'VQ-2026-00006',
    procurementContact: 'PROC-TH-02',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-25',
    createdBy: 'PROC-CO', createdOn: '2025-12-20',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'VLV-RPL', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 2900),
      r('r-2', 'SVC-SURVEY-TANK', 'M&R-IN', 'FULL IN', 'SURVEY', 'CONT', 2200),
    ],
  },
  // Heavy lift
  {
    id: 'VND-V-CRANE-LCB-2026', vendorId: 'V-CRANE-LCB',
    quotationNo: 'VQ-2026-00007',
    procurementContact: 'PROC-TH-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-28',
    createdBy: 'PROC-CO', createdOn: '2025-12-22',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SVC-LABOR-HR', 'M&R-IN', 'M&R MOVE', 'LABOR', 'HOUR', 2800),
    ],
  },
  {
    id: 'VND-V-CRANE-PKW-2026', vendorId: 'V-CRANE-PKW',
    quotationNo: 'VQ-2026-00008',
    procurementContact: 'PROC-MY-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2025-12-28',
    createdBy: 'PROC-CO', createdOn: '2025-12-22',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SVC-LABOR-HR', 'M&R-IN', 'M&R MOVE', 'LABOR', 'HOUR', 3100),
    ],
  },
  // ATP lab
  {
    id: 'VND-V-ATP-INTL-2026', vendorId: 'V-ATP-INTL',
    quotationNo: 'VQ-2026-00009',
    procurementContact: 'PROC-INTL-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2026-01-05',
    createdBy: 'PROC-CO', createdOn: '2025-12-30',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SVC-PTI', 'PTI-ONLY', 'M&R MOVE', 'PTI', 'CONT', 4500),
    ],
  },
  // Paint coating
  {
    id: 'VND-V-PAINT-LKR-2026', vendorId: 'V-PAINT-LKR',
    quotationNo: 'VQ-2026-00010',
    procurementContact: 'PROC-TH-02',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2026-01-05',
    createdBy: 'PROC-CO', createdOn: '2025-12-30',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'SHL-COA', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 4800),
      r('r-2', 'LIN-COA', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 5500),
    ],
  },
  // Mobile welding
  {
    id: 'VND-V-WELD-PGU-2026', vendorId: 'V-WELD-PGU',
    quotationNo: 'VQ-2026-00011',
    procurementContact: 'PROC-MY-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2026-01-08',
    createdBy: 'PROC-CO', createdOn: '2026-01-03',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'CCS-WLD', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 5200),
      r('r-2', 'SHL-WLD', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 4800),
    ],
  },
  {
    id: 'VND-V-WELD-JUR-2026', vendorId: 'V-WELD-JUR',
    quotationNo: 'VQ-2026-00012',
    procurementContact: 'PROC-SG-01',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'PROC-MGR', approvedOn: '2026-01-08',
    createdBy: 'PROC-CO', createdOn: '2026-01-03',
    ...VENDOR_DEFAULTS,
    rows: [
      r('r-1', 'CCS-WLD', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 6200),
      r('r-2', 'SHL-WLD', 'REPAIR-ONLY', 'M&R MOVE', 'REPAIR', 'JOB', 5800),
    ],
  },
];
