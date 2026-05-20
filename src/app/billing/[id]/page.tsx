"use client";

/**
 * /billing/[id] — Invoice detail page.
 * Phase 7.13-A1 — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { invoiceRepo } from "@/lib/repos";

import styles from "./InvoiceDetail.module.css";

// Visual chrome the seed doesn't model (line items, payment history, contact info)
const mockChrome = {
  customer: {
    address: "123 Port Road, Bangkok 10100",
    email: "billing@customer.com",
    phone: "+66 2 123 4567",
  },
  equipment: "MSKU2345671",
  lineItems: [
    { description: "Pre-cleaning Survey", ref: "SRV-001234", quantity: 1, unitPrice: 150, total: 150 },
    { description: "Food Grade Cleaning", ref: "CLN-001234", quantity: 1, unitPrice: 850, total: 850 },
    { description: "Gasket Replacement", ref: "REP-001234", quantity: 2, unitPrice: 85, total: 170 },
    { description: "Labor - Repair (2 hrs)", ref: "REP-001234", quantity: 2, unitPrice: 45, total: 90 },
  ],
  notes: "Payment due within 30 days of invoice date.",
  payments: [
    { date: "Apr 25, 2026", method: "Bank Transfer", amount: 5000, ref: "TXN-123456" },
  ],
};

// Map InvoiceStatus (PascalCase) → StatusBadge status (lowercase)
const statusMap: Record<string, "draft" | "completed" | "overdue" | "paid" | "cancelled"> = {
  Draft: "draft",
  Final: "completed",
  Overdue: "overdue",
  Paid: "paid",
  Void: "cancelled",
};

const ROUTE = "/billing/[id]";
const LIST_ROUTE = "/billing";

export default function InvoiceDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = invoiceRepo.get(id);

  if (forceLoading) {
    return (
      <AppShell>
        <DetailSpinner label={getLoadingLabel(ROUTE)} />
      </AppShell>
    );
  }
  if (forceError) {
    const errCopy = getErrorCopy(LIST_ROUTE);
    return (
      <AppShell>
        <ErrorState
          title={errCopy.title}
          description={errCopy.description}
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }
  if (!record) {
    const allRefs = invoiceRepo.list().map((r) => r.id);
    const suggestion = nearestReference(id, allRefs);
    const copy = getEmptyCopy(ROUTE, "not-found");
    if (!copy) {
      return (
        <AppShell>
          <EmptyState variant="not-found" title="Not found" />
        </AppShell>
      );
    }
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          icon={copy.icon}
          title={copy.title}
          description={
            <>
              {copy.description.replace("{ID}", id)}
              {suggestion && (
                <>
                  <br />
                  <br />
                  Did you mean{" "}
                  <Link
                    href={`/billing/${encodeURIComponent(suggestion)}`}
                    className={styles.notFoundSuggest}
                  >
                    {suggestion}
                  </Link>
                  ?
                </>
              )}
            </>
          }
          primary={copy.primary}
          secondary={
            copy.secondary && {
              ...copy.secondary,
              href: copy.secondary.href.replace("{ID}", encodeURIComponent(id)),
            }
          }
        />
      </AppShell>
    );
  }

  const totalNumeric = Number(record.total.replace(/[^\d.]/g, "")) || 0;
  const paidNumeric = mockChrome.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalNumeric - paidNumeric;
  const badgeStatus = statusMap[record.status] ?? "draft";
  const balanceFmt = `฿${balance.toLocaleString()}`;
  const paidFmt = `-฿${paidNumeric.toLocaleString()}`;

  return (
    <AppShell>
      <DetailPageShell
        backHref="/billing"
        backLabel="Back to Billing"
        id={record.id}
        pills={<StatusBadge status={badgeStatus} />}
        title={record.custName}
        subtitle={`Invoice ${record.id} · Due ${record.dueDate}`}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="edit" size={16} /> Edit
            </button>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="download" size={16} /> Download PDF
            </button>
            <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
              <Icon name="send" size={16} /> Send to Customer
            </button>
          </>
        }
        metrics={[
          { label: "Invoice Total", value: record.total },
          {
            label: "Amount Paid",
            value: paidFmt,
            tone: "success",
          },
          {
            label: "Balance Due",
            value: balanceFmt,
            tone: balance > 0 ? "warning" : "success",
          },
        ]}
      >
        <div className={styles.layout}>
          <div className={styles.column}>
            {/* ─── Invoice header card ─────────────────────────── */}
            <div className="gecko-card">
              <div className={`gecko-card-body ${styles.headerCard}`}>
                <div className={styles.headerTopRow}>
                  <div className={styles.headerIdRow}>
                    <span className={styles.headerLabel}>Invoice</span>
                    <span className={styles.headerId}>{record.id}</span>
                  </div>
                  <StatusBadge status={badgeStatus} />
                </div>

                <div className={styles.headerMetaGrid}>
                  <div className={styles.metaBlock}>
                    <div className={styles.metaTitle}>Bill To</div>
                    <div className={styles.metaValue}>{record.custName}</div>
                    <div className={styles.metaMuted}>{mockChrome.customer.address}</div>
                    <div className={styles.metaMuted}>{mockChrome.customer.email}</div>
                  </div>
                  <div className={styles.metaBlock}>
                    <div className={styles.metaRow}>
                      <span>Issue Date:</span>
                      <span>{record.date}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Due Date:</span>
                      <span>{record.dueDate}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Equipment:</span>
                      <span className="gecko-text-mono">{mockChrome.equipment}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Line items ──────────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Line Items</h3>
                <div className={styles.tableWrap}>
                  <table className="gecko-table gecko-table-comfortable">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Ref</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockChrome.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td className="gecko-text-mono">{item.ref}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right gecko-text-mono">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="text-right gecko-text-mono">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>{record.amount}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>VAT (7%)</span>
                    <span>{record.vat}</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <span>Total</span>
                    <span>{record.total}</span>
                  </div>
                </div>

                {mockChrome.notes && (
                  <div className={styles.notes}>
                    <span className={styles.notesLabel}>Notes: </span>
                    {mockChrome.notes}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Payment history ─────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Payment History</h3>
                {mockChrome.payments.length > 0 ? (
                  <div className={styles.paymentList}>
                    {mockChrome.payments.map((payment, index) => (
                      <div key={index} className={styles.paymentRow}>
                        <div className={styles.paymentLeft}>
                          <span className={styles.paymentMethod}>{payment.method}</span>
                          <span className={styles.paymentRef}>{payment.ref}</span>
                        </div>
                        <div className={styles.paymentRight}>
                          <span className={styles.paymentAmount}>
                            +฿{payment.amount.toLocaleString()}
                          </span>
                          <span className={styles.paymentDate}>{payment.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyPayments}>No payments recorded yet</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─────────────────────────────────────── */}
          <div className={styles.sidebar}>
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Payment Summary</h3>
                <div className={styles.sidebarCardBody}>
                  <div className={styles.sidebarStack}>
                    <div className={styles.summaryRow}>
                      <span>Invoice Total</span>
                      <span>{record.total}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Amount Paid</span>
                      <span className={styles.amountPaid}>{paidFmt}</span>
                    </div>
                    <div className={styles.balanceRow}>
                      <span>Balance Due</span>
                      <span
                        className={`${styles.balanceValue} ${
                          balance > 0 ? styles.balanceValueDue : styles.balanceValuePaid
                        }`}
                      >
                        {balanceFmt}
                      </span>
                    </div>
                  </div>

                  {balance > 0 && (
                    <button
                      type="button"
                      className="gecko-btn gecko-btn-primary gecko-btn-sm"
                    >
                      <Icon name="creditCard" size={16} /> Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Quick Actions</h3>
                <div className={styles.actionsStack}>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    <Icon name="printer" size={16} /> Print Invoice
                  </button>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    <Icon name="send" size={16} /> Send Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DetailPageShell>
    </AppShell>
  );
}
