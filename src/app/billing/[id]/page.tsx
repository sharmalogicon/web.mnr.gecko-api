"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Download, Send, CreditCard, Printer } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockInvoice = {
  id: "INV-2024-0089",
  customer: {
    name: "CMA CGM",
    address: "123 Port Road, Bangkok 10100",
    email: "billing@cmacgm.com",
    phone: "+66 2 123 4567",
  },
  status: "pending" as const,
  issueDate: "Dec 10, 2024",
  dueDate: "Dec 25, 2024",
  equipment: "MSKU2234567",
  lineItems: [
    { description: "Pre-cleaning Survey", ref: "SRV-001234", quantity: 1, unitPrice: 150, total: 150 },
    { description: "Food Grade Cleaning", ref: "CLN-001234", quantity: 1, unitPrice: 850, total: 850 },
    { description: "Gasket Replacement", ref: "REP-001234", quantity: 2, unitPrice: 85, total: 170 },
    { description: "Labor - Repair (2 hrs)", ref: "REP-001234", quantity: 2, unitPrice: 45, total: 90 },
  ],
  subtotal: 1260,
  tax: 88.2,
  total: 1348.2,
  notes: "Payment due within 15 days of invoice date.",
  payments: [
    { date: "Dec 12, 2024", method: "Bank Transfer", amount: 500, ref: "TXN-123456" },
  ],
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const balance = mockInvoice.total - mockInvoice.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell>
      <PageHeader
        title={`Invoice ${mockInvoice.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Billing", href: "/billing" },
          { label: mockInvoice.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline">
              <Send className="mr-2 h-4 w-4" />
              Send to Customer
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">INVOICE</h2>
                  <p className="font-mono text-lg">{mockInvoice.id}</p>
                </div>
                <StatusBadge status={mockInvoice.status} />
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Bill To:</h4>
                  <p className="font-medium">{mockInvoice.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{mockInvoice.customer.address}</p>
                  <p className="text-sm text-muted-foreground">{mockInvoice.customer.email}</p>
                </div>
                <div className="text-right sm:text-left">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{mockInvoice.issueDate}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{mockInvoice.dueDate}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-4">
                      <span className="text-muted-foreground">Equipment:</span>
                      <span className="font-mono">{mockInvoice.equipment}</span>
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
                    {mockInvoice.lineItems.map((item, index) => (
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
                  <span>${mockInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (7%):</span>
                  <span>${mockInvoice.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${mockInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {mockInvoice.notes && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <strong>Notes:</strong> {mockInvoice.notes}
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
              {mockInvoice.payments.length > 0 ? (
                <div className="space-y-3">
                  {mockInvoice.payments.map((payment, index) => (
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
                          +${payment.amount.toFixed(2)}
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
                  <span>${mockInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span style={{ color: "var(--gecko-success-600)" }}>
                    -${mockInvoice.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
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
                    ${balance.toFixed(2)}
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
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              <Button className="w-full" variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/billing")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Button>
      </div>
    </AppShell>
  );
}
