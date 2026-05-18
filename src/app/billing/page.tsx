"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, FileText, Download, DollarSign, CreditCard, Receipt, Clock } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
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

const mockInvoices: Invoice[] = [
  { id: "1", number: "INV-2024-0089", customer: "CMA CGM", equipment: "MSKU2234567", services: "Survey, Cleaning", amount: 1250, status: "paid", dueDate: "Dec 15", issueDate: "Dec 10" },
  { id: "2", number: "INV-2024-0088", customer: "MSC", equipment: "TCLU9987654", services: "Repair", amount: 2400, status: "pending", dueDate: "Dec 20", issueDate: "Dec 8" },
  { id: "3", number: "INV-2024-0087", customer: "Hapag-Lloyd", equipment: "HLXU1122334", services: "Storage", amount: 450, status: "overdue", dueDate: "Dec 5", issueDate: "Nov 28" },
  { id: "4", number: "INV-2024-0086", customer: "ONE", equipment: "MSCU5566778", services: "Cleaning", amount: 850, status: "pending", dueDate: "Dec 18", issueDate: "Dec 11" },
  { id: "5", number: "INV-2024-0085", customer: "Maersk", equipment: "REEF4455667", services: "PTI, Repair", amount: 3200, status: "paid", dueDate: "Dec 10", issueDate: "Dec 3" },
  { id: "6", number: "INV-2024-0090", customer: "Evergreen", equipment: "TCKU8899001", services: "Survey", amount: 350, status: "draft", dueDate: "-", issueDate: "Dec 12" },
];

const columns: Column<Invoice>[] = [
  { key: "number", label: "Invoice #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "services", label: "Services", sortable: true },
  { key: "amount", label: "Amount", sortable: true, align: "right", render: (val) => <span className="font-medium">${Number(val).toLocaleString()}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Invoice["status"]} /> },
  { key: "dueDate", label: "Due Date", sortable: true },
];

export default function BillingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    totalRevenue: mockInvoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pending: mockInvoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amount, 0),
    overdue: mockInvoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
    invoiceCount: mockInvoices.length,
  };

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      !searchQuery ||
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.equipment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Invoice>[] = [
    { label: "View Invoice", icon: <Eye className="h-4 w-4" />, onClick: (row) => router.push(`/billing/${row.id}`) },
    { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => {} },
    { label: "Download PDF", icon: <Download className="h-4 w-4" />, onClick: () => {} },
    { label: "Record Payment", icon: <CreditCard className="h-4 w-4" />, onClick: () => {}, separator: true },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Billing & Payments"
        description="Manage invoices and track payments"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Billing" },
        ]}
        actions={
          <Button asChild>
            <Link href="/billing/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Revenue (MTD)" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard label="Pending" value={`$${stats.pending.toLocaleString()}`} icon={Clock} color="amber" />
        <StatsCard label="Overdue" value={`$${stats.overdue.toLocaleString()}`} icon={Receipt} color="red" />
        <StatsCard label="Total Invoices" value={stats.invoiceCount} icon={FileText} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
    </AppShell>
  );
}
