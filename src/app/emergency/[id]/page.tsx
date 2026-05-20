"use client";

export const dynamic = "force-dynamic";

/**
 * /emergency/[id] — Emergency incident detail page.
 * Phase 7.15-A — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, AlertTriangle } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { emergencyRepo } from "@/lib/repos";

import styles from "./EmergencyDetail.module.css";

const severityPill: Record<string, string> = {
  critical: "gecko-pill-danger",
  high: "gecko-pill-danger",
  medium: "gecko-pill-warning",
  low: "gecko-pill-success",
};

const typeLabels: Record<string, string> = {
  spill_response: "Spill Response",
  hazmat_incident: "Hazmat Incident",
  rapid_repair_on_deck: "Rapid Repair on Deck",
  structural_failure: "Structural Failure",
  reefer_unit_failure: "Reefer Unit Failure",
};

// Map EmergencyStatus → StatusBadge status
const statusMap: Record<string, "active" | "responding" | "resolved" | "closed"> = {
  open: "active",
  on_site: "responding",
  contained: "resolved",
  closed: "closed",
};

const ROUTE = "/emergency/[id]";
const LIST_ROUTE = "/emergency";

export default function EmergencyDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = emergencyRepo.get(id);

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
    const allRefs = emergencyRepo.list().map((r) => r.reference);
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
                    href={`/emergency/${encodeURIComponent(suggestion)}`}
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

  const badgeStatus = statusMap[record.status] ?? "active";

  return (
    <AppShell>
      <DetailPageShell
        backHref="/emergency"
        backLabel="Back to Emergency"
        id={record.reference}
        pills={
          <>
            <StatusBadge status={badgeStatus} />
            <span className={`gecko-pill ${severityPill[record.severity] ?? "gecko-pill-neutral"}`}>
              {record.severity}
            </span>
          </>
        }
        title={typeLabels[record.type] ?? record.type}
        subtitle={`Depot ${record.depotCode} · ${record.reportedAt}`}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="fileText" size={16} /> Generate Report
            </button>
            <button type="button" className="gecko-btn gecko-btn-danger gecko-btn-sm">
              <Phone size={16} /> Call for Backup
            </button>
          </>
        }
        metrics={[
          {
            label: "Severity",
            value: record.severity.toUpperCase(),
            tone:
              record.severity === "critical" || record.severity === "high"
                ? "danger"
                : record.severity === "medium"
                ? "warning"
                : "success",
          },
          { label: "Reported", value: record.reportedAt },
          { label: "Cost", value: `฿${record.costThb.toLocaleString()}` },
        ]}
      >
        {/* ─── Alert banner ────────────────────────────────── */}
        {record.status !== "closed" && (
          <div
            className={`gecko-alert ${
              record.severity === "critical" ? "gecko-alert-error" : "gecko-alert-warning"
            }`}
          >
            <div className={styles.alertHeader}>
              <div className={styles.alertLeft}>
                <AlertTriangle
                  size={24}
                  className={`${
                    record.severity === "critical"
                      ? styles.alertIconCritical
                      : styles.alertIconWarning
                  } ${record.severity === "critical" ? styles.alertPulse : ""}`}
                />
                <div>
                  <span className={styles.alertTitle}>
                    {record.severity.toUpperCase()} — {typeLabels[record.type] ?? record.type}
                  </span>
                  <p className={styles.alertSubtitle}>Depot {record.depotCode}</p>
                </div>
              </div>
              <StatusBadge status={badgeStatus} />
            </div>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.column}>
            {/* ─── Incident details ─────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Incident {record.reference}</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Equipment:</span>
                      <span className={styles.detailsValueMono}>{record.equipmentId}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Depot:</span>
                      <span className={styles.detailsValue}>{record.depotCode}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Type:</span>
                      <span className="gecko-pill gecko-pill-neutral">
                        {typeLabels[record.type] ?? record.type}
                      </span>
                    </div>
                  </div>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Severity:</span>
                      <span
                        className={`gecko-pill ${
                          severityPill[record.severity] ?? "gecko-pill-neutral"
                        }`}
                      >
                        {record.severity}
                      </span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Reported:</span>
                      <span className={styles.detailsValue}>{record.reportedAt}</span>
                    </div>
                    {record.resolvedAt && (
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Resolved:</span>
                        <span className={styles.detailsValue}>{record.resolvedAt}</span>
                      </div>
                    )}
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Cost:</span>
                      <span className={styles.detailsValue}>
                        ฿{record.costThb.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <p className={styles.summaryLabel}>Summary:</p>
                  <p className={styles.summaryText}>{record.summary}</p>
                </div>
              </div>
            </div>

            {/* ─── Response timeline ────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Response Timeline</h3>
                <div className={styles.timelineList}>
                  <div className={styles.timelineRow}>
                    <div className={styles.timelineDotWrap}>
                      <div className={styles.timelineDot} />
                    </div>
                    <div className={styles.timelineBody}>
                      <div className={styles.timelineRowMeta}>
                        <span className={styles.timelineTime}>{record.reportedAt}</span>
                        <span className={styles.timelineEvent}>Emergency reported</span>
                      </div>
                    </div>
                  </div>
                  {record.resolvedAt && (
                    <div className={styles.timelineRow}>
                      <div className={styles.timelineDotWrap}>
                        <div className={styles.timelineDot} />
                      </div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineRowMeta}>
                          <span className={styles.timelineTime}>{record.resolvedAt}</span>
                          <span className={styles.timelineEvent}>Incident resolved</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Add update ─────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Add Update</h3>
                <div className={styles.commentForm}>
                  <textarea
                    className="gecko-input"
                    placeholder="Enter status update..."
                    rows={3}
                  />
                  <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
                    Post Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sidebar ──────────────────────────────────── */}
          <div className={styles.sidebar}>
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Responders on Scene</h3>
                <div className={styles.responderList}>
                  {record.responderIds.map((rid) => (
                    <div key={rid} className={styles.responderRow}>
                      <div className={styles.responderAvatar}>
                        <Icon name="user" size={18} />
                      </div>
                      <div>
                        <p className={styles.responderName}>{rid}</p>
                        <p className={styles.responderRole}>Responder</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Location</h3>
                <div className={styles.locationRow}>
                  <Icon name="mapPin" size={18} />
                  <span>{record.depotCode}</span>
                </div>
                <div className={styles.mapPlaceholder}>Map Placeholder</div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Quick Actions</h3>
                <div className={styles.actionsStack}>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    Mark as Resolved
                  </button>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    Create Repair Job
                  </button>
                  <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                    Close Incident
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
