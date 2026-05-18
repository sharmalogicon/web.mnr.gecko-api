/**
 * Seed: Container surveys.
 * Plan 01.07, Task 1, Step D. Cost anchors per UI-SPEC §9.5.
 *
 * Cost ranges (THB):
 *   - 20' DRY survey:         350 – 500
 *   - 40' HC reefer survey:   600 – 900
 *   - Tank pressure test:   2,500 – 4,000
 *   - Reefer PTI:           1,500 – 2,500
 *
 * FK targets: equipmentId → equipment, surveyorId → surveyors, depotCode → depots.
 */

export type SurveyType = 'on_hire' | 'off_hire' | 'periodic' | 'pti';
export type SurveyContainerType = 'DRY' | 'TANK' | 'REEFER';
export type SurveyOutcome = 'pass' | 'pass_with_notes' | 'must_repair' | 'reject';

export interface SurveyRecord {
  /** e.g. 'SUR-2026-0123'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  type: SurveyType;
  containerType: SurveyContainerType;
  /** FK to `surveyors[].id`. */
  surveyorId: string;
  /** FK to `depots[].code`. */
  depotCode: string;
  performedDate: string;
  outcome: SurveyOutcome;
  notes?: string;
  costThb: number;
}

export const surveys: SurveyRecord[] = [
  // 1. 20' DRY on-hire (Maersk) — pass, 425 THB (within 350-500 anchor)
  { reference: 'SUR-2026-0001', equipmentId: 'MSKU2345671', type: 'on_hire', containerType: 'DRY',
    surveyorId: 'SRV-001', depotCode: 'LCB', performedDate: '2026-04-10', outcome: 'pass', costThb: 425 },

  // 2. 40' periodic reefer (Maersk MNBU) — pass_with_notes, 750 THB (within 600-900)
  { reference: 'SUR-2026-0002', equipmentId: 'MNBU4598321', type: 'periodic', containerType: 'REEFER',
    surveyorId: 'SRV-002', depotCode: 'LCB', performedDate: '2026-04-22', outcome: 'pass_with_notes', costThb: 750,
    notes: 'Door gasket worn — flagged for next service cycle' },

  // 3. Tank periodic pressure test (Triton TCNU) — pass, 3,200 THB (within 2,500-4,000)
  { reference: 'SUR-2026-0003', equipmentId: 'TCNU8453210', type: 'periodic', containerType: 'TANK',
    surveyorId: 'SRV-005', depotCode: 'LCB', performedDate: '2026-04-05', outcome: 'pass', costThb: 3200 },

  // 4. Reefer PTI (Maersk Star Cool MWCU) — pass, 2,100 THB (within 1,500-2,500)
  { reference: 'SUR-2026-0004', equipmentId: 'MWCU6784034', type: 'pti', containerType: 'REEFER',
    surveyorId: 'SRV-008', depotCode: 'PPP', performedDate: '2026-04-28', outcome: 'pass', costThb: 2100 },

  // 5. 40' periodic DRY (CMA CGM) at LKR — pass, 525 THB (40' adds a small premium)
  { reference: 'SUR-2026-0005', equipmentId: 'CMAU4129351', type: 'periodic', containerType: 'DRY',
    surveyorId: 'SRV-001', depotCode: 'LKR', performedDate: '2026-03-22', outcome: 'pass', costThb: 525 },

  // 6. Off-hire 40' DRY (COSCO) at Pasir Gudang — must_repair, 475 THB
  { reference: 'SUR-2026-0006', equipmentId: 'COSU3456783', type: 'off_hire', containerType: 'DRY',
    surveyorId: 'SRV-007', depotCode: 'PGU', performedDate: '2026-03-08', outcome: 'must_repair', costThb: 475,
    notes: 'Corner casting crack 12cm — repair before redelivery' },

  // 7. Tank off-hire on Beacon food-grade — pass, 2,800 THB
  { reference: 'SUR-2026-0007', equipmentId: 'BEAU2671941', type: 'off_hire', containerType: 'TANK',
    surveyorId: 'SRV-003', depotCode: 'PGU', performedDate: '2026-04-18', outcome: 'pass', costThb: 2800 },

  // 8. 20' DRY on-hire (HMM) at Port Klang Westport — pass, 450 THB
  { reference: 'SUR-2026-0008', equipmentId: 'HMMU9012342', type: 'on_hire', containerType: 'DRY',
    surveyorId: 'SRV-010', depotCode: 'PKW', performedDate: '2026-04-14', outcome: 'pass', costThb: 450,
    notes: 'Clean as-built, returned with original CSC plate intact' },

  // 9. 40' HC reefer periodic on ZIM — pass_with_notes, 825 THB
  { reference: 'SUR-2026-0009', equipmentId: 'ZIMU3456781', type: 'periodic', containerType: 'REEFER',
    surveyorId: 'SRV-009', depotCode: 'LCB', performedDate: '2026-04-26', outcome: 'pass_with_notes', costThb: 825,
    notes: 'Evaporator fouled — cleaning scheduled (see REP-2026-0011)' },

  // 10. Tank periodic on SeaCo IMO 1 — reject, 3,450 THB (rare outcome, demo filter-empty)
  { reference: 'SUR-2026-0010', equipmentId: 'SEKU1234563', type: 'periodic', containerType: 'TANK',
    surveyorId: 'SRV-005', depotCode: 'LKR', performedDate: '2026-03-12', outcome: 'reject', costThb: 3450,
    notes: 'Pressure test failure at 3.2 bar — shell condemned, off-hire' },
];
