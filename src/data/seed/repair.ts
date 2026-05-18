/**
 * Seed: Repair jobs.
 * Plan 01.07, Task 1, Step C. CEDEX-SHAPED damage codes (not CEDEX-CORRECT yet;
 * Phase 4 brings the full CEDEX dictionary). Costs anchor to UI-SPEC §9.5.
 *
 * Cost anchors (THB):
 *   - CEDEX 30cm dent straighten ≈ 1,200 parts + 0.5 hr × 350 THB/hr = 1,375
 *   - Door gasket replace (40' full perimeter) ≈ 2,400 parts + 1 hr labour
 *   - Floor plank replace (per plank) ≈ 850 parts + 0.75 hr labour
 *   - Reefer compressor swap ≈ 145,000 parts + 6 hr labour
 *
 * FK targets:
 *   - equipmentId → equipment[].id (TS-checked through compile)
 *   - estimatorId / approverId → surveyors[].id from _shared
 *   - customerCode → customers[].code from _shared
 */

export type RepairStatus = 'estimated' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed';
export type RepairSeverity = 'minor' | 'normal' | 'critical';
export type Responsibility = 'owner' | 'operator' | 'depot' | 'insurance' | 'warranty';

export interface RepairLine {
  /** CEDEX location code, e.g. '8200' (front panel). */
  location: string;
  /** CEDEX component code, e.g. 'FNX' (front nose). */
  component: string;
  /** CEDEX damage code, e.g. 'BEN' (bent). */
  damage: string;
  /** CEDEX repair code, e.g. 'STR' (straighten). */
  repair: string;
  dimensionCm?: number;
  material?: string;
  hours: number;
  costThb: number;
  responsibility: Responsibility;
}

export interface RepairJob {
  /** e.g. 'REP-2026-0042'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  openedDate: string;
  closedDate?: string;
  status: RepairStatus;
  severity: RepairSeverity;
  /** FK to `surveyors[].id`. */
  estimatorId: string;
  /** FK to `surveyors[].id`. */
  approverId?: string;
  /** FK to `customers[].code` (billing target). */
  customerCode: string;
  lines: RepairLine[];
  /** Sum of `lines[].costThb`. */
  totalCostThb: number;
}

export const repairs: RepairJob[] = [
  // 1. Completed minor dent on Maersk dry — D-11 anchor MSKU
  {
    reference: 'REP-2026-0001',
    equipmentId: 'MSKU2345671',
    openedDate: '2026-04-12',
    closedDate: '2026-04-15',
    status: 'completed',
    severity: 'normal',
    estimatorId: 'SRV-001',  // Somchai Kraisorn (TH)
    approverId: 'SRV-005',   // Prasong Suthikorn (TH)
    customerCode: 'C-MSKU',
    lines: [
      // 30cm front-nose dent — straighten. Cost anchor: 1,200 + 0.5 × 350 = 1,375 THB.
      { location: '8200', component: 'FNX', damage: 'BEN', repair: 'STR',
        dimensionCm: 30, material: 'PNL', hours: 0.5, costThb: 1375, responsibility: 'operator' },
    ],
    totalCostThb: 1375,
  },

  // 2. Awaiting-approval reefer compressor swap — high cost triggers approval flow
  {
    reference: 'REP-2026-0002',
    equipmentId: 'MWCU6784034',
    openedDate: '2026-04-29',
    status: 'awaiting_approval',
    severity: 'critical',
    estimatorId: 'SRV-008',  // Apirak Chaiwan (TH, ATP)
    customerCode: 'C-MSKU',
    lines: [
      // Compressor failure — Star Cool SCI unit. Replace assembly.
      { location: '4100', component: 'CMP', damage: 'FLT', repair: 'REP',
        material: 'UNT', hours: 6.0, costThb: 147100, responsibility: 'owner' },
    ],
    totalCostThb: 147100,
  },

  // 3. In-progress tank lining patch — critical (food-grade integrity)
  {
    reference: 'REP-2026-0003',
    equipmentId: 'BEAU2671941',
    openedDate: '2026-05-05',
    status: 'in_progress',
    severity: 'critical',
    estimatorId: 'SRV-003',  // Ahmad bin Razak (MY)
    approverId: 'SRV-005',
    customerCode: 'C-MSCU',
    lines: [
      // Lining defect on food-grade tank — patch + recertify.
      { location: '5200', component: 'LIN', damage: 'CRK', repair: 'PAT',
        dimensionCm: 15, material: 'LIN', hours: 3.5, costThb: 6225, responsibility: 'depot' },
      { location: '5200', component: 'LIN', damage: 'CRK', repair: 'CRT',
        material: 'CRT', hours: 1.0, costThb: 1800, responsibility: 'depot' },
    ],
    totalCostThb: 8025,
  },

  // 4. Multi-line door+gasket repair on CMA CGM 40' — completed, operator-pay
  {
    reference: 'REP-2026-0004',
    equipmentId: 'CMAU4129351',
    openedDate: '2026-03-23',
    closedDate: '2026-03-28',
    status: 'completed',
    severity: 'normal',
    estimatorId: 'SRV-002',  // Tan Wei Ming (SG)
    approverId: 'SRV-005',
    customerCode: 'C-CMAU',
    lines: [
      { location: '1100', component: 'DRH', damage: 'BEN', repair: 'STR',
        dimensionCm: 18, material: 'STL', hours: 1.0, costThb: 1550, responsibility: 'operator' },
      { location: '1100', component: 'GAS', damage: 'WRN', repair: 'RPL',
        material: 'GAS', hours: 1.5, costThb: 2925, responsibility: 'operator' },
      { location: '1200', component: 'LCK', damage: 'BRK', repair: 'RPL',
        material: 'CAM', hours: 0.75, costThb: 1462, responsibility: 'operator' },
    ],
    totalCostThb: 5937,
  },

  // 5. Floor plank replacement on Hapag-Lloyd 40' — estimated, awaiting customer
  {
    reference: 'REP-2026-0005',
    equipmentId: 'HLXU5554326',
    openedDate: '2026-05-10',
    status: 'estimated',
    severity: 'minor',
    estimatorId: 'SRV-006',  // Lim Boon Keng (SG)
    customerCode: 'C-HLXU',
    lines: [
      { location: '6100', component: 'FLR', damage: 'SPL', repair: 'RPL',
        dimensionCm: 50, material: 'PLK', hours: 1.5, costThb: 2075, responsibility: 'operator' },
    ],
    totalCostThb: 2075,
  },

  // 6. Critical corner-casting crack on CMA CGM (in-progress, structural)
  {
    reference: 'REP-2026-0006',
    equipmentId: 'COSU3456783',
    openedDate: '2026-03-09',
    status: 'in_progress',
    severity: 'critical',
    estimatorId: 'SRV-007',  // Wira Hadi (MY)
    approverId: 'SRV-003',
    customerCode: 'C-COSU',
    lines: [
      { location: '7100', component: 'CCS', damage: 'CRK', repair: 'WLD',
        dimensionCm: 12, material: 'STL', hours: 4.5, costThb: 7575, responsibility: 'operator' },
      { location: '7100', component: 'CCS', damage: 'CRK', repair: 'CRT',
        material: 'CRT', hours: 1.0, costThb: 1800, responsibility: 'operator' },
    ],
    totalCostThb: 9375,
  },

  // 7. Approved reefer setpoint sensor replace (Triton reefer)
  {
    reference: 'REP-2026-0007',
    equipmentId: 'TGHU5678908',
    openedDate: '2026-03-02',
    status: 'approved',
    severity: 'normal',
    estimatorId: 'SRV-009',  // Goh Mei Ling (SG)
    approverId: 'SRV-002',
    customerCode: 'C-MSKU',
    lines: [
      { location: '4200', component: 'SNS', damage: 'FLT', repair: 'RPL',
        material: 'SNS', hours: 2.0, costThb: 4850, responsibility: 'owner' },
    ],
    totalCostThb: 4850,
  },

  // 8. Completed door cam latch on ONE 40' HC — warranty
  {
    reference: 'REP-2026-0008',
    equipmentId: 'ONEU7865430',
    openedDate: '2026-04-25',
    closedDate: '2026-04-27',
    status: 'completed',
    severity: 'minor',
    estimatorId: 'SRV-001',
    approverId: 'SRV-005',
    customerCode: 'C-ONEU',
    lines: [
      { location: '1200', component: 'CAM', damage: 'BRK', repair: 'RPL',
        material: 'CAM', hours: 0.75, costThb: 1462, responsibility: 'warranty' },
    ],
    totalCostThb: 1462,
  },

  // 9. Multi-line tank survey-driven repairs on Triton tank (in_progress)
  {
    reference: 'REP-2026-0009',
    equipmentId: 'TCNU8453210',
    openedDate: '2026-05-02',
    status: 'in_progress',
    severity: 'normal',
    estimatorId: 'SRV-005',
    approverId: 'SRV-008',
    customerCode: 'C-CMAU',
    lines: [
      { location: '5100', component: 'VLV', damage: 'LEK', repair: 'RPL',
        material: 'VLV', hours: 1.5, costThb: 4275, responsibility: 'depot' },
      { location: '5300', component: 'MAN', damage: 'COR', repair: 'CLN',
        material: 'CLN', hours: 1.0, costThb: 1100, responsibility: 'depot' },
      { location: '5000', component: 'SHL', damage: 'COR', repair: 'COA',
        dimensionCm: 40, material: 'COA', hours: 2.5, costThb: 5450, responsibility: 'depot' },
    ],
    totalCostThb: 10825,
  },

  // 10. Estimated panel dent on Evergreen 20' — depot responsibility (handling damage)
  {
    reference: 'REP-2026-0010',
    equipmentId: 'EVRU9012346',
    openedDate: '2026-05-12',
    status: 'estimated',
    severity: 'minor',
    estimatorId: 'SRV-001',
    customerCode: 'C-EVRU',
    lines: [
      { location: '8300', component: 'SDR', damage: 'BEN', repair: 'STR',
        dimensionCm: 22, material: 'PNL', hours: 0.5, costThb: 1287, responsibility: 'depot' },
    ],
    totalCostThb: 1287,
  },

  // 11. Awaiting-approval reefer evaporator clean on ZIM 40' HC reefer
  {
    reference: 'REP-2026-0011',
    equipmentId: 'ZIMU3456781',
    openedDate: '2026-04-27',
    status: 'awaiting_approval',
    severity: 'normal',
    estimatorId: 'SRV-008',
    customerCode: 'C-ZIMU',
    lines: [
      { location: '4300', component: 'EVA', damage: 'FOL', repair: 'CLN',
        material: 'CLN', hours: 2.5, costThb: 3450, responsibility: 'owner' },
      { location: '4400', component: 'FAN', damage: 'WRN', repair: 'RPL',
        material: 'FAN', hours: 1.5, costThb: 5800, responsibility: 'owner' },
    ],
    totalCostThb: 9250,
  },
];
