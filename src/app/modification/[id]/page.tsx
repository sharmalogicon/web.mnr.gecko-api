"use client";

/**
 * /modification/[id] — Modification request detail page.
 * Phase 7.15-A — migrated to <DetailPageShell> from page-shells.
 */

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { DetailPageShell } from "@/components/page-shells";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { modificationRepo } from "@/lib/repos";

import styles from "./ModificationDetail.module.css";

// Visual chrome the seed doesn't model (comments, attachments, timeline)
const mockChrome = {
  priority: "high",
  requestedBy: "John Smith",
  justification:
    "Customer requires this modification to support new cargo profile. Modification will allow the container to service a wider range of cargo types and increase utilization.",
  attachments: [
    { name: "specs.pdf", size: "2.4 MB" },
    { name: "cost_estimate.xlsx", size: "156 KB" },
  ],
  comments: [
    {
      user: "Mike Johnson",
      role: "Technical Lead",
      date: "Reviewed",
      text: "Reviewed the technical specs. Standard parts should be sufficient.",
    },
    {
      user: "Sarah Lee",
      role: "Operations Manager",
      date: "Pending",
      text: "Please confirm lead time for installation.",
    },
  ],
  timeline: [
    { date: "Opened", event: "Request submitted", user: "John Smith" },
    { date: "Reviewed", event: "Assigned for technical review", user: "System" },
    { date: "Approved", event: "Technical review completed", user: "Mike Johnson" },
  ],
};

// Map ModificationStatus → StatusBadge status
const statusMap: Record<string, "pending" | "in_progress" | "approved" | "completed"> = {
  proposed: "pending",
  class_review: "pending",
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
};

const ROUTE = "/modification/[id]";
const LIST_ROUTE = "/modification";

export default function ModificationDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = modificationRepo.get(id);

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
    const allRefs = modificationRepo.list().map((r) => r.reference);
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
                    href={`/modification/${encodeURIComponent(suggestion)}`}
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

  const badgeStatus = statusMap[record.status] ?? "pending";
  const canDecide = record.status === "proposed" || record.status === "class_review";

  return (
    <AppShell>
      <DetailPageShell
        backHref="/modification"
        backLabel="Back to Modifications"
        id={record.reference}
        pills={
          <>
            <StatusBadge status={badgeStatus} />
            <span
              className={`gecko-pill ${
                mockChrome.priority === "high" ? "gecko-pill-danger" : "gecko-pill-neutral"
              }`}
            >
              {mockChrome.priority}
            </span>
          </>
        }
        title={record.type}
        subtitle={`Container ${record.equipmentId} · ${record.customerCode}`}
        toolbar={
          <>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <Icon name="edit" size={16} /> Edit
            </button>
            {canDecide && (
              <>
                <button type="button" className="gecko-btn gecko-btn-danger gecko-btn-sm">
                  <Icon name="x" size={16} /> Reject
                </button>
                <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
                  <Icon name="check" size={16} /> Approve
                </button>
              </>
            )}
          </>
        }
        metrics={[
          { label: "Estimated Cost", value: `฿${record.costThb.toLocaleString()}` },
          { label: "Opened", value: record.openedDate },
          { label: "Estimator", value: record.estimatorId },
        ]}
      >
        <div className={styles.layout}>
          <div className={styles.column}>
            {/* ─── Request details ──────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>{record.reference}</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Equipment:</span>
                      <span className={styles.detailsValueMono}>{record.equipmentId}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Customer:</span>
                      <span className={styles.detailsValue}>{record.customerCode}</span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Opened:</span>
                      <span className={styles.detailsValue}>{record.openedDate}</span>
                    </div>
                    {record.completedDate && (
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Completed:</span>
                        <span className={styles.detailsValue}>{record.completedDate}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.detailsColumn}>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Modification Type:</span>
                      <span className={styles.detailsValue}>{record.type}</span>
                    </div>
                    {record.classSociety && (
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Class Society:</span>
                        <span className="gecko-pill gecko-pill-neutral">
                          {record.classSociety}
                        </span>
                      </div>
                    )}
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Priority:</span>
                      <span
                        className={`gecko-pill ${
                          mockChrome.priority === "high"
                            ? "gecko-pill-danger"
                            : "gecko-pill-neutral"
                        }`}
                      >
                        {mockChrome.priority}
                      </span>
                    </div>
                    <div className={styles.detailsRow}>
                      <span className={styles.detailsLabel}>Estimated Cost:</span>
                      <span className={styles.detailsValue}>
                        ฿{record.costThb.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className={styles.divider} />

                <p className={styles.sectionLabel}>Description</p>
                <p className={styles.sectionText}>{record.description}</p>

                <hr className={styles.divider} />

                <p className={styles.sectionLabel}>Business Justification</p>
                <p className={styles.sectionText}>{mockChrome.justification}</p>
              </div>
            </div>

            {/* ─── Comments ────────────────────────────── */}
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Comments &amp; Discussion</h3>
                <div className={styles.commentList}>
                  {mockChrome.comments.map((comment, index) => (
                    <div key={index} className={styles.commentRow}>
                      <div className={styles.commentAvatar}>
                        {comment.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className={styles.commentBody}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentUser}>{comment.user}</span>
                          <span className={styles.commentRole}>({comment.role})</span>
                          <span className={styles.commentDate}>{comment.date}</span>
                        </div>
                        <p className={styles.commentText}>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className={styles.divider} />

                <div className={styles.commentForm}>
                  <textarea
                    className="gecko-input"
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
                    <MessageSquare size={16} /> Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─────────────────────────────────── */}
          <div className={styles.sidebar}>
            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Request Info</h3>
                <div className={styles.detailsColumn}>
                  <div className={styles.detailsRow}>
                    <span className={styles.detailsLabel}>Estimator:</span>
                    <span className={styles.detailsValueMono}>{record.estimatorId}</span>
                  </div>
                  <div className={styles.detailsRow}>
                    <span className={styles.detailsLabel}>Requested By:</span>
                    <span className={styles.detailsValue}>{mockChrome.requestedBy}</span>
                  </div>
                  <div className={styles.detailsRow}>
                    <span className={styles.detailsLabel}>Opened Date:</span>
                    <span className={styles.detailsValue}>{record.openedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Attachments</h3>
                <div className={styles.attachmentList}>
                  {mockChrome.attachments.map((file, index) => (
                    <div key={index} className={styles.attachmentRow}>
                      <div className={styles.attachmentLeft}>
                        <Icon name="fileText" size={16} />
                        <span className={styles.attachmentName}>{file.name}</span>
                      </div>
                      <span className={styles.attachmentSize}>{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gecko-card">
              <div className="gecko-card-body">
                <h3 className={styles.cardTitle}>Timeline</h3>
                <div className={styles.timelineList}>
                  {mockChrome.timeline.map((item, index) => (
                    <div key={index} className={styles.timelineRow}>
                      <div className={styles.timelineDotCol}>
                        <div className={styles.timelineDot} />
                        {index < mockChrome.timeline.length - 1 && (
                          <div className={styles.timelineLine} />
                        )}
                      </div>
                      <div className={styles.timelineBody}>
                        <p className={styles.timelineEvent}>{item.event}</p>
                        <div className={styles.timelineMeta}>
                          <Icon name="clock" size={12} />
                          <span>{item.date}</span>
                          <span>by {item.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DetailPageShell>
    </AppShell>
  );
}
