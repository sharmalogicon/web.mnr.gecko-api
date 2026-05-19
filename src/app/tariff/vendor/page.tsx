"use client";

/**
 * /tariff/vendor — list of vendor tariff cards (cost side).
 * Phase 7 D-02.
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";

export default function VendorTariffListPage() {
  const cards = vendorTariffRepo.list();
  return (
    <AppShell>
      <div className="mnr-page-actions">
        <Link href="/tariff">
          <Button variant="ghost">
            <Icon name="arrowLeft" size={16} className="mr-2" />
            Back to Tariffs
          </Button>
        </Link>
        <div className="mnr-page-actions-spacer" />
        <Button asChild>
          <Link href="/tariff/vendor/new">
            <Icon name="plus" size={16} className="mr-2" />
            Onboard Vendor
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Vendor Tariffs (cost side)</h2>
        <p className="text-sm text-muted-foreground">
          What each third-party vendor charges us when we outsource a job. Used
          by the simulator to compute margin (Revenue − Cost).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const vendor = findVendor(card.vendorId);
          return (
            <Link key={card.id} href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{vendor?.name ?? card.vendorId}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendor?.category?.replace(/_/g, " ") ?? "—"} · {vendor?.country ?? "—"}
                    </p>
                  </div>
                  <TariffStatusBadge status={card.status} />
                </CardHeader>
                <CardContent>
                  <dl className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">VQ no</dt>
                      <dd className="font-mono">{card.quotationNo || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Service rows</dt>
                      <dd className="font-medium">{card.rows.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Effective</dt>
                      <dd>{card.effectiveDate}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Expiry</dt>
                      <dd>{card.expiryDate}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
