"use client";

/**
 * /tariff/standard — list of depot standard tariff cards (one per depot).
 * Phase 7 D-01.
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";

export default function StandardTariffListPage() {
  const cards = standardTariffRepo.list();
  return (
    <AppShell>
      <Link href="/tariff">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Tariffs
        </Button>
      </Link>

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Standard Tariffs (per depot)</h2>
        <p className="text-sm text-muted-foreground">
          Baseline price list per depot. When a Liner job runs at a depot, the
          Liner card's row (if any) supersedes; otherwise the Standard row applies.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const depot = getDepotByCode(card.depotCode);
          return (
            <Link key={card.id} href={`/tariff/standard/${encodeURIComponent(card.depotCode)}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-mono">{card.depotCode}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{depot?.name ?? "—"}</p>
                  </div>
                  <TariffStatusBadge status={card.status} />
                </CardHeader>
                <CardContent>
                  <dl className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Rows</dt>
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
