"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, ShoppingCart, History, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StockBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const mockPart = {
  id: "VLV-001",
  name: 'Ball Valve 3" DN80',
  category: "Valves",
  description: "3-inch stainless steel ball valve for tank discharge applications. DN80 flange connection.",
  price: 150,
  stock: 2,
  minimum: 5,
  location: "A-3",
  supplier: "Tank Parts Co.",
  lastOrder: "Nov 15, 2024",
  avgMonthlyUsage: 3,
  history: [
    { date: "Dec 10, 2024", action: "Used", quantity: -1, ref: "REP-001234", balance: 2 },
    { date: "Dec 5, 2024", action: "Used", quantity: -2, ref: "REP-001220", balance: 3 },
    { date: "Nov 28, 2024", action: "Received", quantity: 5, ref: "PO-000456", balance: 5 },
    { date: "Nov 20, 2024", action: "Used", quantity: -1, ref: "REP-001180", balance: 0 },
    { date: "Nov 15, 2024", action: "Received", quantity: 3, ref: "PO-000445", balance: 1 },
  ],
  usedIn: [
    { job: "REP-001234", tank: "MSKU2234567", date: "Dec 10, 2024" },
    { job: "REP-001220", tank: "TCLU9987654", date: "Dec 5, 2024" },
    { job: "REP-001180", tank: "HLXU1122334", date: "Nov 20, 2024" },
  ],
};

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();

  const stockLevel = (mockPart.stock / mockPart.minimum) * 100;
  const isLowStock = mockPart.stock <= mockPart.minimum;
  const isOutOfStock = mockPart.stock === 0;

  return (
    <AppShell>
      <PageHeader
        title={mockPart.name}
        description={`SKU: ${mockPart.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Parts", href: "/parts" },
          { label: mockPart.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Order More
            </Button>
          </div>
        }
      />

      {/* Low Stock Alert */}
      {isLowStock && (
        <div
          className={`gecko-alert mb-6 ${isOutOfStock ? "gecko-alert-error" : "gecko-alert-warning"}`}
          style={{ display: "block" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{
                color: isOutOfStock
                  ? "var(--gecko-error-600)"
                  : "var(--gecko-warning-600)",
              }}
            />
            <span
              style={{
                fontWeight: "var(--gecko-font-weight-medium)",
                color: isOutOfStock
                  ? "var(--gecko-error-800)"
                  : "var(--gecko-warning-800)",
              }}
            >
              {isOutOfStock ? "Out of Stock!" : "Low Stock Warning"}
            </span>
            <span
              className="text-sm"
              style={{
                color: isOutOfStock
                  ? "var(--gecko-error-700)"
                  : "var(--gecko-warning-700)",
              }}
            >
              - Current: {mockPart.stock}, Minimum: {mockPart.minimum}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Part Details */}
          <Card>
            <CardHeader>
              <CardTitle>Part Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{mockPart.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono font-medium">{mockPart.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{mockPart.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">${mockPart.price}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{mockPart.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{mockPart.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Order:</span>
                    <span>{mockPart.lastOrder}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock History */}
          <Card>
            <CardHeader>
              <CardTitle>Stock History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPart.history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {item.quantity > 0 ? (
                        <TrendingUp className="h-4 w-4" style={{ color: "var(--gecko-success-600)" }} />
                      ) : (
                        <TrendingDown className="h-4 w-4" style={{ color: "var(--gecko-error-600)" }} />
                      )}
                      <div>
                        <span className="font-medium">{item.action}</span>
                        <span className="mx-2 text-muted-foreground">-</span>
                        <span className="font-mono text-sm">{item.ref}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        style={{
                          color: item.quantity > 0
                            ? "var(--gecko-success-600)"
                            : "var(--gecko-error-600)",
                        }}
                      >
                        {item.quantity > 0 ? "+" : ""}{item.quantity}
                      </span>
                      <span className="text-muted-foreground">Balance: {item.balance}</span>
                      <span className="text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPart.usedIn.map((usage, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/repair/${usage.job}`)}
                  >
                    <div>
                      <span className="font-mono font-medium">{usage.job}</span>
                      <span className="mx-2 text-muted-foreground">-</span>
                      <span className="font-mono text-sm">{usage.tank}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{usage.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{mockPart.stock}</div>
                <div className="text-sm text-muted-foreground">units in stock</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stock Level</span>
                  <StockBadge quantity={mockPart.stock} minimum={mockPart.minimum} />
                </div>
                <Progress
                  value={Math.min(stockLevel, 100)}
                  style={{
                    background: isOutOfStock
                      ? "var(--gecko-error-100)"
                      : isLowStock
                        ? "var(--gecko-warning-100)"
                        : undefined,
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>Min: {mockPart.minimum}</span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Monthly Usage:</span>
                  <span>{mockPart.avgMonthlyUsage} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Stock Duration:</span>
                  <span
                    style={{
                      color: isLowStock ? "var(--gecko-error-600)" : undefined,
                      fontWeight: isLowStock
                        ? "var(--gecko-font-weight-medium)"
                        : undefined,
                    }}
                  >
                    {Math.floor(mockPart.stock / mockPart.avgMonthlyUsage * 30)} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
              <Button className="w-full" variant="outline">
                <History className="mr-2 h-4 w-4" />
                View Full History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/parts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Parts
        </Button>
      </div>
    </AppShell>
  );
}
