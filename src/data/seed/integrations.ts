/**
 * Seed: Third-party integrations.
 * Plan 01.07, Task 2b.
 *
 * Endpoint domains point to REAL third-party services (INTTRA, BIC, SendGrid,
 * Bangkok Bank, CMA CGM). Brand strings on the MNR side say "Gecko M&R" only —
 * D-16 brand lockdown forbids legacy pre-rebrand brand strings in this seed.
 */

export type IntegrationStatus = 'configured' | 'pending' | 'error' | 'disabled';

export type IntegrationCategory =
  | 'edi'
  | 'registry'
  | 'email'
  | 'banking'
  | 'carrier_api'
  | 'lessor_portal';

export interface IntegrationEntry {
  /** e.g. 'INT-001'. */
  id: string;
  /** Real-world handle, e.g. 'Maersk EDI INTTRA'. */
  name: string;
  category: IntegrationCategory;
  /** Vendor name, e.g. 'INTTRA' / 'BIC' / 'SendGrid'. */
  vendor: string;
  /** URL — REAL third-party domain only. */
  endpoint?: string;
  status: IntegrationStatus;
  /** ISO datetime. */
  lastSyncAt?: string;
  notes?: string;
}

export const integrations: IntegrationEntry[] = [
  // 1. Maersk EDI via INTTRA — configured
  { id: 'INT-001', name: 'Maersk EDI INTTRA',
    category: 'edi', vendor: 'INTTRA',
    endpoint: 'https://api.inttra.com/edi/v2',
    status: 'configured', lastSyncAt: '2026-05-18T08:30:00Z',
    notes: 'Daily container-movement EDIFACT (BAPLIE/COPRAR) sync at 06:00 SGT' },

  // 2. BIC code registry — configured
  { id: 'INT-002', name: 'Bureau International des Containers Code Registry',
    category: 'registry', vendor: 'BIC',
    endpoint: 'https://www.bic-code.org/api/v1',
    status: 'configured', lastSyncAt: '2026-05-12T00:00:00Z',
    notes: 'Weekly owner-code list refresh, used by Phase 3 BIC validation' },

  // 3. Depot email gateway via SendGrid — configured
  { id: 'INT-003', name: 'Depot Email Gateway (SendGrid)',
    category: 'email', vendor: 'SendGrid',
    endpoint: 'https://api.sendgrid.com/v3/mail/send',
    status: 'configured', lastSyncAt: '2026-05-18T08:42:00Z',
    notes: 'Transactional + invoice email; bounces logged to ops dashboard' },

  // 4. Bangkok Bank reconciliation feed — pending (awaiting API key)
  { id: 'INT-004', name: 'Bangkok Bank Reconciliation Feed',
    category: 'banking', vendor: 'Bangkok Bank',
    status: 'pending',
    notes: 'Awaiting API key from finance team; manual CSV import in interim' },

  // 5. CMA CGM eBL portal — error (token expired)
  { id: 'INT-005', name: 'CMA CGM eBL Portal',
    category: 'carrier_api', vendor: 'CMA CGM',
    endpoint: 'https://www.cma-cgm.com/api/ebl/v1',
    status: 'error', lastSyncAt: '2026-05-14T03:00:00Z',
    notes: 'OAuth token expired 2026-05-15; renewal queued with CMA CGM IT' },

  // 6. Beacon Intermodal lessor portal — disabled (pilot ended)
  { id: 'INT-006', name: 'Beacon Intermodal Lessor Portal',
    category: 'lessor_portal', vendor: 'Beacon Intermodal Leasing',
    endpoint: 'https://portal.beaconintermodal.com/api/v1',
    status: 'disabled',
    notes: 'Pilot integration disabled; revisit when fleet > 200 Beacon boxes' },
];
