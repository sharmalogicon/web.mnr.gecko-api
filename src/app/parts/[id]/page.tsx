"use client";

import { Suspense } from "react";
/**
 * /parts/[id] — Part detail page.
 * Phase 7.15-A — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StockBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { partRepo } from "@/lib/repos";

import styles from "./PartDetail.module.css";

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

// Snap a percentage 0-100 → nearest 5% bucket for gecko-progress-fill.
function snapTo5(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

function PartDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = partRepo.get(id);

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
    const allRefs = partRepo.list().map((r) => r.sku);
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

  const stockLevel = (record.stockOnHand / mockChrome.minimum) * 100;
  const isLowStock = record.stockOnHand <= mockChrome.minimum;
  const isOutOfStock = record.stockOnHand === 0;
  const stockTone: "default" | "warning" | "danger" = isOutOfStock
    ? "danger"
    : isLowStock
    ? "warning"
    : "default";
  const estDays =
    mockChrome.avgMonthlyUsage > 0
      ? Math.floor((record.stockOnHand / mockChrome.avgMonthlyUsage) * 30)
      : 0;

  return (
    <AppShell>
      <DetailPageShell
        backHref="/parts"
        backLabel="Back to Parts"
        id={record.sku}
        title={record.name}
        subtitle={record.category}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="edit" size={16} /> Edit
            </button>
            <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
              <ShoppingCart size={16} /> Order More
            </button>
          </>
        }
        metrics={[
          {
            label: "In Stock",
            value: `${record.stockOnHand} units`,
            hint: `Min ${mockChrome.minimum}`,
            tone: stockTone === "default" ? "default" : stockTone,
          },
          {
            label: "Unit Cost",
            value: `฿${record.unitCostThb.toLocaleString()}`,
          },
          {
            label: "Est. Duration",
            value: `${estDays} days`,
            tone: isLowStock ? "danger" : "default",
          },
        ]}
      >
        {isLowStock && (
          <div
            className={`gecko-alert ${isOutOfStock ? "gecko-alert-error" : "gecko-alert-warning"}`}
          >
            <div className={styles.alertRow}>
              <AlertTriangle size={20} />
              <span className={styles.alertLabel}>
                {isOutOfStock ? "Out of Stock!" : "Low Stock Warning"}
              </span>
              <span className={styles.alertDetail}>
                — Current: {record.stockOnHand}, Minimum: {mockChrome.minimum}
              </span>
            </div>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.column}>
            {/* ─── Part details card ───────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>{record.name}</h3>
                <p className={styles.description}>{mockChrome.description}</p>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>SKU:</span>
                      <span className={styles.detailsValueMono}>{record.sku}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Category:</span>
                      <span className="gecko-pill gecko-pill-neutral">{record.category}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Unit Price:</span>
                      <span className={styles.detailsValue}>฿{record.unitCostThb.toLocaleString()}</span>
                    </div>
                    {record.cedexCode && (
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>CEDEX:</span>
                        <span className={styles.detailsValueMono}>{record.cedexCode}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Location:</span>
                      <span className={styles.detailsValue}>{mockChrome.location}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Supplier:</span>
                      <span className={styles.detailsValue}>{mockChrome.supplier}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Last Order:</span>
                      <span className={styles.detailsValue}>{mockChrome.lastOrder}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Stock history ───────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Stock History</h3>
                <div className={styles.historyList}>
                  {mockChrome.history.map((item, index) => (
                    <div key={index} className={styles.historyRow}>
                      <div className={styles.historyLeft}>
                        {item.quantity > 0 ? (
                          <TrendingUp size={16} className="gecko-text-success" />
                        ) : (
                          <TrendingDown size={16} className="gecko-text-danger" />
                        )}
                        <div>
                          <span className={styles.historyAction}>{item.action}</span>
                          <span className={styles.historyDash}> — </span>
                          <span className={styles.historyRef}>{item.ref}</span>
                        </div>
                      </div>
                      <div className={styles.historyRight}>
                        <span
                          className={`${styles.historyQty} ${
                            item.quantity > 0 ? styles.historyQtyPos : styles.historyQtyNeg
                          }`}
                        >
                          {item.quantity > 0 ? "+" : ""}{item.quantity}
                        </span>
                        <span className={styles.historyMuted}>Balance: {item.balance}</span>
                        <span className={styles.historyMuted}>{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Recent usage ────────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Recent Usage</h3>
                <div className={styles.usageList}>
                  {mockChrome.usedIn.map((usage, index) => (
                    <div
                      key={index}
                      className={styles.usageRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/repair/${usage.job}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          router.push(`/repair/${usage.job}`);
                        }
                      }}
                    >
                      <div>
                        <span className={styles.usageId}>{usage.job}</span>
                        <span className={styles.historyDash}> — </span>
                        <span className={styles.usageTank}>{usage.tank}</span>
                      </div>
                      <span className={styles.usageDate}>{usage.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─────────────────────────────────────── */}
          <div className={styles.sidebar}>
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Stock Level</h3>
                <div className={styles.stockSummary}>
                  <div className={styles.stockHeaderRow}>
                    <span>Stock Level</span>
                    <StockBadge quantity={record.stockOnHand} minimum={mockChrome.minimum} />
                  </div>
                  <div className="gecko-progress">
                    <div
                      className={`gecko-progress-bar gecko-progress-fill ${
                        isOutOfStock
                          ? "gecko-progress-error"
                          : isLowStock
                          ? "gecko-progress-warning"
                          : "gecko-progress-primary"
                      }`}
                      data-progress={snapTo5(stockLevel)}
                    />
                  </div>
                  <div className={styles.stockScale}>
                    <span>0</span>
                    <span>Min: {mockChrome.minimum}</span>
                  </div>

                  <div className={styles.stockSummaryDivider}>
                    <div className={styles.stockSummaryRow}>
                      <span className={styles.stockSummaryLabel}>Avg. Monthly Usage:</span>
                      <span className={styles.stockSummaryValue}>{mockChrome.avgMonthlyUsage} units</span>
                    </div>
                    <div className={styles.stockSummaryRow}>
                      <span className={styles.stockSummaryLabel}>Est. Stock Duration:</span>
                      <span
                        className={
                          isLowStock ? styles.stockSummaryValueLow : styles.stockSummaryValue
                        }
                      >
                        {estDays} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Quick Actions</h3>
                <div className={styles.actionsStack}>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    <ShoppingCart size={16} /> Create Purchase Order
                  </button>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    <History size={16} /> View Full History
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

export default function PartDetailPage() {
  return (
    <Suspense fallback={null}>
      <PartDetailPageInner />
    </Suspense>
  );
}
