"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Plus, FileText } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge, ContractStatusBadge, type CustomerTier, type ContractStatus } from "@/components/tariff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { contracts as seedContracts, type Contract as SeedContract } from "@/data/seed/tariff/contracts";

const ROUTE = "/tariff/contracts";

// Tier heuristic from the customer code (mirrors per-diem tier mapping).
const CODE_TO_TIER: Record<string, CustomerTier> = {
  "C-MSKU": "platinum",
  "C-CMAU": "platinum",
  "C-MSCU": "gold",
  "C-ONEU": "gold",
  "C-HLXU": "gold",
  "C-EVRU": "silver",
  "C-COSU": "silver",
  "C-YMLU": "silver",
  "C-HMMU": "silver",
  "C-ZIMU": "standard",
};

// Map seed status ('active'|'expired'|'draft') → UI ContractStatus
// (includes 'expiring' and 'cancelled' which aren't seeded).
const SEED_STATUS_TO_UI: Record<SeedContract["status"], ContractStatus> = {
  active: "active",
  expired: "expired",
  draft: "draft",
};

interface ContractRow {
  id: string;
  contractNumber: string;
  customer: string;
  tier: CustomerTier;
  period: string;
  status: ContractStatus;
}

function toRow(rec: SeedContract): ContractRow {
  return {
    id: rec.id,
    contractNumber: rec.id,
    customer: rec.name,
    tier: CODE_TO_TIER[rec.customerCode] ?? "standard",
    period: `${rec.effectiveFrom} → ${rec.effectiveTo}`,
    status: SEED_STATUS_TO_UI[rec.status],
  };
}

const contractRows: ContractRow[] = seedContracts.map(toRow);

export default function ContractsPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : contractRows;

  const hasActiveFilters = !!searchQuery || statusFilter !== "all" || expiryFilter !== "all";

  const filtered = records.filter((c) => {
    if (searchQuery && !c.customer.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={5} rows={6} /></AppShell>;
  }
  if (forceError) {
    const errCopy = getErrorCopy(ROUTE);
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
  const showFilterEmpty = forceFilterEmpty || (filtered.length === 0 && hasActiveFilters);
  const showEmpty       = forceEmpty       || (records.length === 0 && !hasActiveFilters);
  if (showFilterEmpty || showEmpty) {
    const variant: EmptyStateVariant = showFilterEmpty ? "filter-empty" : "empty";
    const copy = getEmptyCopy(ROUTE, variant) ?? getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <AppShell>
          <EmptyState
            variant={variant}
            icon={copy.icon}
            title={copy.title}
            description={copy.description}
            primary={copy.primary}
            secondary={copy.secondary}
          />
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Customer service agreements and pricing contracts
          </p>
        </div>
        <Link href="/tariff/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Expiring" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="expiring-30">Within 30 days</SelectItem>
            <SelectItem value="expiring-60">Within 60 days</SelectItem>
            <SelectItem value="expiring-90">Within 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">Export</Button>
      </div>

      {/* Contract Cards */}
      <div className="space-y-4">
        {filtered.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-{filtered.length} of {contractRows.length} contracts</p>
      </div>
    </AppShell>
  );
}

function ContractCard({ contract }: { contract: ContractRow }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  borderRadius: "var(--gecko-radius-lg)",
                  background: "var(--gecko-accent-100)",
                  padding: "var(--gecko-space-2)",
                }}
              >
                <FileText style={{ height: 20, width: 20, color: "var(--gecko-accent-600)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{contract.customer}</span>
                  <TierBadge tier={contract.tier} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{contract.period}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <Link href={`/tariff/contracts/${contract.id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
