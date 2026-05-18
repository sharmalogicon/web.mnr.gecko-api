"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { historyRepo } from "@/lib/repos";
import type { TariffHistoryEntry } from "@/lib/types";

const ROUTE = "/tariff/history";

interface PriceChangeRow {
  id: string;
  dateTime: string;
  change: string;
  details: string;
  changedBy: string;
}

const TYPE_LABEL: Record<TariffHistoryEntry["type"], string> = {
  rate_card_published: "Rate card published",
  contract_signed: "Contract signed",
  surcharge_added: "Surcharge added",
  rate_card_revised: "Rate card revised",
};

function toRow(rec: TariffHistoryEntry): PriceChangeRow {
  return {
    id: rec.id,
    dateTime: rec.changedAt,
    change: TYPE_LABEL[rec.type],
    details: rec.entityId,
    changedBy: rec.changedBy,
  };
}

const historyRows: PriceChangeRow[] = historyRepo.list().map(toRow);

export default function PriceHistoryPage() {
  const sp = useSearchParams();
  const [dateRange, setDateRange] = useState("30");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : historyRows;
  const hasActiveFilters = typeFilter !== "all" || userFilter !== "all";

  const filtered = records.filter((r) => {
    if (typeFilter !== "all" && !r.change.toLowerCase().includes(typeFilter)) return false;
    if (userFilter !== "all" && !r.changedBy.toLowerCase().includes(userFilter.toLowerCase())) return false;
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
      {/* Page actions row (AppShell header already prints page title) */}
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <Icon name="download" size={16} className="mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rate card">Rate Card</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="surcharge">Surcharge</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Changed By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="apirak">Apirak Chaiwan</SelectItem>
            <SelectItem value="prasong">Prasong Suthikorn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Changes Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Changed By</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="font-medium">{change.dateTime}</TableCell>
                <TableCell>{change.change}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {change.details}
                  </Badge>
                </TableCell>
                <TableCell>{change.changedBy}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-{filtered.length} of {historyRows.length} changes</p>
      </div>
    </AppShell>
  );
}
