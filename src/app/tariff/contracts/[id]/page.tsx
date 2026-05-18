"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
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
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { contracts } from "@/data/seed/tariff/contracts";
import { customers } from "@/data/seed/_shared/customers";

// Visual chrome the seed doesn't model (contact info, financial KPIs, documents,
// timeline events). Kept as decoration around seed-driven fields.
const mockChrome = {
  contact: { name: "John Smith", email: "john@cmacgm.com", phone: "+66 812 345 678" },
  documents: [
    { name: "Contract-Signed.pdf", type: "Signed contract" },
    { name: "Contract-Amendment-01.pdf", type: "Price amendment" },
    { name: "Customer-Credit-Application.pdf", type: "Credit docs" },
  ],
  financials: { totalBilled: 124500, totalSavings: 28400, volumeAchievement: 98.2 },
};

const ROUTE = "/tariff/contracts/[id]";
const LIST_ROUTE = "/tariff/contracts";

export default function ContractDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = contracts.find((c) => c.id === id);

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
    const allRefs = contracts.map((c) => c.id);
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
                    href={`/tariff/contracts/${encodeURIComponent(suggestion)}`}
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

  const customer = customers.find((c) => c.code === record.customerCode);
  const statusVariant =
    record.status === "active" ? "success" : record.status === "draft" ? "secondary" : "destructive";
  const statusLabel = record.status.charAt(0).toUpperCase() + record.status.slice(1);

  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/contracts">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
      </Link>

      {/* Page actions row (AppShell header already prints {record.id} as page title) */}
      <div className="mnr-page-actions">
        <span className="text-sm text-muted-foreground">{record.name}</span>
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">Edit</Button>
        <Button variant="outline">Renew</Button>
        <Button variant="ghost">Print</Button>
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
              Status: <Badge variant={statusVariant}>{statusLabel}</Badge>
            </h3>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div
              className="absolute top-5 left-0 right-0 h-0.5"
              style={{ background: "var(--gecko-border-strong)" }}
            />
            <div className="relative flex justify-between">
              <TimelineStep label="Signed" date={record.effectiveFrom} status="completed" />
              <TimelineStep label="Active" date="Now" status={record.status === "active" ? "completed" : "pending"} />
              <TimelineStep label="Expiring" date={record.effectiveTo} status="current" />
              <TimelineStep label="Renewal" date="TBD" status="pending" />
            </div>
          </div>

          {record.status === "active" && (
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
                      Contract expires {record.effectiveTo}. Consider initiating renewal.
                    </p>
                  </div>
                </div>
                <Button variant="warning" size="sm">
                  Renew Now
                </Button>
              </div>
            </div>
          )}
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
              <span className="ml-2 text-sm font-medium font-mono">{record.id}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="ml-2 text-sm">{record.name}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Start Date:</span>
              <span className="ml-2 text-sm">{record.effectiveFrom}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">End Date:</span>
              <span className="ml-2 text-sm">{record.effectiveTo}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Line items:</span>
              <span className="ml-2 text-sm">{record.lines.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">{customer?.name ?? record.customerCode}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tier:</span>
              {customer && <TierBadge tier={customer.tier} />}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Code:</span>
              <span className="ml-2 text-sm font-mono">{record.customerCode}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Contact:</span>
              <span className="ml-2 text-sm">{mockChrome.contact.name}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="ml-2 text-sm">{mockChrome.contact.email}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Phone:</span>
              <span className="ml-2 text-sm">{mockChrome.contact.phone}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Terms */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pricing Terms ({record.lines.length} line items)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Service Rate Overrides</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Code</TableHead>
                  <TableHead>Override Rate (THB)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{line.serviceCode}</TableCell>
                    <TableCell>฿{line.overrideRateThb.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{line.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <p className="text-2xl font-bold">${mockChrome.financials.totalBilled.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">${mockChrome.financials.totalSavings.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{mockChrome.financials.volumeAchievement}%</p>
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
            {mockChrome.documents.map((doc, idx) => (
              <DocumentItem key={idx} name={doc.name} type={doc.type} />
            ))}
          </div>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
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
