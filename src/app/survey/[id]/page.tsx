"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, Droplets, Minus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { surveyRepo } from "@/lib/repos";

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

const resultStyles: Record<
  "pass" | "pass_with_notes" | "must_repair" | "reject",
  { background: string; color: string; borderColor: string; label: string }
> = {
  pass: {
    background: "var(--gecko-success-100)",
    color: "var(--gecko-success-800)",
    borderColor: "var(--gecko-success-300)",
    label: "PASSED",
  },
  pass_with_notes: {
    background: "var(--gecko-warning-100)",
    color: "var(--gecko-warning-800)",
    borderColor: "var(--gecko-warning-300)",
    label: "CONDITIONAL",
  },
  must_repair: {
    background: "var(--gecko-error-100)",
    color: "var(--gecko-error-800)",
    borderColor: "var(--gecko-error-300)",
    label: "MUST REPAIR",
  },
  reject: {
    background: "var(--gecko-error-100)",
    color: "var(--gecko-error-800)",
    borderColor: "var(--gecko-error-300)",
    label: "REJECTED",
  },
};

function ChecklistResultIcon({ result }: { result: string }) {
  if (result === "pass")
    return <Icon name="check" size={16} style={{ color: "var(--gecko-success-600)" }} />;
  if (result === "fail")
    return <Icon name="x" size={16} style={{ color: "var(--gecko-error-600)" }} />;
  return <Minus className="h-4 w-4" style={{ color: "var(--gecko-text-disabled)" }} />;
}

const ROUTE = "/survey/[id]";
const LIST_ROUTE = "/survey";

export default function SurveyDetailPage() {
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

  const getChecklistSummary = (items: typeof mockChrome.checklist.external) => {
    const passed = items.filter((i) => i.result === "pass").length;
    const total = items.filter((i) => i.result !== "na").length;
    const hasFail = items.some((i) => i.result === "fail");
    return { passed, total, hasFail };
  };

  const outcomeStyle = resultStyles[record.outcome];

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Icon name="edit" size={16} className="mr-2" />
          Edit
        </Button>
        <Button variant="outline">
          <Icon name="printer" size={16} className="mr-2" />
          Print Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Survey #:</span>
              <span className="font-mono font-medium">{record.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Container:</span>
              <span className="font-mono font-medium">{record.equipmentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Container Type:</span>
              <span>{record.containerType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Depot:</span>
              <span>{record.depotCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Cargo:</span>
              <span>{mockChrome.previousCargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Cargo:</span>
              <span>{mockChrome.nextCargo}</span>
            </div>
          </CardContent>
        </Card>

        {/* Survey Result */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <div
                className="px-6 py-3 text-lg font-bold"
                style={{
                  borderRadius: "var(--gecko-radius-lg)",
                  border: `2px solid ${outcomeStyle.borderColor}`,
                  background: outcomeStyle.background,
                  color: outcomeStyle.color,
                }}
              >
                {outcomeStyle.label}
              </div>
              {record.outcome === "pass_with_notes" && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  See line notes for action items
                </p>
              )}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Survey Type:</span>
                <span>{record.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surveyor:</span>
                <span className="font-mono">{record.surveyorId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{record.performedDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Results */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Checklist Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(mockChrome.checklist).map(([category, items]) => {
            const summary = getChecklistSummary(items);
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize">{category} Inspection</h4>
                  <Badge variant={summary.hasFail ? "destructive" : "secondary"}>
                    {summary.passed}/{summary.total} {summary.hasFail ? "⚠" : "✓"}
                  </Badge>
                </div>
                <div className="space-y-2 ml-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChecklistResultIcon result={item.result} />
                      <div className="flex-1">
                        <span className={item.result === "na" ? "text-muted-foreground" : ""}>
                          {item.item}
                          {item.result === "na" && " (N/A)"}
                        </span>
                        {item.note && (
                          <p className="text-sm text-muted-foreground mt-0.5">
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
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Photos ({mockChrome.photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {mockChrome.photos.map((photo) => (
              <div
                key={photo}
                className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground border"
              >
                {photo}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked Jobs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Linked Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockChrome.linkedJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/${job.type.toLowerCase()}/${job.id}`)}
              >
                <div className="flex items-center gap-3">
                  {job.type === "Repair" ? (
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-mono font-medium">{job.id}</span>
                    <span className="mx-2">-</span>
                    <span>{job.description}</span>
                  </div>
                </div>
                <StatusBadge status={job.status as "pending" | "queued"} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push("/survey")}>
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to List
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon name="download" size={16} className="mr-2" />
            Download PDF
          </Button>
          <Button>Create Follow-up Job</Button>
        </div>
      </div>
    </AppShell>
  );
}
