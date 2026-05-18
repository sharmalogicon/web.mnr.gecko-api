"use client";

import Link from "next/link";
import {
  Receipt,
  CreditCard,
  FileText,
  AlertTriangle,
  Calculator,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatsCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TariffPage() {
  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tariff Management</h1>
        <p className="text-muted-foreground mt-1">
          Configure service pricing and customer rates
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          label="Rate Cards"
          value="6"
          icon={Receipt}
          color="blue"
        />
        <StatsCard
          label="Customer Rates"
          value="24"
          icon={CreditCard}
          color="green"
        />
        <StatsCard
          label="Active Contracts"
          value="8"
          icon={FileText}
          color="purple"
        />
        <StatsCard
          label="Expiring Soon"
          value="3"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={Receipt}
            title="Standard Rate Cards"
            description="Configure base pricing for all services"
            href="/tariff/rate-cards"
            iconToken="var(--gecko-primary-600)"
            iconBgToken="var(--gecko-primary-100)"
          />
          <QuickActionCard
            icon={CreditCard}
            title="Customer Rates"
            description="Set customer-specific pricing and discounts"
            href="/tariff/customer-rates"
            iconToken="var(--gecko-success-600)"
            iconBgToken="var(--gecko-success-100)"
          />
          <QuickActionCard
            icon={FileText}
            title="Contracts"
            description="Manage service agreements"
            href="/tariff/contracts"
            iconToken="var(--gecko-accent-600)"
            iconBgToken="var(--gecko-accent-100)"
          />
          <QuickActionCard
            icon={AlertTriangle}
            title="Surcharges"
            description="Weekend, emergency, hazmat fees"
            href="/tariff/surcharges"
            iconToken="var(--gecko-warning-600)"
            iconBgToken="var(--gecko-warning-100)"
          />
          <QuickActionCard
            icon={Calculator}
            title="Price Simulator"
            description="Calculate job pricing instantly"
            href="/tariff/simulator"
            iconToken="var(--gecko-info-600)"
            iconBgToken="var(--gecko-info-100)"
          />
          <QuickActionCard
            icon={Clock}
            title="Price History"
            description="View all pricing changes"
            href="/tariff/history"
            iconToken="var(--gecko-gray-600)"
            iconBgToken="var(--gecko-gray-100)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expiring Contracts</CardTitle>
            <Link href="/tariff/contracts">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ExpiringContractItem
                customer="CMA CGM"
                contractId="CTR-2024-001"
                expiryDate="Dec 31, 2024"
                daysRemaining={19}
              />
              <Separator />
              <ExpiringContractItem
                customer="MAERSK"
                contractId="CTR-2024-003"
                expiryDate="Jan 15, 2025"
                daysRemaining={34}
              />
              <Separator />
              <ExpiringContractItem
                customer="Hapag-Lloyd"
                contractId="CTR-2024-007"
                expiryDate="Jan 31, 2025"
                daysRemaining={50}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Price Changes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Price Changes</CardTitle>
            <Link href="/tariff/history">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PriceChangeItem
                description="Food Grade Cleaning rate updated: $800 → $850"
                timestamp="2 days ago"
              />
              <Separator />
              <PriceChangeItem
                description="MSC contract rates applied (10% discount)"
                timestamp="3 days ago"
              />
              <Separator />
              <PriceChangeItem
                description="Weekend surcharge updated: 25% → 30%"
                timestamp="1 week ago"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  description: string;
  href: string;
  iconToken: string;
  iconBgToken: string;
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  iconToken,
  iconBgToken,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div
            style={{
              borderRadius: "var(--gecko-radius-lg)",
              padding: "var(--gecko-space-3)",
              width: "fit-content",
              marginBottom: "var(--gecko-space-4)",
              background: iconBgToken,
            }}
          >
            <Icon style={{ height: 24, width: 24, color: iconToken }} />
          </div>
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4">
            <span className="text-sm font-medium text-primary">Manage →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ExpiringContractItemProps {
  customer: string;
  contractId: string;
  expiryDate: string;
  daysRemaining: number;
}

function ExpiringContractItem({
  customer,
  contractId,
  expiryDate,
  daysRemaining,
}: ExpiringContractItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{customer}</p>
        <p className="text-sm text-muted-foreground">{contractId}</p>
      </div>
      <div className="text-right">
        <p className="text-sm">{expiryDate}</p>
        <Badge variant="warning">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {daysRemaining} days
        </Badge>
      </div>
      <Link href={`/tariff/contracts/${contractId.toLowerCase()}`}>
        <Button variant="outline" size="sm">
          Renew
        </Button>
      </Link>
    </div>
  );
}

interface PriceChangeItemProps {
  description: string;
  timestamp: string;
}

function PriceChangeItem({ description, timestamp }: PriceChangeItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        style={{
          borderRadius: "var(--gecko-radius-full)",
          background: "var(--gecko-primary-100)",
          padding: 4,
          marginTop: 2,
        }}
      >
        <div
          style={{
            height: 8,
            width: 8,
            borderRadius: "var(--gecko-radius-full)",
            background: "var(--gecko-primary-600)",
          }}
        />
      </div>
      <div className="flex-1">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      </div>
    </div>
  );
}
