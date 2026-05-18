"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Printer, X, Check, Clock, Play, Pause } from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const mockJob = {
  id: "CLN-001234",
  tankNumber: "MSKU2234567",
  tankType: "T11 (26,000L)",
  customer: "CMA CGM",
  previousCargo: "Methanol",
  nextCargo: "Palm Oil",
  cleaningType: "Food Grade Clean",
  bay: 2,
  priority: "urgent",
  operator: "Mike Johnson",
  createdAt: "Dec 12, 10:00 AM",
  startedAt: "10:30 AM",
  estimatedCompletion: "4:30 PM",
  progress: 75,
  status: "in_progress" as const,
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

export default function CleaningDetailPage() {
  const params = useParams();
  const router = useRouter();

  const currentStepIndex = 2; // Washing step

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="destructive" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {progressSteps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
                    index <= currentStepIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm",
                    index <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
                {index < progressSteps.length - 1 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-4",
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{mockJob.progress}%</span>
            </div>
            <Progress value={mockJob.progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: {mockJob.startedAt}</span>
              <span>Estimated completion: {mockJob.estimatedCompletion}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tank:</span>
              <span className="font-mono font-medium">{mockJob.tankNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{mockJob.tankType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{mockJob.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Cargo:</span>
              <span>{mockJob.previousCargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Cargo:</span>
              <span>{mockJob.nextCargo}</span>
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{mockJob.cleaningType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bay:</span>
              <span>Bay {mockJob.bay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant={mockJob.priority === "urgent" ? "destructive" : "secondary"}>
                {mockJob.priority}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operator:</span>
              <span>{mockJob.operator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{mockJob.createdAt}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Log */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cleaning Process Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockJob.processLog.map((log, index) => {
              const tone =
                log.status === "completed"
                  ? { bg: "var(--gecko-success-100)", fg: "var(--gecko-success-600)" }
                  : log.status === "in_progress"
                    ? { bg: "var(--gecko-info-100)", fg: "var(--gecko-info-600)" }
                    : { bg: "var(--gecko-gray-100)", fg: "var(--gecko-text-disabled)" };
              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-mono text-muted-foreground">{log.time}</span>
                  <div
                    className="w-6 h-6 flex items-center justify-center"
                    style={{
                      borderRadius: "var(--gecko-radius-full)",
                      background: tone.bg,
                      color: tone.fg,
                    }}
                  >
                    {log.status === "completed" && <Check className="h-4 w-4" />}
                    {log.status === "in_progress" && <Play className="h-3 w-3" />}
                    {log.status === "pending" && <Clock className="h-3 w-3" />}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      log.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {log.step}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chemical Usage */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Chemical Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Chemical</th>
                  <th className="text-left py-2 font-medium">Quantity</th>
                  <th className="text-left py-2 font-medium">Batch #</th>
                  <th className="text-right py-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {mockJob.chemicals.map((chem, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">{chem.name}</td>
                    <td className="py-2">{chem.quantity}</td>
                    <td className="py-2 font-mono text-xs">{chem.batch}</td>
                    <td className="py-2 text-right">${chem.cost}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="py-2 font-medium">Total Chemical Cost:</td>
                  <td className="py-2 text-right font-medium">
                    ${mockJob.chemicals.reduce((sum, c) => sum + c.cost, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push("/cleaning")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Pause className="mr-2 h-4 w-4" />
            Pause Job
          </Button>
          <Button>Complete & Certify</Button>
        </div>
      </div>
    </AppShell>
  );
}
