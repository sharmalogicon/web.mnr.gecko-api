/**
 * Seed: Emergency repair tickets.
 * Plan 01.07, Task 2b. Spill response, hazmat incidents, rapid-repair-on-deck,
 * structural failure, reefer unit failure — anything that pulls a responder
 * outside the normal repair-bay workflow.
 *
 * Emergency cost premiums roll up `SRC-2026-0005` (Emergency Callout Flat Fee
 * 3,500 THB) plus regular labour + parts. `responderIds` supports multi-responder
 * incidents (a structural failure typically pulls 2-3 staff).
 *
 * FK targets: equipmentId → equipment, responderIds → surveyors, depotCode → depots.
 */

export type EmergencyStatus = 'open' | 'on_site' | 'contained' | 'closed';

export type EmergencyType =
  | 'spill_response'
  | 'hazmat_incident'
  | 'rapid_repair_on_deck'
  | 'structural_failure'
  | 'reefer_unit_failure';

export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EmergencyJob {
  /** e.g. 'EMG-2026-0042'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  /** ISO datetime. */
  reportedAt: string;
  resolvedAt?: string;
  /** FK to `surveyors[].id` — supports multi-responder. */
  responderIds: string[];
  /** FK to `depots[].code`. */
  depotCode: string;
  /** 1-2 line incident summary. */
  summary: string;
  /** Includes emergency-callout premium per SRC-2026-0005. */
  costThb: number;
}

export const emergencyJobs: EmergencyJob[] = [
  // 1. Reefer unit failure on Maersk Star Cool — high, contained (still on incident plan)
  {
    reference: 'EMG-2026-0001',
    equipmentId: 'MWCU6784034',
    type: 'reefer_unit_failure',
    severity: 'high',
    status: 'contained',
    reportedAt: '2026-04-29T03:42:00Z',
    responderIds: ['SRV-008', 'SRV-009'],
    depotCode: 'PPP',
    summary: 'Compressor failure mid-discharge at PSA Pasir Panjang; reefer monitored on standby genset while replacement compressor sourced.',
    costThb: 156100,
  },

  // 2. Hazmat spill on Triton IMO 1 tank — critical, closed
  {
    reference: 'EMG-2026-0002',
    equipmentId: 'TCNU8453210',
    type: 'hazmat_incident',
    severity: 'critical',
    status: 'closed',
    reportedAt: '2026-04-04T11:22:00Z',
    resolvedAt: '2026-04-05T09:00:00Z',
    responderIds: ['SRV-005', 'SRV-001', 'SRV-008'],
    depotCode: 'LCB',
    summary: 'Manlid gasket failure at LCB gate, ~40 L caustic spill contained on site; BV class consulted, valve replaced under REP-2026-0009.',
    costThb: 21500,
  },

  // 3. Rapid-repair-on-deck before vessel sailing — medium, closed
  {
    reference: 'EMG-2026-0003',
    equipmentId: 'HLXU5554326',
    type: 'rapid_repair_on_deck',
    severity: 'medium',
    status: 'closed',
    reportedAt: '2026-05-08T18:15:00Z',
    resolvedAt: '2026-05-08T20:40:00Z',
    responderIds: ['SRV-006'],
    depotCode: 'JUR',
    summary: 'Door cam latch sheared during pre-load inspection at Jurong; repaired on deck within sailing window.',
    costThb: 4962,
  },

  // 4. Structural failure (corner-casting crack) on COSCO 40' — high, on_site
  {
    reference: 'EMG-2026-0004',
    equipmentId: 'COSU3456783',
    type: 'structural_failure',
    severity: 'high',
    status: 'on_site',
    reportedAt: '2026-03-08T07:10:00Z',
    responderIds: ['SRV-007', 'SRV-003'],
    depotCode: 'PGU',
    summary: 'Corner-casting crack discovered during off-hire survey; container quarantined, weld + recert in progress under REP-2026-0006.',
    costThb: 12875,
  },

  // 5. Spill response on Beacon food-grade tank — open active incident
  {
    reference: 'EMG-2026-0005',
    equipmentId: 'BEAU2671941',
    type: 'spill_response',
    severity: 'medium',
    status: 'open',
    reportedAt: '2026-05-17T22:08:00Z',
    responderIds: ['SRV-003', 'SRV-010'],
    depotCode: 'PGU',
    summary: 'Lining seep detected during pre-washout inspection; spill kit deployed, awaiting Bureau Veritas confirmation that recert is needed.',
    costThb: 8500,
  },
];
