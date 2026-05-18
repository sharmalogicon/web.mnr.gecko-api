/**
 * Seed: Modification jobs (class-society-approved structural changes).
 * Plan 01.07, Task 2b. Distinct from `repairs` — modifications change the
 * container's certified capability (IMO class, dual-voltage retrofit, etc.).
 *
 * Class-society scope: ABS (American Bureau), BV (Bureau Veritas),
 * DNV (Det Norske Veritas), LR (Lloyd's Register), NK (Nippon Kaiji Kyokai).
 *
 * FK targets: equipmentId → equipment, estimatorId → surveyors, customerCode → customers.
 */

export type ModificationStatus =
  | 'proposed'
  | 'class_review'
  | 'approved'
  | 'in_progress'
  | 'completed';

export type ModificationType =
  | 'tank_coating_upgrade'
  | 'reefer_plug_retrofit'
  | 'door_seal_upgrade'
  | 'floor_replacement'
  | 'cargo_securing_retrofit';

export interface ModificationJob {
  /** e.g. 'MOD-2026-0042'. */
  reference: string;
  /** FK to `equipment[].id`. */
  equipmentId: string;
  type: ModificationType;
  classSociety?: 'ABS' | 'BV' | 'DNV' | 'LR' | 'NK';
  status: ModificationStatus;
  openedDate: string;
  completedDate?: string;
  /** FK to `surveyors[].id`. */
  estimatorId: string;
  /** FK to `customers[].code`. */
  customerCode: string;
  /** 1-2 line plain English summary. */
  description: string;
  costThb: number;
}

export const modifications: ModificationJob[] = [
  // 1. In-progress tank coating upgrade on Triton IMO 1 — BV-approved
  {
    reference: 'MOD-2026-0001',
    equipmentId: 'TCNU8453210',
    type: 'tank_coating_upgrade',
    classSociety: 'BV',
    status: 'in_progress',
    openedDate: '2026-04-30',
    estimatorId: 'SRV-005',
    customerCode: 'C-CMAU',
    description: 'Upgrade interior 316L lining with epoxy-novolac coating to extend chemical compatibility for vegetable-oil duty.',
    costThb: 85000,
  },

  // 2. Completed reefer plug retrofit on Maersk MNBU — ABS-approved
  {
    reference: 'MOD-2026-0002',
    equipmentId: 'MNBU4598321',
    type: 'reefer_plug_retrofit',
    classSociety: 'ABS',
    status: 'completed',
    openedDate: '2026-03-12',
    completedDate: '2026-03-18',
    estimatorId: 'SRV-002',
    customerCode: 'C-MSKU',
    description: 'Retrofit Carrier 69NT40 plug to dual-voltage 460/380V for SE-Asia / IN-region intermodal compatibility.',
    costThb: 32500,
  },

  // 3. Approved floor replacement on Hapag-Lloyd 40' — wood-to-composite (no class review needed)
  {
    reference: 'MOD-2026-0003',
    equipmentId: 'HLXU5554326',
    type: 'floor_replacement',
    status: 'approved',
    openedDate: '2026-05-11',
    estimatorId: 'SRV-006',
    customerCode: 'C-HLXU',
    description: 'Replace original apitong floor with WPC composite (rot-resistant, lower lifetime cost).',
    costThb: 48000,
  },

  // 4. Class-review door seal upgrade on Beacon IMO 4 — IMO 4 service upgrade pending BV sign-off
  {
    reference: 'MOD-2026-0004',
    equipmentId: 'BEAU2671941',
    type: 'door_seal_upgrade',
    classSociety: 'BV',
    status: 'class_review',
    openedDate: '2026-05-08',
    estimatorId: 'SRV-003',
    customerCode: 'C-MSCU',
    description: 'Upgrade door seal to PTFE composite for IMO 4 corrosive-cargo service. Awaiting BV class-society review.',
    costThb: 18500,
  },

  // 5. Proposed cargo-securing retrofit on Florens bulk container — for filter-empty demo
  {
    reference: 'MOD-2026-0005',
    equipmentId: 'FCIU9988777',
    type: 'cargo_securing_retrofit',
    status: 'proposed',
    openedDate: '2026-05-15',
    estimatorId: 'SRV-007',
    customerCode: 'C-MSKU',
    description: 'Install lashing eyes on side rails for heavy-bulk securing; proposal awaiting customer sign-off.',
    costThb: 12750,
  },
];
