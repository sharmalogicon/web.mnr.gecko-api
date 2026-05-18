"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge, type CustomerTier } from "@/components/tariff";
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
import { customerRates as seedCustomerRates, type CustomerRate as SeedCustomerRate } from "@/data/seed/tariff/customer-rates";

const ROUTE = "/tariff/customer-rates";

// Heuristic tier mapping per customer code (mirrors the seed storage per-diem
// tiers). Platinum: Maersk + CMA CGM; Gold: MSC, ONE, Hapag-Lloyd;
// Silver: Evergreen, COSCO, Yang Ming, HMM; Standard: ZIM.
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

interface CustomerRateRow {
  id: string;
  customerCode: string;
  customerLabel: string;
  tier: CustomerTier;
  serviceCode: string;
  override: string;
  effectiveFrom: string;
  notes?: string;
}

function toRow(rec: SeedCustomerRate): CustomerRateRow {
  return {
    id: rec.id,
    customerCode: rec.customerCode,
    customerLabel: rec.customerCode.replace(/^C-/, ""),
    tier: CODE_TO_TIER[rec.customerCode] ?? "standard",
    serviceCode: rec.serviceCode,
    override: `฿${rec.overrideRateThb.toLocaleString()}`,
    effectiveFrom: rec.effectiveFrom,
    notes: rec.notes,
  };
}

const customerRateRows: CustomerRateRow[] = seedCustomerRates.map(toRow);

export default function CustomerRatesPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : customerRateRows;

  const hasActiveFilters = !!searchQuery || tierFilter !== "all" || statusFilter !== "active";

  const filtered = records.filter((r) => {
    if (searchQuery && !r.customerLabel.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (tierFilter !== "all" && r.tier !== tierFilter) return false;
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
          <h1 className="text-2xl font-bold text-foreground">Customer Rates</h1>
          <p className="text-muted-foreground mt-1">
            Customer-specific pricing and discounts
          </p>
        </div>
        <Link href="/tariff/customer-rates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Customer Rate
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Rate Cards */}
      <div className="space-y-4">
        {filtered.map((row) => (
          <CustomerRateCard key={row.id} row={row} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-{filtered.length} of {customerRateRows.length} overrides</p>
      </div>
    </AppShell>
  );
}

function CustomerRateCard({ row }: { row: CustomerRateRow }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div
              style={{
                borderRadius: "var(--gecko-radius-lg)",
                background: "var(--gecko-primary-100)",
                padding: "var(--gecko-space-2)",
              }}
            >
              <Building2 style={{ height: 20, width: 20, color: "var(--gecko-primary-600)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{row.customerLabel}</h3>
              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={row.tier} />
                <span className="text-sm font-medium">Override: {row.override}</span>
                <span className="text-xs text-muted-foreground">From {row.effectiveFrom}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/tariff/customer-rates/${row.customerCode.toLowerCase()}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href={`/tariff/customer-rates/${row.customerCode.toLowerCase()}/edit`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{
            border: "1px solid var(--gecko-border)",
            background: "var(--gecko-bg-subtle)",
          }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Service: <span className="font-mono">{row.serviceCode}</span>
          </p>
          {row.notes && <p className="text-sm">{row.notes}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
