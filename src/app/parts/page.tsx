"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { DataTable, StatsCard, StatsGrid, StockBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { partRepo } from "@/lib/repos";
import type { Part as SeedPart } from "@/lib/types";

const ROUTE = "/parts";

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minimum: number;
  price: number;
  location: string;
}

const CATEGORY_LABEL: Record<SeedPart["category"], string> = {
  panel: "Panels",
  door: "Doors",
  floor: "Floor",
  gasket: "Seals",
  reefer_unit: "Reefer",
  tank_valve: "Valves",
  fastener: "Fasteners",
};

function toUiPart(rec: SeedPart): Part {
  // Minimum-on-hand heuristic: parts use 25% of stock or 3 as the reorder point.
  const minimum = Math.max(3, Math.floor(rec.stockOnHand * 0.25));
  return {
    id: rec.sku,
    sku: rec.sku,
    name: rec.name,
    category: CATEGORY_LABEL[rec.category],
    stock: rec.stockOnHand,
    minimum,
    price: rec.unitCostThb,
    location: rec.cedexCode ?? "—",
  };
}

const partRows: Part[] = partRepo.list().map(toUiPart);

const columns: Column<Part>[] = [
  { key: "sku", label: "SKU", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "name", label: "Name", sortable: true },
  { key: "category", label: "Category", sortable: true, render: (val) => <Badge variant="outline">{String(val)}</Badge> },
  { key: "stock", label: "Stock", sortable: true, align: "center", render: (val, row) => <StockBadge quantity={row.stock} minimum={row.minimum} /> },
  { key: "minimum", label: "Min", sortable: true, align: "center" },
  { key: "price", label: "Price", sortable: true, align: "right", render: (val) => `฿${Number(val).toFixed(2)}` },
  { key: "location", label: "Location", sortable: true },
];

function PartsPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : partRows;

  const stats = {
    total: records.length,
    inStock: records.filter((p) => p.stock > p.minimum).length,
    lowStock: records.filter((p) => p.stock > 0 && p.stock <= p.minimum).length,
    outOfStock: records.filter((p) => p.stock === 0).length,
  };

  const lowStockParts = records.filter((p) => p.stock <= p.minimum);

  const filteredParts = records.filter((part) => {
    const matchesSearch =
      !searchQuery ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const actions: RowAction<Part>[] = [
    { label: "View Details", icon: <Icon name="eye" size={16} />, onClick: (row) => router.push(`/parts/${row.id}`) },
    { label: "Edit", icon: <Icon name="edit" size={16} />, onClick: () => {} },
    { label: "Order More", icon: <ShoppingCart className="h-4 w-4" />, onClick: () => {}, separator: true },
    { label: "Delete", icon: <Icon name="trash" size={16} />, onClick: () => {}, variant: "destructive", separator: true },
  ];

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={7} rows={8} /></AppShell>;
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
  const hasActiveFilters = !!searchQuery || categoryFilter !== "all";
  const showFilterEmpty = forceFilterEmpty || (filteredParts.length === 0 && hasActiveFilters);
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
      <ListPageShell
        title="Parts Inventory"
        count={filteredParts.length}
        countSuffix="SKUs"
        subtitle="Repair parts stock with reorder-point alerting."
        secondaryActions={
          <Link
            href="/parts/orders"
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders
          </Link>
        }
        primaryAction={
          <Link
            href="/parts/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            Add Part
          </Link>
        }
      >
      <StatsGrid>
        <StatsCard label="Total SKUs" value={stats.total} icon={Package} color="default" />
        <StatsCard label="In Stock" value={stats.inStock} color="green" />
        <StatsCard label="Low Stock" value={stats.lowStock} color="amber" />
        <StatsCard label="Out of Stock" value={stats.outOfStock} color="red" />
      </StatsGrid>

      {/* Low Stock Alerts */}
      {lowStockParts.length > 0 && (
        <div className="gecko-alert gecko-alert-warning mt-6 gecko-emergency-banner">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 gecko-text-warning" />
            <h3 className="gecko-alert-banner-title-warning">
              Low Stock Alerts ({lowStockParts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {lowStockParts.slice(0, 3).map((part) => (
              <div key={part.id} className="flex items-center justify-between text-sm">
                <span className="gecko-text-warning">
                  {part.name} - <span className="gecko-fw-medium">{part.stock} remaining</span> (min: {part.minimum})
                </span>
                <Button variant="outline" size="sm" className="h-7">Order Now</Button>
              </div>
            ))}
            {lowStockParts.length > 3 && (
              <Button
                variant="link"
                className="p-0 h-auto gecko-text-warning"
              >
                View All {lowStockParts.length} Alerts →
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Valves">Valves</SelectItem>
              <SelectItem value="Seals">Seals & Gaskets</SelectItem>
              <SelectItem value="Panels">Panels</SelectItem>
              <SelectItem value="Doors">Doors</SelectItem>
              <SelectItem value="Floor">Floor</SelectItem>
              <SelectItem value="Reefer">Reefer</SelectItem>
              <SelectItem value="Fasteners">Fasteners</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredParts}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/parts/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredParts.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={null}>
      <PartsPageInner />
    </Suspense>
  );
}
