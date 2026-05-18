"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { invoices } from "@/data/seed/billing";

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
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = invoices.find((r) => r.id === id);

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
    const allRefs = invoices.map((r) => r.id);
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
                    className="gecko-text-mono"
                    style={{ color: "var(--gecko-primary-600)", fontWeight: 600 }}
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

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Icon name="edit" size={16} className="mr-2" />
          Edit
        </Button>
        <Button variant="outline">
          <Icon name="download" size={16} className="mr-2" />
          Download PDF
        </Button>
        <Button variant="outline">
          <Icon name="send" size={16} className="mr-2" />
          Send to Customer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">INVOICE</h2>
                  <p className="font-mono text-lg">{record.id}</p>
                </div>
                <StatusBadge status={badgeStatus} />
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Bill To:</h4>
                  <p className="font-medium">{record.custName}</p>
                  <p className="text-sm text-muted-foreground">{mockChrome.customer.address}</p>
                  <p className="text-sm text-muted-foreground">{mockChrome.customer.email}</p>
                </div>
                <div className="text-right sm:text-left">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{record.date}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{record.dueDate}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Equipment:</span>
                      <span className="font-mono">{mockChrome.equipment}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Description</th>
                      <th className="text-left py-2 font-medium">Ref</th>
                      <th className="text-center py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Unit Price</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockChrome.lineItems.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 font-mono text-xs">{item.ref}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{record.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (7%):</span>
                  <span>{record.vat}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{record.total}</span>
                </div>
              </div>

              {mockChrome.notes && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <strong>Notes:</strong> {mockChrome.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {mockChrome.payments.length > 0 ? (
                <div className="space-y-3">
                  {mockChrome.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <span className="font-medium">{payment.method}</span>
                        <span className="mx-2 text-muted-foreground">-</span>
                        <span className="font-mono text-sm">{payment.ref}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          style={{
                            color: "var(--gecko-success-600)",
                            fontWeight: "var(--gecko-font-weight-medium)",
                          }}
                        >
                          +฿{payment.amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">{payment.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No payments recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span>{record.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span style={{ color: "var(--gecko-success-600)" }}>
                    -฿{paidNumeric.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span
                    style={{
                      color: balance > 0
                        ? "var(--gecko-warning-600)"
                        : "var(--gecko-success-600)",
                    }}
                  >
                    ฿{balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {balance > 0 && (
                <Button className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Icon name="printer" size={16} className="mr-2" />
                Print Invoice
              </Button>
              <Button className="w-full" variant="outline">
                <Icon name="send" size={16} className="mr-2" />
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/billing")}>
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Billing
        </Button>
      </div>
    </AppShell>
  );
}
