/**
 * Seed: Cleaning jobs.
 * Plan 01.07, Task 1, Step E. Cost anchors per UI-SPEC §9.5.
 *
 * Cost ranges (THB):
 *   - T11 tank washout:        8,000 – 15,000
 *   - Food-grade tank wash:   12,000 – 18,000 (premium for IMO 4 hygiene cert)
 *   - DRY vacuum clean:          250 – 450
 *   - Reefer wipe-down:          600 – 1,000
 *
 * All 4 CleaningType values covered (washout, vacuum, reefer_wipe, tank_wash).
 */

export type CleaningType = 'washout' | 'vacuum' | 'reefer_wipe' | 'tank_wash';
export type CleaningStatus = 'queued' | 'in_progress' | 'completed';

export interface CleaningJob {
  /** e.g. 'CLN-2026-0042'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  type: CleaningType;
  status: CleaningStatus;
  /** FK to `depots[].code`. */
  depotCode: string;
  openedDate: string;
  completedDate?: string;
  costThb: number;
}

export const cleaningJobs: CleaningJob[] = [
  // 1. T11 tank washout on Triton IMO 1 — in-progress, 11,500 THB
  { reference: 'CLN-2026-0001', equipmentId: 'TCNU8453210', type: 'tank_wash', status: 'in_progress',
    depotCode: 'LCB', openedDate: '2026-05-01', costThb: 11500 },

  // 2. DRY vacuum clean on Maersk 20' — completed same-day, 350 THB
  { reference: 'CLN-2026-0002', equipmentId: 'MSKU2345671', type: 'vacuum', status: 'completed',
    depotCode: 'LCB', openedDate: '2026-04-11', completedDate: '2026-04-11', costThb: 350 },

  // 3. Reefer wipe-down on Maersk MNBU — queued, 800 THB
  { reference: 'CLN-2026-0003', equipmentId: 'MNBU4598321', type: 'reefer_wipe', status: 'queued',
    depotCode: 'LCB', openedDate: '2026-05-02', costThb: 800 },

  // 4. Food-grade washout on Beacon IMO 4 (premium for IMO 4 cert) — completed, 14,750 THB
  { reference: 'CLN-2026-0004', equipmentId: 'BEAU2671941', type: 'tank_wash', status: 'completed',
    depotCode: 'PGU', openedDate: '2026-04-19', completedDate: '2026-04-20', costThb: 14750 },

  // 5. Generic washout (residue removal) on Triton 40' tank — completed, 9,200 THB
  { reference: 'CLN-2026-0005', equipmentId: 'TCNU1122333', type: 'washout', status: 'completed',
    depotCode: 'PPP', openedDate: '2026-03-02', completedDate: '2026-03-03', costThb: 9200 },

  // 6. Reefer wipe on Star Cool at PSA Pasir Panjang — in-progress, 925 THB
  { reference: 'CLN-2026-0006', equipmentId: 'MWCU6784034', type: 'reefer_wipe', status: 'in_progress',
    depotCode: 'PPP', openedDate: '2026-05-15', costThb: 925 },

  // 7. DRY vacuum on Hapag-Lloyd 40' at Jurong — queued, 425 THB
  { reference: 'CLN-2026-0007', equipmentId: 'HLXU5554326', type: 'vacuum', status: 'queued',
    depotCode: 'JUR', openedDate: '2026-05-17', costThb: 425 },

  // 8. Reefer wipe on ZIM 40' HC — completed, 875 THB
  { reference: 'CLN-2026-0008', equipmentId: 'ZIMU3456781', type: 'reefer_wipe', status: 'completed',
    depotCode: 'LCB', openedDate: '2026-04-27', completedDate: '2026-04-28', costThb: 875 },
];
