"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, ShoppingCart, Trash2, Package, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, DataTable, StatsCard, StatsGrid, StockBadge, Column, RowAction } from "@/components/shared";
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

const mockParts: Part[] = [
  { id: "1", sku: "VLV-001", name: 'Ball Valve 3" DN80', category: "Valves", stock: 2, minimum: 5, price: 150, location: "A-3" },
  { id: "2", sku: "VLV-002", name: 'Ball Valve 4" DN100', category: "Valves", stock: 12, minimum: 5, price: 220, location: "A-3" },
  { id: "3", sku: "GSK-001", name: "Gasket Set T11", category: "Seals", stock: 3, minimum: 10, price: 85, location: "B-1" },
  { id: "4", sku: "GSK-002", name: "Gasket Set T14", category: "Seals", stock: 15, minimum: 10, price: 95, location: "B-1" },
  { id: "5", sku: "PRV-001", name: "Relief Valve 4 bar", category: "Valves", stock: 0, minimum: 3, price: 280, location: "A-4" },
  { id: "6", sku: "HTR-001", name: "Heating Coil 2kW", category: "Heating", stock: 4, minimum: 2, price: 450, location: "C-2" },
  { id: "7", sku: "SEN-001", name: "Temp Sensor PT100", category: "Sensors", stock: 8, minimum: 5, price: 120, location: "D-1" },
  { id: "8", sku: "FRM-001", name: "Corner Post Assembly", category: "Frame", stock: 6, minimum: 4, price: 380, location: "E-1" },
];

const columns: Column<Part>[] = [
  { key: "sku", label: "SKU", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "name", label: "Name", sortable: true },
  { key: "category", label: "Category", sortable: true, render: (val) => <Badge variant="outline">{String(val)}</Badge> },
  { key: "stock", label: "Stock", sortable: true, align: "center", render: (val, row) => <StockBadge quantity={row.stock} minimum={row.minimum} /> },
  { key: "minimum", label: "Min", sortable: true, align: "center" },
  { key: "price", label: "Price", sortable: true, align: "right", render: (val) => `$${Number(val).toFixed(2)}` },
  { key: "location", label: "Location", sortable: true },
];

export default function PartsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const stats = {
    total: mockParts.length,
    inStock: mockParts.filter((p) => p.stock > p.minimum).length,
    lowStock: mockParts.filter((p) => p.stock > 0 && p.stock <= p.minimum).length,
    outOfStock: mockParts.filter((p) => p.stock === 0).length,
  };

  const lowStockParts = mockParts.filter((p) => p.stock <= p.minimum);

  const filteredParts = mockParts.filter((part) => {
    const matchesSearch =
      !searchQuery ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const actions: RowAction<Part>[] = [
    { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: (row) => router.push(`/parts/${row.id}`) },
    { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => {} },
    { label: "Order More", icon: <ShoppingCart className="h-4 w-4" />, onClick: () => {}, separator: true },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => {}, variant: "destructive", separator: true },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Spare Parts Inventory"
        description="Manage parts and track stock levels"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Parts" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/parts/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase Orders
              </Link>
            </Button>
            <Button asChild>
              <Link href="/parts/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Part
              </Link>
            </Button>
          </div>
        }
      />

      <StatsGrid>
        <StatsCard label="Total SKUs" value={stats.total} icon={Package} color="default" />
        <StatsCard label="In Stock" value={stats.inStock} color="green" />
        <StatsCard label="Low Stock" value={stats.lowStock} color="amber" />
        <StatsCard label="Out of Stock" value={stats.outOfStock} color="red" />
      </StatsGrid>

      {/* Low Stock Alerts */}
      {lowStockParts.length > 0 && (
        <div
          className="gecko-alert gecko-alert-warning mt-6"
          style={{ display: "block" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: "var(--gecko-warning-600)" }}
            />
            <h3
              style={{
                fontWeight: "var(--gecko-font-weight-semibold)",
                color: "var(--gecko-warning-800)",
              }}
            >
              Low Stock Alerts ({lowStockParts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {lowStockParts.slice(0, 3).map((part) => (
              <div key={part.id} className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--gecko-warning-800)" }}>
                  {part.name} - <span className="font-medium">{part.stock} remaining</span> (min: {part.minimum})
                </span>
                <Button variant="outline" size="sm" className="h-7">Order Now</Button>
              </div>
            ))}
            {lowStockParts.length > 3 && (
              <Button
                variant="link"
                className="p-0 h-auto"
                style={{ color: "var(--gecko-warning-700)" }}
              >
                View All {lowStockParts.length} Alerts →
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <SelectItem value="Heating">Heating</SelectItem>
              <SelectItem value="Sensors">Sensors</SelectItem>
              <SelectItem value="Frame">Frame Parts</SelectItem>
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
    </AppShell>
  );
}
