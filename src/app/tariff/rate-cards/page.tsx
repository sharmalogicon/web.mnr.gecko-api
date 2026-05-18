"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Droplets,
  MapPin,
  Clock,
  Plus,
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

const SURVEY_ICON_TOKEN = "var(--gecko-primary-600)";
const SURVEY_ICON_BG_TOKEN = "var(--gecko-primary-100)";
const CLEANING_ICON_TOKEN = "var(--gecko-info-600)";
const CLEANING_ICON_BG_TOKEN = "var(--gecko-info-100)";
const STORAGE_ICON_TOKEN = "var(--gecko-success-600)";
const STORAGE_ICON_BG_TOKEN = "var(--gecko-success-100)";
const LABOR_ICON_TOKEN = "var(--gecko-accent-600)";
const LABOR_ICON_BG_TOKEN = "var(--gecko-accent-100)";

export default function RateCardsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Standard Rate Cards</h1>
          <p className="text-muted-foreground mt-1">
            Base pricing for all depot services
          </p>
        </div>
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
            <SelectItem value="survey">Survey</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="labor">Labor</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="modification">Modification</SelectItem>
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
            <SelectItem value="genset">Genset</SelectItem>
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

      {/* Survey & Inspection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" style={{ color: SURVEY_ICON_TOKEN }} />
          Survey & Inspection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RateCard
            icon={Search}
            title="Tank Survey"
            subtitle="ISO Tank"
            rate="$100"
            unit="per unit"
            status="active"
            iconToken={SURVEY_ICON_TOKEN}
            iconBgToken={SURVEY_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Search}
            title="Container Survey"
            subtitle="Dry Container"
            rate="$60"
            unit="per unit"
            status="active"
            iconToken={SURVEY_ICON_TOKEN}
            iconBgToken={SURVEY_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Search}
            title="PTI Test"
            subtitle="Reefer"
            rate="$150"
            unit="per unit"
            status="active"
            iconToken={SURVEY_ICON_TOKEN}
            iconBgToken={SURVEY_ICON_BG_TOKEN}
          />
        </div>
      </div>

      {/* Cleaning Services */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5" style={{ color: CLEANING_ICON_TOKEN }} />
          Cleaning Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RateCard
            icon={Droplets}
            title="Standard Clean"
            subtitle="ISO Tank"
            rate="$200"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Droplets}
            title="Chemical Wash"
            subtitle="ISO Tank"
            rate="$450"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Droplets}
            title="Food Grade Clean"
            subtitle="ISO Tank"
            rate="$850"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Droplets}
            title="Hazmat Clean"
            subtitle="ISO Tank"
            rate="$650"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Droplets}
            title="Steam Clean"
            subtitle="ISO Tank"
            rate="$400"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Droplets}
            title="Washout"
            subtitle="Dry/Reefer"
            rate="$120"
            unit="per unit"
            status="active"
            iconToken={CLEANING_ICON_TOKEN}
            iconBgToken={CLEANING_ICON_BG_TOKEN}
          />
        </div>
      </div>

      {/* Storage Rates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" style={{ color: STORAGE_ICON_TOKEN }} />
          Storage Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RateCard
            icon={MapPin}
            title="General Zone"
            subtitle="All Equipment"
            rate="$25"
            unit="per day"
            status="active"
            iconToken={STORAGE_ICON_TOKEN}
            iconBgToken={STORAGE_ICON_BG_TOKEN}
          />
          <RateCard
            icon={MapPin}
            title="Food Grade Zone"
            subtitle="All Equipment"
            rate="$35"
            unit="per day"
            status="active"
            iconToken={STORAGE_ICON_TOKEN}
            iconBgToken={STORAGE_ICON_BG_TOKEN}
          />
          <RateCard
            icon={MapPin}
            title="Hazmat Zone"
            subtitle="All Equipment"
            rate="$50"
            unit="per day"
            status="active"
            iconToken={STORAGE_ICON_TOKEN}
            iconBgToken={STORAGE_ICON_BG_TOKEN}
          />
        </div>
      </div>

      {/* Labor Rates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" style={{ color: LABOR_ICON_TOKEN }} />
          Labor Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RateCard
            icon={Clock}
            title="General Labor"
            subtitle="Standard work"
            rate="$50"
            unit="per hour"
            status="active"
            iconToken={LABOR_ICON_TOKEN}
            iconBgToken={LABOR_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Clock}
            title="Technician Labor"
            subtitle="Skilled work"
            rate="$75"
            unit="per hour"
            status="active"
            iconToken={LABOR_ICON_TOKEN}
            iconBgToken={LABOR_ICON_BG_TOKEN}
          />
          <RateCard
            icon={Clock}
            title="Specialist Labor"
            subtitle="Expert work"
            rate="$100"
            unit="per hour"
            status="active"
            iconToken={LABOR_ICON_TOKEN}
            iconBgToken={LABOR_ICON_BG_TOKEN}
          />
        </div>
      </div>
    </AppShell>
  );
}
