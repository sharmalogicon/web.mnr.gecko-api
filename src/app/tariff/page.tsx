"use client";

import { Suspense } from "react";
/**
 * /tariff — 3-tier tariff hub.
 * Phase 7 rewire: surfaces Standard / Liner / Vendor as the primary
 * lanes, with Surcharges / Simulator / History as secondary tiles.
 *
 * Phase 7.1 — mirrors TOS sibling repo design: gecko-page-actions header
 * with count-badge + toolbar, raw-div cards (no shadcn Card), gecko tokens.
 *
 * Phase 7.13-C2 — chrome moves into <ListPageShell>; LaneCard + SecondaryTile
 * use a co-located TariffHub.module.css for the per-tile chrome (no
 * inline style props remain).
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { KpiTileSkeleton, TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { standardTariffRepo, linerTariffRepo, vendorTariffRepo, historyRepo } from "@/lib/repos";

import styles from "./TariffHub.module.css";

const ROUTE = "/tariff";

interface LaneCardProps {
  iconName: string;
  iconClass: string;
  title: string;
  description: string;
  count: number;
  href: string;
}

function LaneCard({ iconName, iconClass, title, description, count, href }: LaneCardProps) {
  return (
    <Link href={href} className={styles.laneCard}>
      <div className={styles.laneCardInner}>
        <div className={styles.laneCardHeader}>
          <div className={`${styles.laneIcon} ${iconClass}`}>
            <Icon name={iconName} size={24} />
          </div>
          <span className={styles.laneCount}>{count}</span>
        </div>
        <div className={styles.laneTitle}>{title}</div>
        <div className={styles.laneDescription}>{description}</div>
        <div className={styles.laneManage}>Manage →</div>
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
    <Link href={href} className={styles.secondaryTile}>
      <div className={styles.secondaryIcon}>
        <Icon name={iconName} size={18} />
      </div>
      <div className={styles.secondaryBody}>
        <div className={styles.secondaryTitle}>{title}</div>
        <div className={styles.secondaryDescription}>{description}</div>
      </div>
    </Link>
  );
}

function TariffPageInner() {
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
      <ListPageShell
        title="Tariffs"
        count={totalLanes}
        countSuffix="lanes"
        subtitle="Three-tier tariff model: Standard (depot baseline) → Liner (per-shipping-line overrides) → Vendor (cost side). The simulator combines all three to compute revenue, cost, and margin per job."
      >
        {/* ===== Primary lanes ===== */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LaneCard
            iconName="invoice"
            iconClass={styles.laneIconPrimary}
            title="Standard Tariff"
            description="Depot baseline price list (one card per depot)."
            count={standardCount}
            href="/tariff/standard"
          />
          <LaneCard
            iconName="ship"
            iconClass={styles.laneIconAccent}
            title="Liner Tariff"
            description="Per-shipping-line agreements with override rates."
            count={linerCount}
            href="/tariff/liner"
          />
          <LaneCard
            iconName="truck"
            iconClass={styles.laneIconWarning}
            title="Vendor Tariff"
            description="What suppliers charge us for outsourced work."
            count={vendorCount}
            href="/tariff/vendor"
          />
        </div>

        {/* ===== Secondary tiles ===== */}
        <div className={styles.secondaryHeading}>Supporting tools</div>
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
      </ListPageShell>
    </AppShell>
  );
}

export default function TariffPage() {
  return (
    <Suspense fallback={null}>
      <TariffPageInner />
    </Suspense>
  );
}
