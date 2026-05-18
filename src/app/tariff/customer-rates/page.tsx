"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Building2, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge, CustomerTier } from "@/components/tariff";
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

interface CustomerRate {
  id: string;
  name: string;
  tier: CustomerTier;
  discount: string;
  hasContract: boolean;
  services: {
    name: string;
    rate: string;
  }[];
  lastUpdated: string;
}

const customerRates: CustomerRate[] = [
  {
    id: "cma-cgm",
    name: "CMA CGM (Thailand) Co., Ltd.",
    tier: "platinum",
    discount: "20%",
    hasContract: true,
    services: [
      { name: "Survey", rate: "$80 (-20%)" },
      { name: "Cleaning", rate: "Custom rates" },
      { name: "Storage", rate: "$20/day (-20%)" },
    ],
    lastUpdated: "Dec 10, 2024",
  },
  {
    id: "maersk",
    name: "MAERSK Line",
    tier: "platinum",
    discount: "18%",
    hasContract: true,
    services: [
      { name: "Survey", rate: "$82 (-18%)" },
      { name: "Cleaning", rate: "-18% all" },
      { name: "Storage", rate: "$21/day (-16%)" },
    ],
    lastUpdated: "Nov 28, 2024",
  },
  {
    id: "msc",
    name: "MSC Mediterranean Shipping",
    tier: "gold",
    discount: "15%",
    hasContract: true,
    services: [
      { name: "Survey", rate: "$85 (-15%)" },
      { name: "Cleaning", rate: "-15% all" },
      { name: "Storage", rate: "$22/day (-12%)" },
    ],
    lastUpdated: "Nov 15, 2024",
  },
  {
    id: "hapag-lloyd",
    name: "Hapag-Lloyd AG",
    tier: "gold",
    discount: "12%",
    hasContract: false,
    services: [],
    lastUpdated: "Oct 20, 2024",
  },
];

export default function CustomerRatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

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
            <SelectItem value="bronze">Bronze</SelectItem>
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
        {customerRates.map((customer) => (
          <CustomerRateCard key={customer.id} customer={customer} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1-4 of 24 customers</p>
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

interface CustomerRateCardProps {
  customer: CustomerRate;
}

function CustomerRateCard({ customer }: CustomerRateCardProps) {
  const handleEditClick = () => {
    console.log("🟢 Edit Button Clicked for customer:", customer.id);
    console.log("🟢 Navigating to:", `/tariff/customer-rates/${customer.id}/edit`);
  };

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
              <h3 className="font-semibold text-lg">{customer.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={customer.tier} />
                <span className="text-sm font-medium">Discount: {customer.discount}</span>
                {customer.hasContract && (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Contract
                  </Badge>
                )}
                {!customer.hasContract && (
                  <Badge variant="secondary">No Contract</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/tariff/customer-rates/${customer.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href={`/tariff/customer-rates/${customer.id}/edit`} onClick={handleEditClick}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {customer.services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {customer.services.map((service, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{
                  border: "1px solid var(--gecko-border)",
                  background: "var(--gecko-bg-subtle)",
                }}
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {service.name}
                </p>
                <p className="text-sm font-semibold">{service.rate}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Using tier-based discount only
          </p>
        )}

        <div
          className="mt-4 pt-4"
          style={{ borderTop: "1px solid var(--gecko-border)" }}
        >
          <p className="text-xs text-muted-foreground">
            Last updated: {customer.lastUpdated}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
