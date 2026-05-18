/**
 * Seed: Tariff audit-trail history.
 * Plan 01.07, Task 2. Records every published / signed / revised / added
 * change across rate-cards, contracts, customer-rates and surcharges.
 *
 * `changedBy` is either a real staff name (mirrors the surveyor pool naming
 * convention) or the literal string 'system' for automated revisions.
 */

export type TariffHistoryEntryType =
  | 'rate_card_published'
  | 'contract_signed'
  | 'surcharge_added'
  | 'rate_card_revised';

export interface TariffHistoryEntry {
  /** e.g. 'TRH-2026-00001'. */
  id: string;
  type: TariffHistoryEntryType;
  /** Reference to the affected entity, e.g. 'RC-LCB-2026-Q2' / 'CTR-2026-0001'. */
  entityId: string;
  /** Human name or 'system'. */
  changedBy: string;
  /** ISO datetime. */
  changedAt: string;
  summary: string;
}

export const tariffHistory: TariffHistoryEntry[] = [
  // 1. Laem Chabang Q2 rate card published
  { id: 'TRH-2026-00001', type: 'rate_card_published', entityId: 'RC-LCB-2026-Q2',
    changedBy: 'Apirak Chaiwan', changedAt: '2026-03-25T09:15:00Z',
    summary: 'Published Laem Chabang Q2 2026 rate card (effective 2026-04-01)' },

  // 2. Lat Krabang Q2 rate card published
  { id: 'TRH-2026-00002', type: 'rate_card_published', entityId: 'RC-LKR-2026-Q2',
    changedBy: 'Apirak Chaiwan', changedAt: '2026-03-25T09:18:00Z',
    summary: 'Published Lat Krabang ICD Q2 2026 rate card' },

  // 3. Maersk master contract signed
  { id: 'TRH-2026-00003', type: 'contract_signed', entityId: 'CTR-2026-0001',
    changedBy: 'Prasong Suthikorn', changedAt: '2026-01-08T14:42:00Z',
    summary: 'Countersigned Maersk Line 2026 Master contract (Platinum)' },

  // 4. CMA CGM contract signed
  { id: 'TRH-2026-00004', type: 'contract_signed', entityId: 'CTR-2026-0002',
    changedBy: 'Prasong Suthikorn', changedAt: '2026-01-10T11:05:00Z',
    summary: 'Countersigned CMA CGM (Thailand) 2026 H1 contract' },

  // 5. Peak-season surcharge added
  { id: 'TRH-2026-00005', type: 'surcharge_added', entityId: 'SRC-2026-0001',
    changedBy: 'system', changedAt: '2026-03-31T00:00:00Z',
    summary: 'Auto-enabled Peak Season Surcharge (15% Apr-Jun, all TH DRY)' },

  // 6. Hazmat surcharge added
  { id: 'TRH-2026-00006', type: 'surcharge_added', entityId: 'SRC-2026-0002',
    changedBy: 'Tan Wei Ming', changedAt: '2026-01-04T08:30:00Z',
    summary: 'Added Hazmat Handling Premium (flat THB 2,500/job)' },

  // 7. Port Klang Northport rate card revised mid-quarter (currency conversion update)
  { id: 'TRH-2026-00007', type: 'rate_card_revised', entityId: 'RC-PKN-2026-Q2',
    changedBy: 'Ahmad bin Razak', changedAt: '2026-04-22T10:00:00Z',
    summary: 'Revised PKN Q2 storage_per_diem rate from 65 to 70 THB/day equivalent' },

  // 8. MSC contract signed
  { id: 'TRH-2026-00008', type: 'contract_signed', entityId: 'CTR-2026-0003',
    changedBy: 'Prasong Suthikorn', changedAt: '2026-01-15T13:20:00Z',
    summary: 'Countersigned MSC Mediterranean Shipping 2026 contract (Gold)' },

  // 9. Jurong rate card published
  { id: 'TRH-2026-00009', type: 'rate_card_published', entityId: 'RC-JUR-2026-Q2',
    changedBy: 'Goh Mei Ling', changedAt: '2026-03-26T07:45:00Z',
    summary: 'Published Jurong Port Q2 2026 rate card (SGD)' },

  // 10. Hapag-Lloyd draft contract sent
  { id: 'TRH-2026-00010', type: 'contract_signed', entityId: 'CTR-2026-0005',
    changedBy: 'Prasong Suthikorn', changedAt: '2026-05-12T16:00:00Z',
    summary: 'Sent Hapag-Lloyd 2026 Master contract draft for countersign' },
];
