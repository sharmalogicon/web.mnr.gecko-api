"use client";

/**
 * /tariff — 3-tier tariff hub.
 * Phase 7 rewire: surfaces Standard / Liner / Vendor as the primary
 * lanes, with Surcharges / Simulator / History as secondary tiles.
 *
 * Phase 7.1 — mirrors TOS sibling repo design: gecko-page-actions header
 * with count-badge + toolbar, raw-div cards (no shadcn Card), gecko tokens.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { KpiTileSkeleton, TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { standardTariffRepo, linerTariffRepo, vendorTariffRepo, historyRepo } from "@/lib/repos";

const ROUTE = "/tariff";

interface LaneCardProps {
  iconName: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  count: number;
  href: string;
}

function LaneCard({ iconName, iconColor, iconBg, title, description, count, href }: LaneCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--gecko-bg-surface)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--gecko-shadow-sm)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-sm)")}
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div
            style={{
              borderRadius: "var(--gecko-radius-lg)",
              padding: "var(--gecko-space-3)",
              background: iconBg,
              color: iconColor,
            }}
          >
            <Icon name={iconName} size={24} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--gecko-text-primary)", lineHeight: 1, fontFamily: "var(--gecko-font-mono)" }}>
            {count}
          </span>
        </div>
        <div style={{ fontSize: "var(--gecko-text-base)", fontWeight: "var(--gecko-font-weight-semibold)", color: "var(--gecko-text-primary)", marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)" }}>{description}</div>
        <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--gecko-primary-600)" }}>
          Manage →
        </div>
      </div>
    </Link>
  );
}

interface SecondaryTileProps {
  iconName: string;
  title: string;
  description: string;
  href: string;
}

function SecondaryTile({ iconName, title, description, href }: SecondaryTileProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--gecko-bg-surface)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--gecko-shadow-sm)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-sm)")}
    >
      <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            borderRadius: "var(--gecko-radius-md)",
            padding: "var(--gecko-space-2)",
            background: "var(--gecko-bg-subtle)",
            color: "var(--gecko-text-secondary)",
          }}
        >
          <Icon name={iconName} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: "var(--gecko-font-weight-semibold)", color: "var(--gecko-text-primary)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)", marginTop: 2 }}>{description}</div>
        </div>
      </div>
    </Link>
  );
}

export default function TariffPage() {
  const sp = useSearchParams();

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const standardCount = forceEmpty ? 0 : standardTariffRepo.list().length;
  const linerCount    = forceEmpty ? 0 : linerTariffRepo.list().length;
  const vendorCount   = forceEmpty ? 0 : vendorTariffRepo.list().length;
  const historyCount  = forceEmpty ? 0 : historyRepo.list().length;
  const totalLanes    = standardCount + linerCount + vendorCount;

  if (forceLoading) {
    return (
      <AppShell>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
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
  const hubHasData = totalLanes > 0;
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

  return (
    <AppShell>
      {/* ===== Page header (gecko-page-actions) ===== */}
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>Tariffs</h1>
            <span className="gecko-count-badge">{totalLanes} cards</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            Three-tier tariff model: Standard (depot baseline) → Liner (per-shipping-line overrides) → Vendor (cost side).
            The simulator combines all three to compute revenue, cost, and margin per job.
          </div>
        </div>
      </div>

      {/* ===== Primary lanes ===== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6 mb-8">
        <LaneCard
          iconName="invoice"
          iconColor="var(--gecko-primary-700)"
          iconBg="var(--gecko-primary-100)"
          title="Standard Tariff"
          description="Depot baseline price list (one card per depot)."
          count={standardCount}
          href="/tariff/standard"
        />
        <LaneCard
          iconName="ship"
          iconColor="var(--gecko-accent-700)"
          iconBg="var(--gecko-accent-100)"
          title="Liner Tariff"
          description="Per-shipping-line agreements with override rates."
          count={linerCount}
          href="/tariff/liner"
        />
        <LaneCard
          iconName="truck"
          iconColor="var(--gecko-warning-700)"
          iconBg="var(--gecko-warning-100)"
          title="Vendor Tariff"
          description="What suppliers charge us for outsourced work."
          count={vendorCount}
          href="/tariff/vendor"
        />
      </div>

      {/* ===== Secondary tiles ===== */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gecko-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Supporting tools
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SecondaryTile
          iconName="scale"
          title="Price Simulator"
          description="Revenue + Cost + Margin lookup"
          href="/tariff/simulator"
        />
        <SecondaryTile
          iconName="warning"
          title="Surcharges"
          description="Weekend, emergency, hazmat fees"
          href="/tariff/surcharges"
        />
        <SecondaryTile
          iconName="clock"
          title="Price History"
          description={`${historyCount} pricing change${historyCount === 1 ? "" : "s"}`}
          href="/tariff/history"
        />
        <SecondaryTile
          iconName="copy"
          title="Quick clone"
          description="Clone an existing Liner agreement"
          href="/tariff/liner"
        />
      </div>
    </AppShell>
  );
}
