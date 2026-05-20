"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, DollarSign, CreditCard, Receipt, Clock } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
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
import { invoiceRepo } from "@/lib/repos";
import type { Invoice as SeedInvoice } from "@/lib/types";

const ROUTE = "/billing";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  equipment: string;
  services: string;
  amount: number;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  issueDate: string;
}

const SEED_STATUS_TO_UI: Record<SeedInvoice["status"], Invoice["status"]> = {
  Draft: "draft",
  Final: "pending",
  Overdue: "overdue",
  Paid: "paid",
  Void: "cancelled",
};

function parseThbAmount(s: string): number {
  // '฿12,450.00' → 12450
  return Number(s.replace(/[฿,\s]/g, ""));
}

function toUiInvoice(rec: SeedInvoice): Invoice {
  return {
    id: rec.id,
    number: rec.id,
    customer: rec.custName,
    equipment: "—",                 // not denormalised in seed
    services: "—",                  // not denormalised in seed
    amount: parseThbAmount(rec.amount),
    status: SEED_STATUS_TO_UI[rec.status],
    dueDate: rec.dueDate,
    issueDate: rec.date,
  };
}

const invoiceRows: Invoice[] = invoiceRepo.list().map(toUiInvoice);

const columns: Column<Invoice>[] = [
  { key: "number", label: "Invoice #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "services", label: "Services", sortable: true },
  { key: "amount", label: "Amount", sortable: true, align: "right", render: (val) => <span className="font-medium">฿{Number(val).toLocaleString()}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Invoice["status"]} /> },
  { key: "dueDate", label: "Due Date", sortable: true },
];

function BillingPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : invoiceRows;

  const stats = {
    totalRevenue: records.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pending: records.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amount, 0),
    overdue: records.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
    invoiceCount: records.length,
  };

  const filteredInvoices = records.filter((invoice) => {
    const matchesSearch =
      !searchQuery ||
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.equipment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Invoice>[] = [
    { label: "View Invoice", icon: <Icon name="eye" size={16} />, onClick: (row) => router.push(`/billing/${row.id}`) },
    { label: "Edit", icon: <Icon name="edit" size={16} />, onClick: () => {} },
    { label: "Download PDF", icon: <Icon name="download" size={16} />, onClick: () => {} },
    { label: "Record Payment", icon: <CreditCard className="h-4 w-4" />, onClick: () => {}, separator: true },
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
  const hasActiveFilters = !!searchQuery || statusFilter !== "all";
  const showFilterEmpty = forceFilterEmpty || (filteredInvoices.length === 0 && hasActiveFilters);
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
        title="Invoices"
        count={filteredInvoices.length}
        countSuffix="invoices"
        subtitle="Customer billing across repair, cleaning and storage services."
        primaryAction={
          <Link
            href="/billing/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            New Invoice
          </Link>
        }
      >
      <StatsGrid>
        <StatsCard label="Revenue (MTD)" value={`฿${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard label="Pending" value={`฿${stats.pending.toLocaleString()}`} icon={Clock} color="amber" />
        <StatsCard label="Overdue" value={`฿${stats.overdue.toLocaleString()}`} icon={Receipt} color="red" />
        <StatsCard label="Total Invoices" value={stats.invoiceCount} icon={FileText} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredInvoices}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/billing/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredInvoices.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageInner />
    </Suspense>
  );
}
