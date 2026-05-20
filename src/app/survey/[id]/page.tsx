"use client";

import { Suspense } from "react";
/**
 * /survey/[id] — Survey detail page.
 * Phase 7.15-A — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, Droplets, Minus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { surveyRepo } from "@/lib/repos";

import styles from "./SurveyDetail.module.css";

const mockChrome = {
  previousCargo: "Methanol",
  nextCargo: "Palm Oil",
  surveyType: "Pre-Cleaning Survey",
  checklist: {
    external: [
      { item: "Frame condition", result: "pass", note: "" },
      { item: "Shell condition", result: "pass", note: "" },
      { item: "Walkway & ladder", result: "pass", note: "" },
      { item: "Data plate legibility", result: "pass", note: "" },
    ],
    internal: [
      { item: "Tank interior cleanliness", result: "pass", note: "" },
      { item: "Cargo residue check", result: "pass", note: "" },
      { item: "Internal coating condition", result: "na", note: "" },
    ],
    valves: [
      { item: "Top discharge valve", result: "pass", note: "" },
      { item: "Bottom discharge valve", result: "pass", note: "" },
      { item: "Pressure relief valve", result: "pass", note: "" },
      { item: "Gaskets & seals", result: "fail", note: "Gasket needs replacement - worn" },
    ],
    testing: [
      { item: "Pressure test: 4.0 bar for 30 mins", result: "pass", note: "" },
      { item: "Vacuum test: -0.5 bar", result: "pass", note: "" },
    ],
  },
  photos: ["Front", "Left", "Right", "Gasket", "Valve"],
  linkedJobs: [
    { id: "REP-001234", type: "Repair", description: "Gasket Replacement", status: "pending" },
    { id: "CLN-001234", type: "Cleaning", description: "Food Grade Clean", status: "queued" },
  ],
};

const outcomeLabels: Record<
  "pass" | "pass_with_notes" | "must_repair" | "reject",
  string
> = {
  pass: "PASSED",
  pass_with_notes: "CONDITIONAL",
  must_repair: "MUST REPAIR",
  reject: "REJECTED",
};

function ChecklistResultIcon({ result }: { result: string }) {
  if (result === "pass")
    return <Icon name="check" size={16} className={styles.checkIconPass} />;
  if (result === "fail") return <Icon name="x" size={16} className={styles.checkIconFail} />;
  return <Minus className={`h-4 w-4 ${styles.checkIconNa}`} />;
}

const ROUTE = "/survey/[id]";
const LIST_ROUTE = "/survey";

function SurveyDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = surveyRepo.get(id);

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
    const allRefs = surveyRepo.list().map((r) => r.reference);
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
                    href={`/survey/${encodeURIComponent(suggestion)}`}
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

  const getChecklistSummary = (items: typeof mockChrome.checklist.external) => {
    const passed = items.filter((i) => i.result === "pass").length;
    const total = items.filter((i) => i.result !== "na").length;
    const hasFail = items.some((i) => i.result === "fail");
    return { passed, total, hasFail };
  };

  const outcomeLabel = outcomeLabels[record.outcome];
  const outcomeTone: "default" | "success" | "warning" | "danger" =
    record.outcome === "pass"
      ? "success"
      : record.outcome === "pass_with_notes"
      ? "warning"
      : "danger";
  const isPti = record.type === "pti";
  const canCertify = isPti && record.outcome === "pass";

  return (
    <AppShell>
      <DetailPageShell
        backHref="/survey"
        backLabel="Back to Surveys"
        id={record.reference}
        pills={
          <span className={`gecko-pill gecko-pill-${outcomeTone}`}>{outcomeLabel}</span>
        }
        title={record.type.toUpperCase()}
        subtitle={`Container ${record.equipmentId} · ${record.performedDate}`}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="edit" size={16} /> Edit
            </button>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="printer" size={16} /> Print Report
            </button>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="download" size={16} /> Download PDF
            </button>
            {canCertify && (
              <Link
                href={`/survey/${encodeURIComponent(record.reference)}/certificate`}
                className="gecko-btn gecko-btn-primary gecko-btn-sm"
              >
                <Icon name="fileText" size={16} /> Print Certificate
              </Link>
            )}
          </>
        }
        metrics={[
          { label: "Outcome", value: outcomeLabel, tone: outcomeTone },
          { label: "Surveyor", value: record.surveyorId },
          { label: "Depot", value: record.depotCode },
        ]}
      >
        <div className={styles.layout}>
          {/* ─── Tank details ─────────────────────────────────── */}
          <div className="gecko-card">
            <div className="gecko-card-body">
              <h3 className={styles.cardTitle}>Tank Details</h3>
              <div className={styles.detailsColumn}>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Survey #:</span>
                  <span className={styles.detailsValueMono}>{record.reference}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Container:</span>
                  <span className={styles.detailsValueMono}>{record.equipmentId}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Container Type:</span>
                  <span className={styles.detailsValue}>{record.containerType}</span>
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

          {/* ─── Survey result ────────────────────────────────── */}
          <div className="gecko-card">
            <div className="gecko-card-body">
              <h3 className={styles.cardTitle}>Survey Result</h3>
              <div className={styles.resultWrap}>
                <div className={styles.resultPill} data-outcome={record.outcome}>
                  {outcomeLabel}
                </div>
                {record.outcome === "pass_with_notes" && (
                  <p className={styles.resultNote}>See line notes for action items</p>
                )}
              </div>
              <hr className={styles.resultDivider} />
              <div className={styles.detailsColumn}>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Survey Type:</span>
                  <span className={styles.detailsValue}>{record.type}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Surveyor:</span>
                  <span className={styles.detailsValueMono}>{record.surveyorId}</span>
                </div>
                <div className={styles.detailsRow}>
                  <span className={styles.detailsLabel}>Date:</span>
                  <span className={styles.detailsValue}>{record.performedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Checklist results ─────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <h3 className={styles.cardTitle}>Checklist Results</h3>
            {Object.entries(mockChrome.checklist).map(([category, items]) => {
              const summary = getChecklistSummary(items);
              return (
                <div key={category} className={styles.checklistGroup}>
                  <div className={styles.checklistHeader}>
                    <h4 className={styles.checklistTitle}>{category} Inspection</h4>
                    <span
                      className={`gecko-pill ${
                        summary.hasFail ? "gecko-pill-danger" : "gecko-pill-success"
                      }`}
                    >
                      {summary.passed}/{summary.total} {summary.hasFail ? "⚠" : "✓"}
                    </span>
                  </div>
                  <div className={styles.checklistList}>
                    {items.map((item, idx) => (
                      <div key={idx} className={styles.checklistItem}>
                        <ChecklistResultIcon result={item.result} />
                        <div>
                          <span
                            className={
                              item.result === "na"
                                ? styles.checklistItemTextNa
                                : styles.checklistItemText
                            }
                          >
                            {item.item}
                            {item.result === "na" && " (N/A)"}
                          </span>
                          {item.note && (
                            <p className={styles.checklistItemNote}>
                              Note: &quot;{item.note}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Photos ───────────────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <h3 className={styles.cardTitle}>Photos ({mockChrome.photos.length})</h3>
            <div className={styles.photoGrid}>
              {mockChrome.photos.map((photo) => (
                <div key={photo} className={styles.photoTile}>
                  {photo}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Linked jobs ──────────────────────────────────── */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <h3 className={styles.cardTitle}>Linked Jobs</h3>
            <div className={styles.jobList}>
              {mockChrome.linkedJobs.map((job) => (
                <div
                  key={job.id}
                  className={styles.jobRow}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/${job.type.toLowerCase()}/${job.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/${job.type.toLowerCase()}/${job.id}`);
                    }
                  }}
                >
                  <div className={styles.jobLeft}>
                    {job.type === "Repair" ? (
                      <Wrench className={`h-4 w-4 ${styles.iconMuted}`} />
                    ) : (
                      <Droplets className={`h-4 w-4 ${styles.iconMuted}`} />
                    )}
                    <div>
                      <span className={styles.jobId}>{job.id}</span>
                      <span className={styles.jobDash}>—</span>
                      <span className={styles.jobDescription}>{job.description}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status as "pending" | "queued"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailPageShell>
    </AppShell>
  );
}

export default function SurveyDetailPage() {
  return (
    <Suspense fallback={null}>
      <SurveyDetailPageInner />
    </Suspense>
  );
}
