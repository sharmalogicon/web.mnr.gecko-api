"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingUp,
  Target,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge } from "@/components/tariff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/contracts">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contract CTR-2024-001</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Renew</Button>
          <Button variant="ghost">Print</Button>
        </div>
      </div>

      {/* Status Timeline */}
      <Card
        className="mb-6"
        style={{
          background: "var(--gecko-warning-50)",
          borderColor: "var(--gecko-warning-200)",
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              Status: <Badge variant="success">Active</Badge>
            </h3>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div
              className="absolute top-5 left-0 right-0 h-0.5"
              style={{ background: "var(--gecko-border-strong)" }}
            />
            <div className="relative flex justify-between">
              <TimelineStep
                label="Signed"
                date="Jan 1"
                status="completed"
              />
              <TimelineStep
                label="Active"
                date="Now"
                status="completed"
              />
              <TimelineStep
                label="Expiring"
                date="Dec 12"
                status="current"
              />
              <TimelineStep
                label="Renewal"
                date="Dec 31"
                status="pending"
              />
            </div>
          </div>

          <div
            className="gecko-alert gecko-alert-warning mt-6"
            style={{ display: "block" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="h-5 w-5 mt-0.5"
                  style={{ color: "var(--gecko-warning-700)" }}
                />
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--gecko-warning-900)" }}
                  >
                    This contract expires in 19 days. Consider initiating renewal.
                  </p>
                </div>
              </div>
              <Button variant="warning" size="sm">
                Renew Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Contract #:</span>
              <span className="ml-2 text-sm font-medium">CTR-2024-001</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="ml-2 text-sm">Annual Service Agreement</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Start Date:</span>
              <span className="ml-2 text-sm">Jan 1, 2024</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">End Date:</span>
              <span className="ml-2 text-sm">Dec 31, 2024</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="ml-2 text-sm">12 months</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Auto-Renew:</span>
              <span className="ml-2 text-sm">Yes</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Notice Period:</span>
              <span className="ml-2 text-sm">30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">CMA CGM (Thailand) Co., Ltd.</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tier:</span>
              <TierBadge tier="platinum" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Contact:</span>
              <span className="ml-2 text-sm">John Smith</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="ml-2 text-sm">john@cmacgm.com</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Phone:</span>
              <span className="ml-2 text-sm">+66 812 345 678</span>
            </div>
            <Link
              href="/customers/cma-cgm"
              className="text-sm text-primary hover:underline inline-block"
            >
              View Customer Profile →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Terms */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pricing Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Discount */}
          <div>
            <h4 className="font-medium mb-2">Base Discount</h4>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">20% off all standard rates (Platinum tier)</p>
            </div>
          </div>

          {/* Special Rates */}
          <div>
            <h4 className="font-medium mb-2">Special Rates</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Food Grade Cleaning</TableCell>
                  <TableCell>$850</TableCell>
                  <TableCell>$650</TableCell>
                  <TableCell>-24%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Food Grade Storage</TableCell>
                  <TableCell>$35/day</TableCell>
                  <TableCell>$25/day</TableCell>
                  <TableCell>-29%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Specialist Labor</TableCell>
                  <TableCell>$100/hr</TableCell>
                  <TableCell>$85/hr</TableCell>
                  <TableCell>-15%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Volume Commitments */}
          <div>
            <h4 className="font-medium mb-2">Volume Commitments</h4>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm">Minimum Volume: 100 units/month</p>
              <p className="text-sm">
                Volume Bonus: +2% discount if exceeding 150 units/month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--gecko-primary-50)",
                border: "1px solid var(--gecko-primary-200)",
              }}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: "var(--gecko-primary-600)" }}
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Total Billed</span>
              </div>
              <p className="text-2xl font-bold">$124,500</p>
              <p className="text-xs text-muted-foreground mt-1">YTD</p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--gecko-success-50)",
                border: "1px solid var(--gecko-success-200)",
              }}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: "var(--gecko-success-600)" }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Total Savings</span>
              </div>
              <p className="text-2xl font-bold">$28,400</p>
              <p className="text-xs text-muted-foreground mt-1">YTD</p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--gecko-accent-50)",
                border: "1px solid var(--gecko-accent-200)",
              }}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: "var(--gecko-accent-600)" }}
              >
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Volume Target</span>
              </div>
              <p className="text-2xl font-bold">98.2%</p>
              <p className="text-xs text-muted-foreground mt-1">Achievement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <DocumentItem
              name="CTR-2024-001-Signed.pdf"
              type="Signed contract"
            />
            <DocumentItem
              name="CTR-2024-001-Amendment-01.pdf"
              type="Price amendment"
            />
            <DocumentItem
              name="CMA-CGM-Credit-Application.pdf"
              type="Credit docs"
            />
          </div>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ActivityItem
              description="Food Grade Storage rate amended: $28 → $25/day"
              date="Dec 10, 2024"
            />
            <ActivityItem
              description="Amendment 01 signed"
              date="Dec 10, 2024"
            />
            <ActivityItem description="Contract activated" date="Jan 1, 2024" />
            <ActivityItem
              description="Contract signed by customer"
              date="Dec 28, 2023"
            />
            <ActivityItem description="Contract created" date="Dec 15, 2023" />
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

interface TimelineStepProps {
  label: string;
  date: string;
  status: "completed" | "current" | "pending";
}

function TimelineStep({ label, date, status }: TimelineStepProps) {
  const dotStyle: React.CSSProperties =
    status === "completed"
      ? {
          borderColor: "var(--gecko-success-600)",
          background: "var(--gecko-success-600)",
        }
      : status === "current"
        ? {
            borderColor: "var(--gecko-warning-600)",
            background: "var(--gecko-warning-100)",
          }
        : {
            borderColor: "var(--gecko-border-strong)",
            background: "var(--gecko-bg-base)",
          };
  return (
    <div className="flex flex-col items-center relative">
      <div
        className="w-3 h-3 rounded-full mb-2 relative z-10"
        style={{ borderWidth: 2, borderStyle: "solid", ...dotStyle }}
      />
      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

interface DocumentItemProps {
  name: string;
  type: string;
}

function DocumentItem({ name, type }: DocumentItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{type}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm">
        View
      </Button>
    </div>
  );
}

interface ActivityItemProps {
  description: string;
  date: string;
}

function ActivityItem({ description, date }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
      <div className="flex-1 flex items-center justify-between">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}
