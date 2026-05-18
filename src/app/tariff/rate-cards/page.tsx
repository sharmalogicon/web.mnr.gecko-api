"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Droplets,
  MapPin,
  Clock,
  Plus,
  Receipt,
  FlaskConical,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { RateCard } from "@/components/tariff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { rateCardRepo } from "@/lib/repos";
import type { RateCardServiceCode } from "@/lib/types";

const ROUTE = "/tariff/rate-cards";

const SERVICE_LABEL: Record<RateCardServiceCode, string> = {
  survey: "Survey",
  washout: "Washout",
  repair_hourly: "Repair (hourly)",
  pti: "PTI Test",
  storage_per_diem: "Storage",
  pressure_test: "Pressure Test",
};

const SERVICE_ICON: Record<RateCardServiceCode, typeof Search> = {
  survey: Search,
  washout: Droplets,
  repair_hourly: Wrench,
  pti: FlaskConical,
  storage_per_diem: MapPin,
  pressure_test: Receipt,
};

const SURVEY_ICON_TOKEN = "var(--gecko-primary-600)";
const SURVEY_ICON_BG_TOKEN = "var(--gecko-primary-100)";
const CLEANING_ICON_TOKEN = "var(--gecko-info-600)";
const CLEANING_ICON_BG_TOKEN = "var(--gecko-info-100)";
const STORAGE_ICON_TOKEN = "var(--gecko-success-600)";
const STORAGE_ICON_BG_TOKEN = "var(--gecko-success-100)";
const LABOR_ICON_TOKEN = "var(--gecko-accent-600)";
const LABOR_ICON_BG_TOKEN = "var(--gecko-accent-100)";

export default function RateCardsPage() {
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : rateCardRepo.list();

  const hasActiveFilters =
    !!searchQuery || categoryFilter !== "all" || equipmentFilter !== "all" || statusFilter !== "active";

  // Filter the rate cards (apply only when filter is active so the empty
  // branches behave predictably under filter-empty).
  const filteredCards = records.filter((card) => {
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && !card.lines.some((l) => l.category.toLowerCase() === categoryFilter)) return false;
    if (equipmentFilter !== "all" && !card.lines.some((l) => l.category.toLowerCase() === equipmentFilter)) return false;
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
  const showFilterEmpty = forceFilterEmpty || (filteredCards.length === 0 && hasActiveFilters);
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
        <Link href="/tariff/rate-cards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Rate Card
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="dry">Dry</SelectItem>
            <SelectItem value="tank">Tank</SelectItem>
            <SelectItem value="reefer">Reefer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="tank">ISO Tank</SelectItem>
            <SelectItem value="dry">Dry Container</SelectItem>
            <SelectItem value="reefer">Reefer</SelectItem>
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

      {/* One section per rate card; each card lists its lines as RateCard tiles */}
      {filteredCards.map((card) => (
        <div key={card.id} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" style={{ color: STORAGE_ICON_TOKEN }} />
            {card.name}
            <span className="text-sm text-muted-foreground ml-2">
              {card.currency} · {card.effectiveFrom}{card.effectiveTo ? ` → ${card.effectiveTo}` : ""}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {card.lines.map((line, idx) => {
              const Icon = SERVICE_ICON[line.service];
              const unitLabel =
                line.unit === "per_day" ? "per day" :
                line.unit === "per_hour" ? "per hour" : "per unit";
              const isCleaning = line.service === "washout";
              const isStorage = line.service === "storage_per_diem";
              const isLabor = line.service === "repair_hourly";
              const iconToken = isCleaning ? CLEANING_ICON_TOKEN
                : isStorage ? STORAGE_ICON_TOKEN
                : isLabor ? LABOR_ICON_TOKEN
                : SURVEY_ICON_TOKEN;
              const iconBgToken = isCleaning ? CLEANING_ICON_BG_TOKEN
                : isStorage ? STORAGE_ICON_BG_TOKEN
                : isLabor ? LABOR_ICON_BG_TOKEN
                : SURVEY_ICON_BG_TOKEN;
              return (
                <RateCard
                  key={`${card.id}-${idx}`}
                  icon={Icon}
                  title={SERVICE_LABEL[line.service]}
                  subtitle={line.category}
                  rate={`${card.currency === "THB" ? "฿" : card.currency} ${line.unitRateThb}`}
                  unit={unitLabel}
                  status="active"
                  iconToken={iconToken}
                  iconBgToken={iconBgToken}
                />
              );
            })}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
