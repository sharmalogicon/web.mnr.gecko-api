"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { modifications } from "@/data/seed/modification";

// Visual chrome the seed doesn't model (comments, attachments, timeline)
const mockChrome = {
  priority: "high",
  requestedBy: "John Smith",
  justification: "Customer requires this modification to support new cargo profile. Modification will allow the container to service a wider range of cargo types and increase utilization.",
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
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = modifications.find((r) => r.reference === id);

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
    const allRefs = modifications.map((r) => r.reference);
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

  const badgeStatus = statusMap[record.status] ?? "pending";

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Icon name="edit" size={16} className="mr-2" />
          Edit
        </Button>
        {(record.status === "proposed" || record.status === "class_review") && (
          <>
            <Button variant="destructive">
              <Icon name="x" size={16} className="mr-2" />
              Reject
            </Button>
            <Button>
              <Icon name="check" size={16} className="mr-2" />
              Approve
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{record.reference}</CardTitle>
                <StatusBadge status={badgeStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment:</span>
                    <span className="font-mono font-medium">{record.equipmentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{record.customerCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opened:</span>
                    <span>{record.openedDate}</span>
                  </div>
                  {record.completedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{record.completedDate}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modification Type:</span>
                    <span>{record.type}</span>
                  </div>
                  {record.classSociety && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class Society:</span>
                      <Badge variant="outline">{record.classSociety}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant={mockChrome.priority === "high" ? "destructive" : "secondary"}>
                      {mockChrome.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="font-medium">฿{record.costThb.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{record.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Business Justification</h4>
                <p className="text-sm text-muted-foreground">{mockChrome.justification}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments &amp; Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockChrome.comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {comment.user.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user}</span>
                      <span className="text-sm text-muted-foreground">({comment.role})</span>
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <Textarea placeholder="Add a comment..." rows={3} />
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimator:</span>
                <span className="font-mono">{record.estimatorId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested By:</span>
                <span>{mockChrome.requestedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened Date:</span>
                <span>{record.openedDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockChrome.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="fileText" size={16} className="text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockChrome.timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {index < mockChrome.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border flex-1 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-medium">{item.event}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon name="clock" size={12} />
                        <span>{item.date}</span>
                        <span>by {item.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/modification")}>
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Modifications
        </Button>
      </div>
    </AppShell>
  );
}
