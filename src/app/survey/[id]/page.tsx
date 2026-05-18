"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Printer, Download, Wrench, Droplets, Check, X, Minus } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockSurvey = {
  id: "SRV-001234",
  tankNumber: "MSKU2234567",
  tankType: "T11 (26,000L)",
  owner: "CMA CGM",
  customer: "CMA CGM",
  previousCargo: "Methanol",
  nextCargo: "Palm Oil",
  surveyType: "Pre-Cleaning Survey",
  result: "conditional" as const,
  surveyor: "John Smith",
  date: "Dec 12, 2024 10:30 AM",
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
  "pass" | "conditional" | "fail",
  { background: string; color: string; borderColor: string }
> = {
  pass: {
    background: "var(--gecko-success-100)",
    color: "var(--gecko-success-800)",
    borderColor: "var(--gecko-success-300)",
  },
  conditional: {
    background: "var(--gecko-warning-100)",
    color: "var(--gecko-warning-800)",
    borderColor: "var(--gecko-warning-300)",
  },
  fail: {
    background: "var(--gecko-error-100)",
    color: "var(--gecko-error-800)",
    borderColor: "var(--gecko-error-300)",
  },
};

const resultLabels = {
  pass: "PASSED",
  conditional: "CONDITIONAL",
  fail: "FAILED",
};

function ChecklistResultIcon({ result }: { result: string }) {
  if (result === "pass")
    return <Check className="h-4 w-4" style={{ color: "var(--gecko-success-600)" }} />;
  if (result === "fail")
    return <X className="h-4 w-4" style={{ color: "var(--gecko-error-600)" }} />;
  return <Minus className="h-4 w-4" style={{ color: "var(--gecko-text-disabled)" }} />;
}

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();

  const getChecklistSummary = (items: typeof mockSurvey.checklist.external) => {
    const passed = items.filter((i) => i.result === "pass").length;
    const total = items.filter((i) => i.result !== "na").length;
    const hasFail = items.some((i) => i.result === "fail");
    return { passed, total, hasFail };
  };

  return (
    <AppShell>
      <PageHeader
        title={`Survey ${mockSurvey.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Survey", href: "/survey" },
          { label: mockSurvey.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tank No:</span>
              <span className="font-mono font-medium">{mockSurvey.tankNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{mockSurvey.tankType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner:</span>
              <span>{mockSurvey.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{mockSurvey.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Cargo:</span>
              <span>{mockSurvey.previousCargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Cargo:</span>
              <span>{mockSurvey.nextCargo}</span>
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
                  border: `2px solid ${resultStyles[mockSurvey.result].borderColor}`,
                  background: resultStyles[mockSurvey.result].background,
                  color: resultStyles[mockSurvey.result].color,
                }}
              >
                {resultLabels[mockSurvey.result]}
              </div>
              {mockSurvey.result === "conditional" && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Gasket replacement required
                </p>
              )}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Survey Type:</span>
                <span>{mockSurvey.surveyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surveyor:</span>
                <span>{mockSurvey.surveyor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{mockSurvey.date}</span>
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
          {Object.entries(mockSurvey.checklist).map(([category, items]) => {
            const summary = getChecklistSummary(items);
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize">{category} Inspection</h4>
                  <Badge variant={summary.hasFail ? "destructive" : "secondary"}>
                    {summary.passed}/{summary.total} {summary.hasFail ? "\u26A0" : "\u2713"}
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
          <CardTitle>Photos ({mockSurvey.photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {mockSurvey.photos.map((photo) => (
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
            {mockSurvey.linkedJobs.map((job) => (
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button>Create Follow-up Job</Button>
        </div>
      </div>
    </AppShell>
  );
}
