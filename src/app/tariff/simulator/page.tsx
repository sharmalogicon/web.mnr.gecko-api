"use client";

/**
 * /tariff/simulator — Phase 7 D-12 upgrade.
 *
 * Combines Liner → Standard fallback (revenue) with Vendor tariff (cost)
 * to surface the margin per job. Lookup path is shown so the user can
 * see WHICH card and WHICH row supplied the rate.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  // Phase 7.8-C: ChargeRow no longer carries cargoCategory; cargo is a
  // card-header default. The simulator's cargoCategory input filters the
  // CARD (e.g. only apply this liner card when its defaultCargoCategory
  // matches), then matches rows by chargeCode + size.
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

  // Dev-param state branches (Phase 1)
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  // Form state
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

  // Lookups
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
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Revenue resolves Liner → Standard. Cost is optional (only when outsourced).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="agentCode">Agent (Liner)</Label>
              <Select onValueChange={setAgentCode} value={agentCode}>
                <SelectTrigger id="agentCode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="depotCode">Depot</Label>
              <Select onValueChange={setDepotCode} value={depotCode}>
                <SelectTrigger id="depotCode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {depots.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="chargeCode">Charge code</Label>
              <Select onValueChange={setChargeCode} value={chargeCode}>
                <SelectTrigger id="chargeCode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>CEDEX — repair codes</SelectLabel>
                    {chargeCodes.filter((c) => c.cedexComponent).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Services</SelectLabel>
                    {chargeCodes.filter((c) => !c.cedexComponent).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {chargeMeta && (
                <p className="text-xs text-muted-foreground">
                  Default unit: <strong>{chargeMeta.defaultBillingUnit}</strong> · Type: {chargeMeta.chargeType}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="size">Size</Label>
                <Select onValueChange={(v) => setSize(v as SizeCode | "_any")} value={size}>
                  <SelectTrigger id="size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_any">(any)</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cargoCategory">Cargo</Label>
                <Select onValueChange={(v) => setCargoCategory(v as CargoCategory)} value={cargoCategory}>
                  <SelectTrigger id="cargoCategory"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">GENERAL</SelectItem>
                    <SelectItem value="HAZMAT">HAZMAT</SelectItem>
                    <SelectItem value="REEFER">REEFER</SelectItem>
                    <SelectItem value="FOODGRADE">FOODGRADE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity ({chargeMeta?.defaultBillingUnit ?? "units"})</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <Label htmlFor="vendorId">Vendor (optional, for cost side)</Label>
              <Select onValueChange={setVendorId} value={vendorId}>
                <SelectTrigger id="vendorId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">(in-house — no vendor cost)</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} — {v.category.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cost === undefined && vendorId !== "_none" && (
                <p className="text-xs text-destructive">
                  No matching row in that vendor's tariff for this charge.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===== Output ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="scale" size={18} />
              Revenue · Cost · Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue */}
            <section>
              <h4 className="font-medium mb-2 text-sm uppercase text-muted-foreground">Revenue</h4>
              {revenue ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm">
                      <span className="font-mono">{revenue.row.chargeCode}</span>{" "}
                      <span className="text-muted-foreground">× {quantity}</span>
                    </span>
                    <span className="text-xl font-bold" style={{ color: "var(--gecko-success-700)" }}>
                      ฿{revenueTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {revenue.sourceLabel}
                    {revenue.source === "standard" && (
                      <span className="ml-1 italic">
                        (fell back from Liner — no override row)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rate: ฿{revenue.row.sellingRateThb.toLocaleString()} / {revenue.row.billingUnit}
                  </p>
                </>
              ) : (
                <p className="text-sm text-destructive">
                  No rate found in Liner card or Standard tariff for this combination.
                </p>
              )}
            </section>

            <Separator />

            {/* Cost */}
            <section>
              <h4 className="font-medium mb-2 text-sm uppercase text-muted-foreground">Cost</h4>
              {cost ? (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm">
                      <span className="font-mono">{cost.row.chargeCode}</span>{" "}
                      <span className="text-muted-foreground">× {quantity}</span>
                    </span>
                    <span className="text-xl font-bold" style={{ color: "var(--gecko-error-700)" }}>
                      ฿{costTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {cost.sourceLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rate: ฿{cost.row.sellingRateThb.toLocaleString()} / {cost.row.billingUnit}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {vendorId === "_none" ? "In-house — no vendor cost." : "No vendor row matches this charge."}
                </p>
              )}
            </section>

            <Separator />

            {/* Margin */}
            <section className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-baseline">
                <span
                  style={{
                    fontSize: "var(--gecko-text-base)",
                    fontWeight: "var(--gecko-font-weight-bold)",
                    color: "var(--gecko-text-primary)",
                    letterSpacing: "0.05em",
                  }}
                >
                  MARGIN
                </span>
                <div className="text-right">
                  <div
                    style={{
                      fontSize: "var(--gecko-text-xl)",
                      fontWeight: "var(--gecko-font-weight-bold)",
                      color: margin >= 0
                        ? "var(--gecko-success-700)"
                        : "var(--gecko-error-700)",
                      lineHeight: 1.1,
                    }}
                  >
                    ฿{margin.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {revenueTotal > 0 ? `${marginPct}% of revenue` : "—"}
                  </div>
                </div>
              </div>
            </section>

            <Button variant="outline" className="w-full" disabled>
              <Icon name="copy" size={14} className="mr-2" />
              Create Quote (TBD — wires into Phase 8)
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
