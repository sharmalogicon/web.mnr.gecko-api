"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Ruler } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { surchargeRepo } from "@/lib/repos";
import type { Surcharge as SeedSurcharge, SurchargeTrigger } from "@/lib/types";

const ROUTE = "/tariff/surcharges";

interface SurchargeRow {
  id: string;
  name: string;
  description: string;
  appliesTo: string;
  trigger: SurchargeTrigger;
  active: boolean;
}

function toRow(rec: SeedSurcharge): SurchargeRow {
  const amount =
    rec.amountThb !== undefined ? `฿${rec.amountThb.toLocaleString()} flat`
    : rec.percentage !== undefined ? `+${rec.percentage}%`
    : "—";
  return {
    id: rec.id,
    name: rec.name,
    description: `${amount}${rec.notes ? ` — ${rec.notes}` : ""}`,
    appliesTo: rec.notes ?? "All services",
    trigger: rec.trigger,
    active: !rec.effectiveTo || new Date(rec.effectiveTo) >= new Date(),
  };
}

const surchargeRows: SurchargeRow[] = surchargeRepo.list().map(toRow);

const TRIGGER_GROUP: Record<SurchargeTrigger, "time" | "service" | "equipment" | "promo"> = {
  peak_season: "time",
  hazmat: "service",
  after_hours: "time",
  weekend: "time",
  emergency: "service",
};

export default function SurchargesPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : surchargeRows;
  const hasActiveFilters = !!searchQuery || typeFilter !== "all" || categoryFilter !== "all" || statusFilter !== "active";

  const filtered = records.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && TRIGGER_GROUP[s.trigger] !== categoryFilter) return false;
    return true;
  });

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={4} rows={6} /></AppShell>;
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

  const timeBased = filtered.filter((s) => TRIGGER_GROUP[s.trigger] === "time");
  const serviceBased = filtered.filter((s) => TRIGGER_GROUP[s.trigger] === "service");
  const equipmentBased = filtered.filter((s) => TRIGGER_GROUP[s.trigger] === "equipment");

  return (
    <AppShell>
      {/* Page actions row (AppShell header already prints page title) */}
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Link href="/tariff/surcharges/new">
          <Button>
            <Icon name="plus" size={16} className="mr-2" />
            New Surcharge
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="surcharge">Surcharge</SelectItem>
            <SelectItem value="discount">Discount</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="time">Time-Based</SelectItem>
            <SelectItem value="service">Service-Based</SelectItem>
            <SelectItem value="equipment">Equipment-Based</SelectItem>
            <SelectItem value="promo">Promotional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {timeBased.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="clock" size={20} style={{ color: "var(--gecko-primary-600)" }} />
            Time-Based Surcharges
          </h2>
          <div className="space-y-4">
            {timeBased.map((s) => <SurchargeCard key={s.id} surcharge={s} />)}
          </div>
        </div>
      )}

      {serviceBased.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="zap" size={20} style={{ color: "var(--gecko-warning-600)" }} />
            Service-Based Surcharges
          </h2>
          <div className="space-y-4">
            {serviceBased.map((s) => <SurchargeCard key={s.id} surcharge={s} />)}
          </div>
        </div>
      )}

      {equipmentBased.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Ruler className="h-5 w-5" style={{ color: "var(--gecko-accent-600)" }} />
            Equipment-Based Surcharges
          </h2>
          <div className="space-y-4">
            {equipmentBased.map((s) => <SurchargeCard key={s.id} surcharge={s} />)}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SurchargeCard({ surcharge }: { surcharge: SurchargeRow }) {
  const [isActive, setIsActive] = useState(surcharge.active);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className="mb-1"
              style={{
                fontSize: "var(--gecko-text-base)",
                fontWeight: "var(--gecko-font-weight-semibold)",
                color: "var(--gecko-text-primary)",
              }}
            >
              {surcharge.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {surcharge.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isActive ? (
                <Badge variant="success">✓ Active</Badge>
              ) : (
                <Badge variant="secondary">○ Inactive</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
