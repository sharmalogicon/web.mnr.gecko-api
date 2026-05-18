"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Phone, MapPin, Clock, AlertTriangle, User, FileText } from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { emergencyJobs } from "@/data/seed/emergency";

const severityBadge: Record<string, string> = {
  critical: "gecko-badge-error",
  high: "gecko-badge-accent",
  medium: "gecko-badge-warning",
  low: "gecko-badge-success",
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
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = emergencyJobs.find((r) => r.reference === id);

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
    const allRefs = emergencyJobs.map((r) => r.reference);
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

  const badgeStatus = statusMap[record.status] ?? "active";

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <Button variant="destructive">
          <Phone className="mr-2 h-4 w-4" />
          Call for Backup
        </Button>
      </div>

      {/* Alert Banner */}
      {record.status !== "closed" && (
        <div
          className={cn(
            "gecko-alert mb-6",
            record.severity === "critical"
              ? "gecko-alert-error"
              : "gecko-alert-warning"
          )}
          style={{ display: "block", borderWidth: 2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={cn(
                  "h-6 w-6",
                  record.severity === "critical" && "animate-pulse"
                )}
                style={{
                  color:
                    record.severity === "critical"
                      ? "var(--gecko-error-600)"
                      : "var(--gecko-warning-600)",
                }}
              />
              <div>
                <span className="font-bold text-lg">
                  {record.severity.toUpperCase()} - {typeLabels[record.type] ?? record.type}
                </span>
                <p className="text-sm text-muted-foreground">Depot {record.depotCode}</p>
              </div>
            </div>
            <StatusBadge status={badgeStatus} />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident {record.reference}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment:</span>
                    <span className="font-mono font-medium">{record.equipmentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depot:</span>
                    <span>{record.depotCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{typeLabels[record.type] ?? record.type}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity:</span>
                    <span className={`gecko-badge ${severityBadge[record.severity] ?? "gecko-badge-gray"}`}>
                      {record.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reported:</span>
                    <span>{record.reportedAt}</span>
                  </div>
                  {record.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolved:</span>
                      <span>{record.resolvedAt}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">฿{record.costThb.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Summary:</p>
                <p className="text-sm text-muted-foreground">{record.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Response Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Response Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{record.reportedAt}</span>
                      <span className="font-medium">Emergency reported</span>
                    </div>
                  </div>
                </div>
                {record.resolvedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{record.resolvedAt}</span>
                        <span className="font-medium">Incident resolved</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Update */}
          <Card>
            <CardHeader>
              <CardTitle>Add Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Enter status update..." rows={3} />
              <Button>Post Update</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Responders on Scene</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.responderIds.map((rid) => (
                  <div key={rid} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-sm">{rid}</p>
                      <p className="text-xs text-muted-foreground">Responder</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{record.depotCode}</span>
              </div>
              <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                Map Placeholder
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Mark as Resolved
              </Button>
              <Button className="w-full" variant="outline">
                Create Repair Job
              </Button>
              <Button className="w-full" variant="outline">
                Close Incident
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/emergency")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Emergency
        </Button>
      </div>
    </AppShell>
  );
}
