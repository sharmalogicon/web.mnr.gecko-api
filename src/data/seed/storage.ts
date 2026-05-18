/**
 * Seed: Storage records (per-diem accrual).
 * Plan 01.07, Task 1, Step F.
 *
 * Per-diem rate convention (THB/day):
 *   - Platinum customers (Maersk, CMA CGM):   30 – 50
 *   - Gold (MSC, ONE, Hapag-Lloyd):           50 – 75
 *   - Silver (Evergreen, COSCO, Yang Ming, HMM): 75
 *   - Standard (ZIM): 90
 *   - Lessor stock (Triton, Beacon, SeaCo, Florens, Caribbean): 80
 *
 * `totalAccruedThb` = `daysOnHold` × `perDiemRateThb` (integer arithmetic).
 *
 * FK targets: equipmentId → equipment, depotCode → depots, customerCode → customers.
 */

export interface StorageRecord {
  /** e.g. 'STO-2026-0001'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  /** FK to `depots[].code`. */
  depotCode: string;
  /** FK to `customers[].code` (storage billing target). */
  customerCode: string;
  inDate: string;
  outDate?: string;
  daysOnHold: number;
  perDiemRateThb: number;
  /** `daysOnHold` × `perDiemRateThb`. */
  totalAccruedThb: number;
}

export const storage: StorageRecord[] = [
  // 1. Hapag-Lloyd 40' in Jurong storage — open, 64 days × 75 THB/day = 4,800
  { reference: 'STO-2026-0001', equipmentId: 'HLXU5554326', depotCode: 'JUR', customerCode: 'C-HLXU',
    inDate: '2026-03-15', daysOnHold: 64, perDiemRateThb: 75, totalAccruedThb: 4800 },

  // 2. Triton 40' tank in PSA storage (lessor stock) — open, 79 days × 80 = 6,320
  { reference: 'STO-2026-0002', equipmentId: 'TCNU1122333', depotCode: 'PPP', customerCode: 'C-CMAU',
    inDate: '2026-02-28', daysOnHold: 79, perDiemRateThb: 80, totalAccruedThb: 6320 },

  // 3. Yang Ming 20' off-hire at Jurong — closed, 33 days × 75 = 2,475
  { reference: 'STO-2026-0003', equipmentId: 'YMLU6789013', depotCode: 'JUR', customerCode: 'C-YMLU',
    inDate: '2026-01-25', outDate: '2026-02-27', daysOnHold: 33, perDiemRateThb: 75, totalAccruedThb: 2475 },

  // 4. Florens 20' bulk at Port Klang Westport (lessor stock) — open, 97 days × 80 = 7,760
  { reference: 'STO-2026-0004', equipmentId: 'FCIU9988777', depotCode: 'PKW', customerCode: 'C-MSKU',
    inDate: '2026-02-10', daysOnHold: 97, perDiemRateThb: 80, totalAccruedThb: 7760 },

  // 5. Maersk 20' transitional storage at LCB — closed, 4 days × 35 = 140 (Platinum rate)
  { reference: 'STO-2026-0005', equipmentId: 'MSKU2345671', depotCode: 'LCB', customerCode: 'C-MSKU',
    inDate: '2026-04-12', outDate: '2026-04-16', daysOnHold: 4, perDiemRateThb: 35, totalAccruedThb: 140 },

  // 6. CMA CGM 40' temporary at Lat Krabang — open, 9 days × 45 = 405 (Platinum rate)
  { reference: 'STO-2026-0006', equipmentId: 'CMAU4129351', depotCode: 'LKR', customerCode: 'C-CMAU',
    inDate: '2026-05-09', daysOnHold: 9, perDiemRateThb: 45, totalAccruedThb: 405 },

  // 7. Triton reefer at Jurong while awaiting repair — open, 78 days × 80 = 6,240
  { reference: 'STO-2026-0007', equipmentId: 'TGHU5678908', depotCode: 'JUR', customerCode: 'C-MSKU',
    inDate: '2026-03-01', daysOnHold: 78, perDiemRateThb: 80, totalAccruedThb: 6240 },

  // 8. Caribbean flat-rack at PKN — open, 49 days × 80 = 3,920
  { reference: 'STO-2026-0008', equipmentId: 'CARU4567897', depotCode: 'PKN', customerCode: 'C-EVRU',
    inDate: '2026-03-30', daysOnHold: 49, perDiemRateThb: 80, totalAccruedThb: 3920 },

  // 9. ONE 40' HC at Port Klang Northport — closed, 12 days × 70 = 840 (Gold rate)
  { reference: 'STO-2026-0009', equipmentId: 'ONEU7865430', depotCode: 'PKN', customerCode: 'C-ONEU',
    inDate: '2026-04-30', outDate: '2026-05-12', daysOnHold: 12, perDiemRateThb: 70, totalAccruedThb: 840 },
];
