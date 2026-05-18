"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, History, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StockBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { parts } from "@/data/seed/parts";

const mockChrome = {
  description: "Stainless steel component for container maintenance. See unit cost and stock availability below.",
  minimum: 5,
  location: "A-3",
  supplier: "Container Parts Co.",
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

const ROUTE = "/parts/[id]";
const LIST_ROUTE = "/parts";

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = parts.find((r) => r.sku === id);

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
    const allRefs = parts.map((r) => r.sku);
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
                    href={`/parts/${encodeURIComponent(suggestion)}`}
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

  const stockLevel = (record.stockOnHand / mockChrome.minimum) * 100;
  const isLowStock = record.stockOnHand <= mockChrome.minimum;
  const isOutOfStock = record.stockOnHand === 0;

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Icon name="edit" size={16} className="mr-2" />
          Edit
        </Button>
        <Button>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Order More
        </Button>
      </div>

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
              - Current: {record.stockOnHand}, Minimum: {mockChrome.minimum}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Part Details */}
          <Card>
            <CardHeader>
              <CardTitle>{record.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{mockChrome.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono font-medium">{record.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{record.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">฿{record.unitCostThb.toLocaleString()}</span>
                  </div>
                  {record.cedexCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CEDEX:</span>
                      <span className="font-mono">{record.cedexCode}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{mockChrome.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{mockChrome.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Order:</span>
                    <span>{mockChrome.lastOrder}</span>
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
                {mockChrome.history.map((item, index) => (
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
                {mockChrome.usedIn.map((usage, index) => (
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
                <div className="text-4xl font-bold">{record.stockOnHand}</div>
                <div className="text-sm text-muted-foreground">units in stock</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stock Level</span>
                  <StockBadge quantity={record.stockOnHand} minimum={mockChrome.minimum} />
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
                  <span>Min: {mockChrome.minimum}</span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Monthly Usage:</span>
                  <span>{mockChrome.avgMonthlyUsage} units</span>
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
                    {mockChrome.avgMonthlyUsage > 0
                      ? Math.floor(record.stockOnHand / mockChrome.avgMonthlyUsage * 30)
                      : 0}{" "}
                    days
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
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Parts
        </Button>
      </div>
    </AppShell>
  );
}
