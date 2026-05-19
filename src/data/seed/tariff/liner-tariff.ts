/**
 * Seed: Liner tariff cards (one per shipping line).
 * Phase 7 D-02.
 *
 * Each liner gets their own quotation card. The row list contains override
 * rates relative to the depot Standard. At quote time, the Liner row is
 * looked up first; missing → fallback to depot Standard.
 */

import type { ChargeRow } from '@/lib/types';
import type { LinerTariffCard } from '@/lib/types';

function r(
  id: string,
  chargeCode: string,
  orderType: string,
  movementCode: string,
  chargeType: ChargeRow['chargeType'],
  billingUnit: ChargeRow['billingUnit'],
  originalRateThb: number,
  sellingRateThb: number,
  overrides: Partial<ChargeRow> = {},
): ChargeRow {
  return {
    id,
    chargeCode,
    orderType,
    movementCode,
    chargeType,
    billingUnit,
    cargoCategory: 'GENERAL',
    paymentTerm: 'CREDIT',
    billedTo: 'AGENT',
    originalRateThb,
    discountType: 'PERCENT',
    discountRate: Math.round(((originalRateThb - sellingRateThb) / originalRateThb) * 100),
    sellingRateThb,
    creditTermDays: 30,
    ...overrides,
  };
}

const standardFreeDays = {
  fullExport: { normal: 7, reefer: 5, dg: 3 },
  fullImport: { normal: 7, reefer: 5, dg: 3 },
  emptyImport: { normal: 14, reefer: 7 },
};

export const linerTariffCards: LinerTariffCard[] = [
  // ===== Platinum tier =====
  {
    id: 'LNR-MSKU-2026', agentCode: 'C-MSKU',
    quotationNo: 'QU-2026-00001',
    salesPerson: 'YOKPORN', contactNo: '02-708-0888',
    effectiveDate: '2026-01-15', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-01-12',
    createdBy: 'SALE-CO', createdOn: '2026-01-10',
    freeDays: {
      fullExport: { normal: 14, reefer: 10, dg: 5 },
      fullImport: { normal: 14, reefer: 10, dg: 5 },
      emptyImport: { normal: 21, reefer: 14 },
    },
    waiveStorageForEmptyDmContainers: true,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY',  'M&R-IN', 'FULL IN', 'SURVEY',   'CONT', 425,   340),  // 20% off
      r('r-2', 'SVC-PTI',         'PTI-ONLY', 'M&R MOVE', 'PTI',  'CONT', 2100, 1680, { cargoCategory: 'REEFER' }),
      r('r-3', 'SVC-WASH-FOOD',   'M&R-IN', 'FULL IN', 'CLEANING', 'CONT', 30000, 24000, { cargoCategory: 'FOODGRADE' }),
      r('r-4', 'SVC-STG-NORM',    'STORAGE', 'M&R MOVE', 'STORAGE','DAY', 75, 60),
      r('r-5', 'GAS-RPL',         'REPAIR-ONLY', 'M&R MOVE', 'REPAIR','JOB', 2400, 1920),
    ],
  },
  {
    id: 'LNR-CMAU-2026', agentCode: 'C-CMAU',
    quotationNo: 'QU-2026-00002',
    salesPerson: 'YOKPORN', contactNo: '02-700-9999',
    effectiveDate: '2026-02-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-01-28',
    createdBy: 'SALE-CO', createdOn: '2026-01-20',
    freeDays: {
      fullExport: { normal: 14, reefer: 10, dg: 5 },
      fullImport: { normal: 14, reefer: 10, dg: 5 },
      emptyImport: { normal: 21, reefer: 14 },
    },
    waiveStorageForEmptyDmContainers: true,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425,  340),
      r('r-2', 'SVC-WASH-CHEM',  'M&R-IN', 'FULL IN', 'CLEANING','CONT', 8500, 6800, { cargoCategory: 'HAZMAT' }),
      r('r-3', 'SVC-STG-DG',     'STORAGE','M&R MOVE','STORAGE', 'DAY', 200, 160, { cargoCategory: 'HAZMAT' }),
      r('r-4', 'CMP-REP',        'REPAIR-ONLY','M&R MOVE','REPAIR','HOUR', 1200, 960, { cargoCategory: 'REEFER' }),
    ],
  },
  // ===== Gold tier =====
  {
    id: 'LNR-MSCU-2026', agentCode: 'C-MSCU',
    quotationNo: 'QU-2026-00003',
    salesPerson: 'PRAYUTH', contactNo: '02-651-2233',
    effectiveDate: '2026-01-20', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-01-18',
    createdBy: 'SALE-CO', createdOn: '2026-01-15',
    freeDays: {
      fullExport: { normal: 10, reefer: 7, dg: 3 },
      fullImport: { normal: 10, reefer: 7, dg: 3 },
      emptyImport: { normal: 14, reefer: 10 },
    },
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 361),  // 15% off
      r('r-2', 'SVC-WASH-STD',   'M&R-IN', 'FULL IN', 'CLEANING','CONT', 1800, 1530),
      r('r-3', 'SVC-STG-NORM',   'STORAGE','M&R MOVE','STORAGE', 'DAY', 75, 64),
    ],
  },
  {
    id: 'LNR-ONEU-2026', agentCode: 'C-ONEU',
    quotationNo: 'QU-2026-00004',
    salesPerson: 'PRAYUTH', contactNo: '02-651-4455',
    effectiveDate: '2026-02-15', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-02-12',
    createdBy: 'SALE-CO', createdOn: '2026-02-08',
    freeDays: {
      fullExport: { normal: 10, reefer: 7, dg: 3 },
      fullImport: { normal: 10, reefer: 7, dg: 3 },
      emptyImport: { normal: 14, reefer: 10 },
    },
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 361),
      r('r-2', 'SVC-PTI',        'PTI-ONLY','M&R MOVE','PTI',    'CONT', 2100, 1785, { cargoCategory: 'REEFER' }),
      r('r-3', 'SVC-STG-REEF',   'STORAGE','M&R MOVE','STORAGE', 'DAY', 120, 102, { cargoCategory: 'REEFER' }),
    ],
  },
  {
    id: 'LNR-HLXU-2026', agentCode: 'C-HLXU',
    quotationNo: 'QU-2026-00005',
    salesPerson: 'SOMSAK', contactNo: '02-580-7700',
    effectiveDate: '2026-01-10', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-01-08',
    createdBy: 'SALE-CO', createdOn: '2026-01-05',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 361),
      r('r-2', 'SVC-WASH-STD',   'M&R-IN', 'FULL IN', 'CLEANING','CONT', 1800, 1530),
    ],
  },
  // ===== Silver tier =====
  {
    id: 'LNR-EVRU-2026', agentCode: 'C-EVRU',
    quotationNo: 'QU-2026-00006',
    salesPerson: 'SOMSAK', contactNo: '02-580-3322',
    effectiveDate: '2026-03-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-02-28',
    createdBy: 'SALE-CO', createdOn: '2026-02-25',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 383),  // 10% off
      r('r-2', 'SVC-STG-NORM',   'STORAGE','M&R MOVE','STORAGE', 'DAY', 75, 68),
    ],
  },
  {
    id: 'LNR-COSU-2026', agentCode: 'C-COSU',
    quotationNo: 'QU-2026-00007',
    salesPerson: 'SOMSAK', contactNo: '02-580-1010',
    effectiveDate: '2026-02-20', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-02-18',
    createdBy: 'SALE-CO', createdOn: '2026-02-15',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 383),
    ],
  },
  {
    id: 'LNR-YMLU-2026', agentCode: 'C-YMLU',
    quotationNo: 'QU-2026-00008',
    salesPerson: 'NIRAN', contactNo: '02-235-4488',
    effectiveDate: '2026-03-15', expiryDate: '2026-12-31',
    status: 'DRAFT',
    createdBy: 'SALE-CO', createdOn: '2026-03-10',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY', 'CONT', 425, 383),
    ],
  },
  {
    id: 'LNR-HMMU-2026', agentCode: 'C-HMMU',
    quotationNo: 'QU-2026-00009',
    salesPerson: 'NIRAN', contactNo: '02-235-9911',
    effectiveDate: '2026-02-28', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-02-25',
    createdBy: 'SALE-CO', createdOn: '2026-02-22',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY',  'CONT', 425, 383),
    ],
  },
  // ===== Standard tier =====
  {
    id: 'LNR-ZIMU-2026', agentCode: 'C-ZIMU',
    quotationNo: 'QU-2026-00010',
    salesPerson: 'NIRAN', contactNo: '02-235-2020',
    effectiveDate: '2026-04-01', expiryDate: '2026-12-31',
    status: 'APPROVED',
    approvedBy: 'CHAKRIYA', approvedOn: '2026-03-30',
    createdBy: 'SALE-CO', createdOn: '2026-03-25',
    freeDays: standardFreeDays,
    waiveStorageForEmptyDmContainers: false,
    rows: [
      r('r-1', 'SVC-SURVEY-DRY', 'M&R-IN', 'FULL IN', 'SURVEY', 'CONT', 425, 425, { discountType: 'NONE' }),
    ],
  },
];
