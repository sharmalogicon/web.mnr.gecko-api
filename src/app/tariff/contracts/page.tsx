"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, FileText, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge, ContractStatusBadge, CustomerTier, ContractStatus } from "@/components/tariff";
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

interface Contract {
  id: string;
  contractNumber: string;
  customer: string;
  tier: CustomerTier;
  period: string;
  status: ContractStatus;
  expiryWarning?: string;
}

const contracts: Contract[] = [
  {
    id: "ctr-2024-001",
    contractNumber: "CTR-2024-001",
    customer: "CMA CGM",
    tier: "platinum",
    period: "Jan 1 - Dec 31, 2024",
    status: "active",
    expiryWarning: "Expires in 19 days",
  },
  {
    id: "ctr-2024-002",
    contractNumber: "CTR-2024-002",
    customer: "MAERSK",
    tier: "platinum",
    period: "Feb 1 - Jan 31, 2025",
    status: "active",
  },
  {
    id: "ctr-2024-003",
    contractNumber: "CTR-2024-003",
    customer: "MSC",
    tier: "gold",
    period: "Mar 1 - Feb 28, 2025",
    status: "active",
  },
  {
    id: "ctr-2024-004",
    contractNumber: "CTR-2024-004",
    customer: "Hapag-Lloyd",
    tier: "gold",
    period: "Jan 1 - Dec 31, 2024",
    status: "active",
    expiryWarning: "Expires in 19 days",
  },
  {
    id: "ctr-2023-015",
    contractNumber: "CTR-2023-015",
    customer: "ONE",
    tier: "silver",
    period: "Jul 1 - Jun 30, 2024",
    status: "expired",
  },
  {
    id: "ctr-2024-005",
    contractNumber: "CTR-2024-005",
    customer: "Evergreen",
    tier: "silver",
    period: "Pending signature",
    status: "draft",
  },
];

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

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
        {contracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-6 of 12 contracts</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            ← Prev
          </Button>
          <Button variant="outline" size="sm">
            Next →
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

interface ContractCardProps {
  contract: Contract;
}

function ContractCard({ contract }: ContractCardProps) {
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
              {contract.expiryWarning && (
                <Badge variant="warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {contract.expiryWarning}
                </Badge>
              )}
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
