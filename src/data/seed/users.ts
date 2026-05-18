/**
 * Seed: Application users (staff login accounts).
 * Plan 01.07, Task 2b.
 *
 * NOTE: Distinct from `surveyors` in `_shared/surveyors.ts` — surveyors are the
 * field-staff registry (referenced as `surveyorId` from repair/survey records);
 * users are login accounts (referenced from session / audit log in Phase 2).
 *
 * Names follow the same plausibly-SE-Asian (TH / MY / SG mix) convention as
 * the surveyor pool but use different humans — these are office/finance/admin
 * staff, not field surveyors.
 *
 * Email domain: `gecko-mnr.example` (D-16 brand lockdown — Gecko M&R brand
 * only; legacy pre-rebrand brand strings are explicitly forbidden by D-16).
 * `gecko-mnr.example` is the IANA-reserved demo domain `.example` so it never
 * resolves accidentally in a real DNS lookup.
 */

export type UserRole =
  | 'surveyor'
  | 'estimator'
  | 'approver'
  | 'depot_manager'
  | 'finance'
  | 'admin'
  | 'read_only';

export type UserStatus = 'active' | 'invited' | 'suspended';

export interface UserRecord {
  /** e.g. 'USR-001'. */
  id: string;
  /** Plausibly SE-Asian name (TH / MY / SG mix per UI-SPEC §9.6). */
  name: string;
  /** `first.last@gecko-mnr.example`. */
  email: string;
  role: UserRole;
  /** FK to `depots[].code`. */
  homeDepotCode: string;
  status: UserStatus;
  /** ISO datetime. */
  lastActiveAt: string;
}

export const users: UserRecord[] = [
  // 1. Admin (TH, Laem Chabang HQ)
  { id: 'USR-001', name: 'Niran Phongsakorn',         email: 'niran.phongsakorn@gecko-mnr.example',
    role: 'admin',          homeDepotCode: 'LCB', status: 'active',    lastActiveAt: '2026-05-18T08:42:00Z' },

  // 2. Approver (TH, Lat Krabang)
  { id: 'USR-002', name: 'Wanida Charoensri',         email: 'wanida.charoensri@gecko-mnr.example',
    role: 'approver',       homeDepotCode: 'LKR', status: 'active',    lastActiveAt: '2026-05-17T17:05:00Z' },

  // 3. Estimator (MY, Pasir Gudang)
  { id: 'USR-003', name: 'Hafiz bin Ismail',          email: 'hafiz.ismail@gecko-mnr.example',
    role: 'estimator',      homeDepotCode: 'PGU', status: 'active',    lastActiveAt: '2026-05-17T14:30:00Z' },

  // 4. Depot manager (SG, Jurong)
  { id: 'USR-004', name: 'Chan Mei Lin',              email: 'chan.meilin@gecko-mnr.example',
    role: 'depot_manager',  homeDepotCode: 'JUR', status: 'active',    lastActiveAt: '2026-05-18T07:15:00Z' },

  // 5. Finance (TH, head office at LCB)
  { id: 'USR-005', name: 'Suchada Wattanakul',        email: 'suchada.wattanakul@gecko-mnr.example',
    role: 'finance',        homeDepotCode: 'LCB', status: 'active',    lastActiveAt: '2026-05-17T18:50:00Z' },

  // 6. Read-only auditor (SG, PSA Pasir Panjang)
  { id: 'USR-006', name: 'Rajesh Kumaran',            email: 'rajesh.kumaran@gecko-mnr.example',
    role: 'read_only',      homeDepotCode: 'PPP', status: 'active',    lastActiveAt: '2026-05-15T10:20:00Z' },

  // 7. Surveyor recently invited, not yet logged in (MY, Port Klang Northport)
  { id: 'USR-007', name: 'Siti Aisyah binti Hassan',  email: 'siti.aisyah@gecko-mnr.example',
    role: 'surveyor',       homeDepotCode: 'PKN', status: 'invited',   lastActiveAt: '2026-05-16T09:00:00Z' },

  // 8. Suspended estimator (TH) — demo of suspended-status filter
  { id: 'USR-008', name: 'Thawatchai Boonmee',        email: 'thawatchai.boonmee@gecko-mnr.example',
    role: 'estimator',      homeDepotCode: 'LCB', status: 'suspended', lastActiveAt: '2026-03-02T11:00:00Z' },
];
