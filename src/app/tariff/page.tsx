"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton, KpiTileSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { rateCards } from "@/data/seed/tariff/rate-cards";
import { contracts } from "@/data/seed/tariff/contracts";
import { customerRates } from "@/data/seed/tariff/customer-rates";
import { tariffHistory } from "@/data/seed/tariff/history";

const ROUTE = "/tariff";

export default function TariffPage() {
  const sp = useSearchParams();

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const rateCardCount    = forceEmpty ? 0 : rateCards.length;
  const contractCount    = forceEmpty ? 0 : contracts.filter((c) => c.status === "active").length;
  const customerRateCount = forceEmpty ? 0 : customerRates.length;
  const historyCount     = forceEmpty ? 0 : tariffHistory.length;

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return (
      <AppShell>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <KpiTileSkeleton />
          <KpiTileSkeleton />
          <KpiTileSkeleton />
          <KpiTileSkeleton />
        </div>
        <TableSkeleton columns={3} rows={6} />
      </AppShell>
    );
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
  // Hub is empty when no rate cards AND no contracts exist.
  const hubHasData = rateCardCount + contractCount > 0;
  const showFilterEmpty = forceFilterEmpty;
  const showEmpty       = forceEmpty || !hubHasData;
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

  const expiringContracts = contracts
    .filter((c) => c.status === "active")
    .slice(0, 3);

  const recentChanges = tariffHistory.slice(0, 3);

  return (
    <AppShell>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          label="Rate Cards"
          value={String(rateCardCount)}
          icon={Receipt}
          color="blue"
        />
        <StatsCard
          label="Customer Rates"
          value={String(customerRateCount)}
          icon={CreditCard}
          color="green"
        />
        <StatsCard
          label="Active Contracts"
          value={String(contractCount)}
          icon={FileText}
          color="purple"
        />
        <StatsCard
          label="History Entries"
          value={String(historyCount)}
          icon={Clock}
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
        {/* Active Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Contracts</CardTitle>
            <Link href="/tariff/contracts">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringContracts.map((c, idx) => (
                <div key={c.id}>
                  <ActiveContractItem
                    customer={c.customerCode.replace(/^C-/, "")}
                    contractId={c.id}
                    period={`${c.effectiveFrom} → ${c.effectiveTo}`}
                  />
                  {idx < expiringContracts.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
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
              {recentChanges.map((h, idx) => (
                <div key={h.id}>
                  <PriceChangeItem
                    description={`${h.type.replace(/_/g, " ")}: ${h.entityId}`}
                    timestamp={h.changedAt}
                  />
                  {idx < recentChanges.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
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

interface ActiveContractItemProps {
  customer: string;
  contractId: string;
  period: string;
}

function ActiveContractItem({
  customer,
  contractId,
  period,
}: ActiveContractItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{customer}</p>
        <p className="text-sm text-muted-foreground">{contractId}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">{period}</p>
        <Badge variant="success">Active</Badge>
      </div>
      <Link href={`/tariff/contracts/${contractId.toLowerCase()}`}>
        <Button variant="outline" size="sm">
          View
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
