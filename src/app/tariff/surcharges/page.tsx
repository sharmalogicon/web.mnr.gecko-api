"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Clock,
  Zap,
  Ruler,
  Gift,
  MoreVertical,
} from "lucide-react";
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

interface Surcharge {
  id: string;
  name: string;
  description: string;
  appliesTo: string;
  active: boolean;
}

const timeBasedSurcharges: Surcharge[] = [
  {
    id: "weekend",
    name: "⏰ Weekend Surcharge",
    description: "+30% on all services performed on Saturday & Sunday",
    appliesTo: "All services",
    active: true,
  },
  {
    id: "after-hours",
    name: "🌙 After-Hours Surcharge",
    description: "+25% for services between 6 PM - 6 AM",
    appliesTo: "All services",
    active: true,
  },
  {
    id: "holiday",
    name: "🎄 Holiday Surcharge",
    description: "+50% on public holidays",
    appliesTo: "All services",
    active: true,
  },
];

const serviceBasedSurcharges: Surcharge[] = [
  {
    id: "rush",
    name: "⚡ Rush/Express Surcharge",
    description: "+50% for same-day service requests",
    appliesTo: "Survey, Cleaning",
    active: true,
  },
  {
    id: "hazmat",
    name: "☢️ Hazmat Handling Surcharge",
    description: "+$150 flat fee for hazardous material handling",
    appliesTo: "Survey, Cleaning, Storage",
    active: true,
  },
  {
    id: "steam",
    name: "🔥 Steam Heating Surcharge",
    description: "+$200 for tanks requiring steam heating during cleaning",
    appliesTo: "Cleaning",
    active: true,
  },
  {
    id: "reinspection",
    name: "📋 Re-inspection Fee",
    description: "$50 flat fee for repeat inspections after failure",
    appliesTo: "Survey",
    active: true,
  },
];

const equipmentBasedSurcharges: Surcharge[] = [
  {
    id: "oversize",
    name: "📏 Oversize Equipment (40ft+)",
    description: "+50% for 40ft and larger equipment",
    appliesTo: "All services",
    active: true,
  },
  {
    id: "precooling",
    name: "❄️ Reefer Pre-cooling",
    description: "+$75 for reefer pre-cooling before PTI",
    appliesTo: "Reefer PTI",
    active: true,
  },
];

const discounts: Surcharge[] = [
  {
    id: "new-customer",
    name: "🎁 New Customer Discount",
    description: "-10% for first 3 months",
    appliesTo: "All services (new customers only)",
    active: true,
  },
  {
    id: "bulk",
    name: "📦 Bulk Service Discount",
    description: "-5% when ordering 5+ services in single order",
    appliesTo: "Survey, Cleaning",
    active: true,
  },
  {
    id: "promo-q1",
    name: "🏷️ Q1 2025 Promo",
    description: "-15% on Food Grade Cleaning (Jan 1 - Mar 31, 2025)",
    appliesTo: "Food Grade Cleaning",
    active: false,
  },
];

export default function SurchargesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Surcharges & Adjustments
          </h1>
          <p className="text-muted-foreground mt-1">
            Additional fees and discounts applied to services
          </p>
        </div>
        <Link href="/tariff/surcharges/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Surcharge
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      {/* Time-Based Surcharges */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" style={{ color: "var(--gecko-primary-600)" }} />
          Time-Based Surcharges
        </h2>
        <div className="space-y-4">
          {timeBasedSurcharges.map((surcharge) => (
            <SurchargeCard key={surcharge.id} surcharge={surcharge} />
          ))}
        </div>
      </div>

      {/* Service-Based Surcharges */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" style={{ color: "var(--gecko-warning-600)" }} />
          Service-Based Surcharges
        </h2>
        <div className="space-y-4">
          {serviceBasedSurcharges.map((surcharge) => (
            <SurchargeCard key={surcharge.id} surcharge={surcharge} />
          ))}
        </div>
      </div>

      {/* Equipment-Based Surcharges */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ruler className="h-5 w-5" style={{ color: "var(--gecko-accent-600)" }} />
          Equipment-Based Surcharges
        </h2>
        <div className="space-y-4">
          {equipmentBasedSurcharges.map((surcharge) => (
            <SurchargeCard key={surcharge.id} surcharge={surcharge} />
          ))}
        </div>
      </div>

      {/* Discounts & Promotions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" style={{ color: "var(--gecko-success-600)" }} />
          Discounts & Promotions
        </h2>
        <div className="space-y-4">
          {discounts.map((surcharge) => (
            <SurchargeCard key={surcharge.id} surcharge={surcharge} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

interface SurchargeCardProps {
  surcharge: Surcharge;
}

function SurchargeCard({ surcharge }: SurchargeCardProps) {
  const [isActive, setIsActive] = useState(surcharge.active);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{surcharge.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {surcharge.description}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Applies to:</span>{" "}
              {surcharge.appliesTo}
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
