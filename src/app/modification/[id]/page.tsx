"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Check, X, MessageSquare, FileText, Clock } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockModification = {
  id: "MOD-000456",
  equipment: "MSKU2234567",
  equipmentType: "ISO Tank (T11)",
  customer: "CMA CGM",
  type: "Heating System Upgrade",
  status: "pending" as const,
  priority: "high",
  estimatedCost: 4500,
  requestDate: "Dec 10, 2024",
  requestedBy: "John Smith",
  description: "Install new heating coil system to enable transport of temperature-sensitive cargo. Current tank has basic insulation but no heating capability.",
  justification: "Customer requires heated transport for palm oil shipments during winter months. This modification will allow the tank to service a wider range of cargo types and increase utilization.",
  attachments: [
    { name: "heating_specs.pdf", size: "2.4 MB" },
    { name: "cost_estimate.xlsx", size: "156 KB" },
  ],
  comments: [
    {
      user: "Mike Johnson",
      role: "Technical Lead",
      date: "Dec 11, 2024 2:30 PM",
      text: "Reviewed the heating specs. Standard 2kW coil should be sufficient for T11 tank. Recommend using HTR-001 from inventory.",
    },
    {
      user: "Sarah Lee",
      role: "Operations Manager",
      date: "Dec 11, 2024 4:15 PM",
      text: "Please confirm lead time for installation. Customer needs this operational by Jan 15.",
    },
  ],
  timeline: [
    { date: "Dec 10, 2024", event: "Request submitted", user: "John Smith" },
    { date: "Dec 10, 2024", event: "Assigned for technical review", user: "System" },
    { date: "Dec 11, 2024", event: "Technical review completed", user: "Mike Johnson" },
  ],
};

export default function ModificationDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <AppShell>
      <PageHeader
        title={`Modification ${mockModification.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Modification", href: "/modification" },
          { label: mockModification.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {mockModification.status === "pending" && (
              <>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Details</CardTitle>
                <StatusBadge status={mockModification.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment:</span>
                    <span className="font-mono font-medium">{mockModification.equipment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{mockModification.equipmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{mockModification.customer}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modification Type:</span>
                    <span>{mockModification.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant={mockModification.priority === "high" ? "destructive" : "secondary"}>
                      {mockModification.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="font-medium">${mockModification.estimatedCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{mockModification.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Business Justification</h4>
                <p className="text-sm text-muted-foreground">{mockModification.justification}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockModification.comments.map((comment, index) => (
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
                <span className="text-muted-foreground">Requested By:</span>
                <span>{mockModification.requestedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request Date:</span>
                <span>{mockModification.requestDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockModification.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
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
                {mockModification.timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {index < mockModification.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border flex-1 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-medium">{item.event}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modifications
        </Button>
      </div>
    </AppShell>
  );
}
