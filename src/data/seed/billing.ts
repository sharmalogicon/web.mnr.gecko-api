/**
 * Seed: Invoices (billing).
 * Plan 01.07, Task 2. Shape ported VERBATIM from TOS billing/invoices/page.tsx
 * per PATTERNS.md §7 — `฿`-prefixed display strings for Phase 1 (numeric amounts
 * move to repository-layer in Phase 2).
 *
 * Customer names use REAL shipping-line brands from `_shared/customers.ts`
 * (Maersk, CMA CGM, MSC, ONE, etc.) — different customer pool to TOS's
 * commodity-shipper analog. See PATTERNS.md §7 for the realism rationale.
 *
 * VAT applied at TH 7% standard rate. Status mix includes ≥ 1 Overdue for the
 * `/billing?status=overdue` filter-empty demo.
 */

export type InvoiceStatus = 'Draft' | 'Final' | 'Overdue' | 'Paid' | 'Void';

export interface Invoice {
  /** e.g. 'INV-26-009412' — TOS shape preserved. */
  id: string;
  /** Display string, e.g. 'Apr 24, 2026' (TOS pattern). */
  date: string;
  dueDate: string;
  /** FK to `customers[].code`. */
  customerCode: string;
  /** Denormalised for table-render speed (TOS pattern). */
  custName: string;
  /** '฿12,450.00' — ฿-prefixed display string per UI-SPEC §9 + TOS pattern. */
  amount: string;
  /** '฿871.50' (7% TH VAT). */
  vat: string;
  /** '฿13,321.50'. */
  total: string;
  status: InvoiceStatus;
}

export const invoices: Invoice[] = [
  // 1. Draft — Maersk Line (Platinum)
  { id: 'INV-26-009412', date: 'Apr 24, 2026', dueDate: 'May 24, 2026',
    customerCode: 'C-MSKU', custName: 'Maersk Line',
    amount: '฿12,450.00', vat: '฿871.50', total: '฿13,321.50', status: 'Draft' },

  // 2. Final — CMA CGM
  { id: 'INV-26-009411', date: 'Apr 22, 2026', dueDate: 'May 22, 2026',
    customerCode: 'C-CMAU', custName: 'CMA CGM (Thailand) Co., Ltd.',
    amount: '฿8,200.00', vat: '฿574.00', total: '฿8,774.00', status: 'Final' },

  // 3. Overdue — Hapag-Lloyd (storage accrual past due)
  { id: 'INV-26-009395', date: 'Mar 18, 2026', dueDate: 'Apr 17, 2026',
    customerCode: 'C-HLXU', custName: 'Hapag-Lloyd',
    amount: '฿4,800.00', vat: '฿336.00', total: '฿5,136.00', status: 'Overdue' },

  // 4. Paid — ONE (40' HC survey + cleaning)
  { id: 'INV-26-009408', date: 'Apr 20, 2026', dueDate: 'May 20, 2026',
    customerCode: 'C-ONEU', custName: 'Ocean Network Express (ONE)',
    amount: '฿1,755.00', vat: '฿122.85', total: '฿1,877.85', status: 'Paid' },

  // 5. Final — MSC (food-grade tank repair)
  { id: 'INV-26-009410', date: 'Apr 21, 2026', dueDate: 'May 21, 2026',
    customerCode: 'C-MSCU', custName: 'MSC Mediterranean Shipping',
    amount: '฿8,025.00', vat: '฿561.75', total: '฿8,586.75', status: 'Final' },

  // 6. Draft — Evergreen (handling-damage estimate)
  { id: 'INV-26-009415', date: 'May 12, 2026', dueDate: 'Jun 11, 2026',
    customerCode: 'C-EVRU', custName: 'Evergreen Marine',
    amount: '฿1,287.00', vat: '฿90.09', total: '฿1,377.09', status: 'Draft' },

  // 7. Paid — Yang Ming (off-hire storage closed)
  { id: 'INV-26-009387', date: 'Feb 28, 2026', dueDate: 'Mar 30, 2026',
    customerCode: 'C-YMLU', custName: 'Yang Ming',
    amount: '฿2,475.00', vat: '฿173.25', total: '฿2,648.25', status: 'Paid' },

  // 8. Final — COSCO (corner-casting structural repair)
  { id: 'INV-26-009402', date: 'Apr 09, 2026', dueDate: 'May 09, 2026',
    customerCode: 'C-COSU', custName: 'COSCO Shipping',
    amount: '฿9,375.00', vat: '฿656.25', total: '฿10,031.25', status: 'Final' },

  // 9. Void — HMM (cancelled survey, billed and reversed)
  { id: 'INV-26-009399', date: 'Apr 02, 2026', dueDate: 'May 02, 2026',
    customerCode: 'C-HMMU', custName: 'HMM',
    amount: '฿450.00', vat: '฿31.50', total: '฿481.50', status: 'Void' },

  // 10. Overdue — ZIM (reefer evaporator clean estimate not paid by due date)
  { id: 'INV-26-009378', date: 'Feb 12, 2026', dueDate: 'Mar 14, 2026',
    customerCode: 'C-ZIMU', custName: 'ZIM',
    amount: '฿9,250.00', vat: '฿647.50', total: '฿9,897.50', status: 'Overdue' },
];
