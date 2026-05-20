"use client";

export const dynamic = "force-dynamic";

/**
 * /cleaning/[id] — Cleaning job detail page.
 * Phase 7.15-A — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { cleaningRepo } from "@/lib/repos";

import styles from "./CleaningDetail.module.css";

const mockChrome = {
  previousCargo: "Methanol",
  nextCargo: "Palm Oil",
  bay: 2,
  priority: "urgent",
  operator: "Mike Johnson",
  startedAt: "10:30 AM",
  estimatedCompletion: "4:30 PM",
  progress: 75,
  processLog: [
    { time: "10:30", step: "Pre-rinse completed", status: "completed" },
    { time: "10:45", step: "Caustic wash started - 80°C", status: "completed" },
    { time: "11:30", step: "Caustic wash completed", status: "completed" },
    { time: "11:35", step: "Intermediate rinse completed", status: "completed" },
    { time: "11:45", step: "Acid wash in progress...", status: "in_progress" },
    { time: "--:--", step: "Final rinse", status: "pending" },
    { time: "--:--", step: "Drying", status: "pending" },
    { time: "--:--", step: "Quality inspection", status: "pending" },
  ],
  chemicals: [
    { name: "Caustic Soda", quantity: "15 L", batch: "CS-2024-12", cost: 45 },
    { name: "Citric Acid", quantity: "8 L", batch: "CA-2024-08", cost: 32 },
    { name: "Sanitizer", quantity: "5 L", batch: "SN-2024-11", cost: 28 },
  ],
};

const progressSteps = ["Queue", "Started", "Washing", "Complete"];

const ROUTE = "/cleaning/[id]";
const LIST_ROUTE = "/cleaning";

function snapTo5(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

export default function CleaningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = cleaningRepo.get(id);

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
    const allRefs = cleaningRepo.list().map((r) => r.reference);
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
                    href={`/cleaning/${encodeURIComponent(suggestion)}`}
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

  const currentStepIndex =
    record.status === "queued" ? 0 : record.status === "in_progress" ? 2 : 3;

  return (
    <AppShell>
      <DetailPageShell
        backHref="/cleaning"
        backLabel="Back to Cleaning"
        id={record.reference}
        pills={<StatusBadge status={record.status} />}
        title={`Container ${record.equipmentId}`}
        subtitle={`${record.type} · Bay ${mockChrome.bay} · ${mockChrome.operator}`}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="edit" size={16} /> Edit
            </button>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="printer" size={16} /> Print
            </button>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Pause size={16} /> Pause
            </button>
            <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
              <Icon name="check" size={16} /> Complete &amp; Certify
            </button>
          </>
        }
        metrics={[
          { label: "Progress", value: `${mockChrome.progress}%` },
          { label: "Started", value: mockChrome.startedAt },
          { label: "ETA", value: mockChrome.estimatedCompletion },
          { label: "Cost", value: `฿${record.costThb.toLocaleString()}` },
        ]}
      >
        {/* ─── Progress section ────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <div className={styles.progressSteps}>
              {progressSteps.map((step, index) => (
                <div key={step} className={styles.progressItem}>
                  <div
                    className={`${styles.progressDot} ${
                      index <= currentStepIndex ? styles.progressDotActive : ""
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Icon name="check" size={16} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`${styles.progressLabel} ${
                      index <= currentStepIndex ? styles.progressLabelActive : ""
                    }`}
                  >
                    {step}
                  </span>
                  {index < progressSteps.length - 1 && (
                    <div
                      className={`${styles.progressLine} ${
                        index < currentStepIndex ? styles.progressLineActive : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className={styles.progressBar}>
              <div className={styles.progressBarHeader}>
                <span className={styles.progressBarLabel}>Progress</span>
                <span className={styles.progressBarValue}>{mockChrome.progress}%</span>
              </div>
              <div className="gecko-progress">
                <div
                  className="gecko-progress-bar gecko-progress-fill gecko-progress-primary"
                  data-progress={snapTo5(mockChrome.progress)}
                />
              </div>
              <div className={styles.progressBarFooter}>
                <span>Started: {mockChrome.startedAt}</span>
                <span>Estimated completion: {mockChrome.estimatedCompletion}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* ─── Tank details ─────────────────────────────── */}
          <div className="gecko-card">
            <div className="gecko-card-body">
              <h3 className={styles.cardTitle}>Tank Details</h3>
              <div className={styles.detailsColumn}>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Cleaning #:</span>
                  <span className={styles.detailsValueMono}>{record.reference}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Container:</span>
                  <span className={styles.detailsValueMono}>{record.equipmentId}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Depot:</span>
                  <span className={styles.detailsValue}>{record.depotCode}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Previous Cargo:</span>
                  <span className={styles.detailsValue}>{mockChrome.previousCargo}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Next Cargo:</span>
                  <span className={styles.detailsValue}>{mockChrome.nextCargo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Job information ──────────────────────────── */}
          <div className="gecko-card">
            <div className="gecko-card-body">
              <h3 className={styles.cardTitle}>Job Information</h3>
              <div className={styles.detailsColumn}>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Type:</span>
                  <span className={styles.detailsValue}>{record.type}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Status:</span>
                  <StatusBadge status={record.status} />
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Bay:</span>
                  <span className={styles.detailsValue}>Bay {mockChrome.bay}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Priority:</span>
                  <span
                    className={`gecko-pill ${
                      mockChrome.priority === "urgent"
                        ? "gecko-pill-danger"
                        : "gecko-pill-neutral"
                    }`}
                  >
                    {mockChrome.priority}
                  </span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Operator:</span>
                  <span className={styles.detailsValue}>{mockChrome.operator}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Opened:</span>
                  <span className={styles.detailsValue}>{record.openedDate}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Cost:</span>
                  <span className={styles.detailsValue}>
                    ฿{record.costThb.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Process log ─────────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <h3 className={styles.cardTitle}>Cleaning Process Log</h3>
            <div className={styles.logList}>
              {mockChrome.processLog.map((log, index) => (
                <div key={index} className={styles.logRow}>
                  <span className={styles.logTime}>{log.time}</span>
                  <div className={styles.stepIcon} data-tone={log.status}>
                    {log.status === "completed" && <Icon name="check" size={14} />}
                    {log.status === "in_progress" && <Play className="h-3 w-3" />}
                    {log.status === "pending" && <Icon name="clock" size={12} />}
                  </div>
                  <span
                    className={`${styles.logStep} ${
                      log.status === "pending" ? styles.logStepPending : ""
                    }`}
                  >
                    {log.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Chemical usage ──────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <h3 className={styles.cardTitle}>Chemical Usage</h3>
            <div className={styles.tableWrap}>
              <table className="gecko-table gecko-table-comfortable">
                <thead>
                  <tr>
                    <th>Chemical</th>
                    <th>Quantity</th>
                    <th>Batch #</th>
                    <th className="text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {mockChrome.chemicals.map((chem, index) => (
                    <tr key={index}>
                      <td>{chem.name}</td>
                      <td>{chem.quantity}</td>
                      <td className="gecko-text-mono">{chem.batch}</td>
                      <td className="text-right">${chem.cost}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total Chemical Cost:</td>
                    <td className="text-right">
                      ${mockChrome.chemicals.reduce((sum, c) => sum + c.cost, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </DetailPageShell>
    </AppShell>
  );
}
