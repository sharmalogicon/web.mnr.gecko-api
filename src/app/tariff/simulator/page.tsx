"use client";

export const dynamic = "force-dynamic";

/**
 * /tariff/simulator — Phase 7 D-12 upgrade.
 *
 * Combines Liner → Standard fallback (revenue) with Vendor tariff (cost)
 * to surface the margin per job. Lookup path is shown so the user can
 * see WHICH card and WHICH row supplied the rate.
 *
 * Phase 7.9-A — migrated to native gecko form primitives + zero inline CSS.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";

import {
  standardTariffRepo,
  linerTariffRepo,
  vendorTariffRepo,
} from "@/lib/repos";
import { customers } from "@/data/seed/_shared/customers";
import { depots } from "@/data/seed/_shared/depots";
import { vendors } from "@/data/seed/_shared/vendors";
import {
  chargeCodes,
  findChargeCode,
} from "@/data/seed/_shared/charge-codes";
import type {
  ChargeRow,
  SizeCode,
} from "@/lib/types";
import type { CargoCategory } from "@/data/seed/_shared/cargo-categories";

const ROUTE = "/tariff/simulator";

interface RateLookup {
  row: ChargeRow;
  source: "liner" | "standard";
  sourceLabel: string;
}

/** Liner → Standard fallback resolver. */
function resolveRevenue(
  agentCode: string,
  depotCode: string,
  chargeCode: string,
  size?: SizeCode,
  cargoCategory: CargoCategory = "GENERAL",
): RateLookup | undefined {
  const matches = (row: ChargeRow) =>
    row.chargeCode === chargeCode &&
    (!size || !row.size || row.size === size);

  const liner = linerTariffRepo.byAgent(agentCode);
  if (
    liner &&
    liner.status === "APPROVED" &&
    (liner.defaultCargoCategory ?? "GENERAL") === cargoCategory
  ) {
    const row = liner.rows.find(matches);
    if (row) return { row, source: "liner", sourceLabel: `Liner ${agentCode} — ${liner.quotationNo}` };
  }

  const std = standardTariffRepo.byDepot(depotCode);
  if (
    std &&
    std.status === "APPROVED" &&
    (std.defaultCargoCategory ?? "GENERAL") === cargoCategory
  ) {
    const row = std.rows.find(matches);
    if (row) return { row, source: "standard", sourceLabel: `Standard ${depotCode}` };
  }
  return undefined;
}

function resolveCost(
  vendorId: string,
  chargeCode: string,
  size?: SizeCode,
  cargoCategory: CargoCategory = "GENERAL",
): RateLookup | undefined {
  const vendor = vendorTariffRepo.byVendor(vendorId);
  if (!vendor || vendor.status !== "APPROVED") return undefined;
  if ((vendor.defaultCargoCategory ?? "GENERAL") !== cargoCategory) return undefined;
  const row = vendor.rows.find(
    (r) =>
      r.chargeCode === chargeCode &&
      (!size || !r.size || r.size === size),
  );
  if (!row) return undefined;
  return {
    row,
    source: "standard",
    sourceLabel: `Vendor ${vendorId}`,
  };
}

export default function PriceSimulatorPage() {
  const sp = useSearchParams();

  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const [agentCode, setAgentCode] = useState("C-MSKU");
  const [depotCode, setDepotCode] = useState(depots[0]?.code ?? "");
  const [chargeCode, setChargeCode] = useState("SVC-SURVEY-DRY");
  const [size, setSize] = useState<SizeCode | "_any">("_any");
  const [cargoCategory, setCargoCategory] = useState<CargoCategory>("GENERAL");
  const [vendorId, setVendorId] = useState<string>("_none");
  const [quantity, setQuantity] = useState(1);

  if (forceLoading) {
    return <AppShell><TableSkeleton columns={2} rows={6} /></AppShell>;
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
  if (forceEmpty || forceFilterEmpty) {
    const variant: EmptyStateVariant = forceFilterEmpty ? "filter-empty" : "empty";
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

  const effectiveSize = size === "_any" ? undefined : (size as SizeCode);
  const revenue = resolveRevenue(agentCode, depotCode, chargeCode, effectiveSize, cargoCategory);
  const cost    = vendorId === "_none" ? undefined : resolveCost(vendorId, chargeCode, effectiveSize, cargoCategory);

  const revenueTotal = revenue ? revenue.row.sellingRateThb * quantity : 0;
  const costTotal    = cost    ? cost.row.sellingRateThb * quantity    : 0;
  const margin       = revenueTotal - costTotal;
  const marginPct    = revenueTotal > 0 ? Math.round((margin / revenueTotal) * 100) : 0;

  const chargeMeta = findChargeCode(chargeCode);

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== Inputs ===== */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <div>
              <h2 className="gecko-card-title">Job Details</h2>
              <p className="gecko-card-description">
                Revenue resolves Liner → Standard. Cost is optional (only when outsourced).
              </p>
            </div>

            <div className="gecko-field">
              <label htmlFor="agentCode" className="gecko-field-label">Agent (Liner)</label>
              <select
                id="agentCode"
                className="gecko-select"
                value={agentCode}
                onChange={(e) => setAgentCode(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="gecko-field">
              <label htmlFor="depotCode" className="gecko-field-label">Depot</label>
              <select
                id="depotCode"
                className="gecko-select"
                value={depotCode}
                onChange={(e) => setDepotCode(e.target.value)}
              >
                {depots.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="gecko-field">
              <label htmlFor="chargeCode" className="gecko-field-label">Charge code</label>
              <select
                id="chargeCode"
                className="gecko-select"
                value={chargeCode}
                onChange={(e) => setChargeCode(e.target.value)}
              >
                <optgroup label="CEDEX — repair codes">
                  {chargeCodes.filter((c) => c.cedexComponent).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Services">
                  {chargeCodes.filter((c) => !c.cedexComponent).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </optgroup>
              </select>
              {chargeMeta && (
                <span className="gecko-field-helper">
                  Default unit: <strong>{chargeMeta.defaultBillingUnit}</strong> · Type: {chargeMeta.chargeType}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="gecko-field">
                <label htmlFor="size" className="gecko-field-label">Size</label>
                <select
                  id="size"
                  className="gecko-select"
                  value={size}
                  onChange={(e) => setSize(e.target.value as SizeCode | "_any")}
                >
                  <option value="_any">(any)</option>
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="45">45</option>
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="cargoCategory" className="gecko-field-label">Cargo</label>
                <select
                  id="cargoCategory"
                  className="gecko-select"
                  value={cargoCategory}
                  onChange={(e) => setCargoCategory(e.target.value as CargoCategory)}
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="HAZMAT">HAZMAT</option>
                  <option value="REEFER">REEFER</option>
                  <option value="FOODGRADE">FOODGRADE</option>
                </select>
              </div>
            </div>

            <div className="gecko-field">
              <label htmlFor="quantity" className="gecko-field-label">
                Quantity ({chargeMeta?.defaultBillingUnit ?? "units"})
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                className="gecko-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <hr className="gecko-divider" />

            <div className="gecko-field">
              <label htmlFor="vendorId" className="gecko-field-label">
                Vendor (optional, for cost side)
              </label>
              <select
                id="vendorId"
                className="gecko-select"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="_none">(in-house — no vendor cost)</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.category.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {cost === undefined && vendorId !== "_none" && (
                <span className="gecko-field-error">
                  No matching row in that vendor&apos;s tariff for this charge.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== Output ===== */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <h2 className="gecko-card-title flex items-center gap-2">
              <Icon name="scale" size={18} />
              Revenue · Cost · Margin
            </h2>

            {/* Revenue */}
            <section>
              <h4 className="gecko-section-header-title mb-2">Revenue</h4>
              {revenue ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="gecko-field-helper">
                      <span className="gecko-text-mono">{revenue.row.chargeCode}</span>{" "}
                      <span className="gecko-text-secondary">× {quantity}</span>
                    </span>
                    <span className="gecko-bignum gecko-text-success">
                      ฿{revenueTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="gecko-field-helper mt-1">
                    Source: {revenue.sourceLabel}
                    {revenue.source === "standard" && (
                      <span className="gecko-text-italic ml-1">
                        (fell back from Liner — no override row)
                      </span>
                    )}
                  </p>
                  <p className="gecko-field-helper">
                    Rate: ฿{revenue.row.sellingRateThb.toLocaleString()} / {revenue.row.billingUnit}
                  </p>
                </>
              ) : (
                <p className="gecko-field-error">
                  No rate found in Liner card or Standard tariff for this combination.
                </p>
              )}
            </section>

            <hr className="gecko-divider" />

            {/* Cost */}
            <section>
              <h4 className="gecko-section-header-title mb-2">Cost</h4>
              {cost ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="gecko-field-helper">
                      <span className="gecko-text-mono">{cost.row.chargeCode}</span>{" "}
                      <span className="gecko-text-secondary">× {quantity}</span>
                    </span>
                    <span className="gecko-bignum gecko-text-danger">
                      ฿{costTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="gecko-field-helper mt-1">
                    Source: {cost.sourceLabel}
                  </p>
                  <p className="gecko-field-helper">
                    Rate: ฿{cost.row.sellingRateThb.toLocaleString()} / {cost.row.billingUnit}
                  </p>
                </>
              ) : (
                <p className="gecko-field-helper gecko-text-italic">
                  {vendorId === "_none" ? "In-house — no vendor cost." : "No vendor row matches this charge."}
                </p>
              )}
            </section>

            <hr className="gecko-divider" />

            {/* Margin */}
            <section className="gecko-margin-tile">
              <div className="flex justify-between items-baseline">
                <span className="gecko-bignum-label">MARGIN</span>
                <div className="text-right">
                  <div className={`gecko-bignum ${margin >= 0 ? "gecko-text-success" : "gecko-text-danger"}`}>
                    ฿{margin.toLocaleString()}
                  </div>
                  <div className="gecko-field-helper">
                    {revenueTotal > 0 ? `${marginPct}% of revenue` : "—"}
                  </div>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="gecko-btn gecko-btn-outline gecko-btn-sm w-full"
              disabled
            >
              <Icon name="copy" size={14} />
              Create Quote (TBD — wires into Phase 8)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
