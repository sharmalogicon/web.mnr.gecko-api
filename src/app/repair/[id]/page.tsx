"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  FileText,
  CheckCircle,
  Calendar,
  User,
  Clock,
  Plus,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { DetailPageShell } from "@/components/page-shells";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { repairRepo } from "@/lib/repos";

// Visual chrome the seed doesn't model (photos, work log, granular costs).
// Kept as decoration so the existing UI shape stays intact.
const mockChrome = {
  progress: 60,
  daysCurrent: 3,
  daysTotal: 5,
  damageType: "Valve Replacement",
  assignedTo: "Workshop Team A",
  description:
    "Bottom discharge valve leaking. Gasket worn and valve body shows signs of corrosion. Complete valve replacement required.",
  photos: [
    { id: 1, label: "Before 1", type: "before" },
    { id: 2, label: "Before 2", type: "before" },
    { id: 3, label: "Before 3", type: "before" },
    { id: 4, label: "During 1", type: "during" },
    { id: 5, label: "During 2", type: "during" },
  ],
  workLog: [
    { id: 1, date: "Dec 12", time: "14:30", user: "Mike J.", action: "Valve removed, awaiting new part" },
    { id: 2, date: "Dec 11", time: "16:00", user: "Mike J.", action: "Old gasket removed, surface cleaned" },
    { id: 3, date: "Dec 11", time: "09:00", user: "Mike J.", action: "Started disassembly" },
    { id: 4, date: "Dec 10", time: "14:00", user: "System", action: "Work order created" },
  ],
  parts: [
    { name: 'Ball Valve 3"', qty: 1, status: "issued", unitPrice: 450, total: 450 },
    { name: "Gasket Set T11", qty: 1, status: "issued", unitPrice: 85, total: 85 },
    { name: "Teflon Tape", qty: 2, status: "issued", unitPrice: 12, total: 24 },
  ],
  costs: {
    parts: 559,
    labor: 640,
    laborHours: 8,
    laborRate: 80,
    overhead: 120,
    subtotal: 1319,
    margin: 329.75,
    marginPercent: 25,
    total: 1648.75,
  },
};

const severityConfig = {
  critical: { label: "Critical", badge: "gecko-badge-error" },
  normal:   { label: "Normal",   badge: "gecko-badge-accent" },
  minor:    { label: "Minor",    badge: "gecko-badge-success" },
};

const statusConfig: Record<string, { label: string; badge: string }> = {
  estimated:          { label: "Estimated",          badge: "gecko-badge-info" },
  awaiting_approval:  { label: "Awaiting Approval",  badge: "gecko-badge-accent" },
  approved:           { label: "Approved",           badge: "gecko-badge-primary" },
  in_progress:        { label: "In Progress",        badge: "gecko-badge-warning" },
  completed:          { label: "Completed",          badge: "gecko-badge-success" },
};

const ROUTE = "/repair/[id]";
const LIST_ROUTE = "/repair";

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = repairRepo.get(id);

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
    const allRefs = repairRepo.list().map((r) => r.reference);
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
                    href={`/repair/${encodeURIComponent(suggestion)}`}
                    className="gecko-text-mono gecko-text-primary"
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

  const severity = severityConfig[record.severity];
  const status = statusConfig[record.status];

  const toolbar = (
    <>
      {/* REPAIR-04 — Approver workflow. Visible only when awaiting_approval. */}
      {record.status === "awaiting_approval" && (
        <>
          <button
            type="button"
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
            onClick={() => {
              repairRepo.update(record.reference, { status: "estimated" });
              router.refresh();
            }}
          >
            Reject (back to estimate)
          </button>
          <button
            type="button"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
            onClick={() => {
              repairRepo.update(record.reference, { status: "approved" });
              router.refresh();
            }}
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
        </>
      )}
      {record.status === "estimated" && (
        <button
          type="button"
          className="gecko-btn gecko-btn-outline gecko-btn-sm"
          onClick={() => {
            repairRepo.update(record.reference, { status: "awaiting_approval" });
            router.refresh();
          }}
        >
          Submit for approval
        </button>
      )}
      <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
        <Edit className="h-4 w-4" />
        Edit
      </button>
      <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
        <FileText className="h-4 w-4" />
        Quote
      </button>
      <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
        <CheckCircle className="h-4 w-4" />
        Complete
      </button>
    </>
  );

  return (
    <AppShell>
      <DetailPageShell
        backHref="/repair"
        backLabel="Back to Repair"
        id={record.reference}
        pills={
          <span className={cn("gecko-badge", status.badge)}>{status.label}</span>
        }
        toolbar={toolbar}
        metrics={[
          { label: "Severity", value: severity.label },
          {
            label: "Total cost",
            value: `฿${record.totalCostThb.toLocaleString()}`,
          },
          {
            label: "Progress",
            value: `${mockChrome.progress}%`,
            hint: `Day ${mockChrome.daysCurrent} of ${mockChrome.daysTotal}`,
          },
        ]}
      >
      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Day {mockChrome.daysCurrent} of {mockChrome.daysTotal}
            </span>
          </div>
          <div className="gecko-progress">
            <div
              className="gecko-progress-bar gecko-progress-primary gecko-progress-fill"
              data-progress={Math.round(mockChrome.progress / 5) * 5}
            />
          </div>
          <div className="mt-2 text-right text-sm font-medium">
            {mockChrome.progress}% Complete
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tank & Repair Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Container Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Container</span>
                  <span className="font-medium font-mono">{record.equipmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{record.customerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opened</span>
                  <span>{record.openedDate}</span>
                </div>
                {record.closedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed</span>
                    <span>{record.closedDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Repair Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity</span>
                  <span className={cn("gecko-badge", severity.badge)}>
                    {severity.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimator</span>
                  <span className="font-mono">{record.estimatorId}</span>
                </div>
                {record.approverId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approver</span>
                    <span className="font-mono">{record.approverId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="font-medium">฿{record.totalCostThb.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Damage Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Damage Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{mockChrome.description}</p>
            </CardContent>
          </Card>

          {/* Damage Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Damage Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {mockChrome.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-muted/50 text-center"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">{photo.label}</span>
                  </div>
                ))}
                <button className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed hover:bg-muted/50">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 text-xs text-muted-foreground">Add</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Work Log */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Work Log</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockChrome.workLog.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-4 text-sm",
                      index !== mockChrome.workLog.length - 1 && "pb-3 border-b"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <Calendar className="h-3.5 w-3.5" />
                      {entry.date}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5" />
                      {entry.time}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <User className="h-3.5 w-3.5" />
                      {entry.user}
                    </div>
                    <span className="flex-1">{entry.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cost Summary */}
        <div className="space-y-6">
          {/* Repair Lines (from seed) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Repair Lines (CEDEX)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {record.lines.map((line, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {line.location}/{line.component}/{line.damage}/{line.repair}
                      </span>
                    </div>
                    <span className="font-medium">฿{line.costThb.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>฿{record.totalCostThb.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parts</span>
                  <span>${mockChrome.costs.parts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Labor ({mockChrome.costs.laborHours} hrs x ${mockChrome.costs.laborRate}/hr)
                  </span>
                  <span>${mockChrome.costs.labor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overhead</span>
                  <span>${mockChrome.costs.overhead.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${mockChrome.costs.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Margin ({mockChrome.costs.marginPercent}%)
                  </span>
                  <span>${mockChrome.costs.margin.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between gecko-card-title">
                  <span>Quote Total</span>
                  <span>${mockChrome.costs.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </DetailPageShell>
    </AppShell>
  );
}
