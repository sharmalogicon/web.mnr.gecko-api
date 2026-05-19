"use client";

/**
 * /tariff/liner — list of liner tariff cards (one per shipping line).
 * Phase 7 D-02.
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";

export default function LinerTariffListPage() {
  const cards = linerTariffRepo.list();
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
          <Link href="/tariff/liner/new">
            <Icon name="plus" size={16} className="mr-2" />
            New Liner Agreement
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Liner Tariffs (per shipping line)</h2>
        <p className="text-sm text-muted-foreground">
          Per-carrier override rates relative to the depot Standard tariff.
          Liner rows take precedence at quote time; missing rows fall back to
          the depot Standard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const liner = getCustomerByCode(card.agentCode);
          return (
            <Link key={card.id} href={`/tariff/liner/${encodeURIComponent(card.agentCode)}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{liner?.name ?? card.agentCode}</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {card.agentCode}
                    </p>
                  </div>
                  <TariffStatusBadge status={card.status} />
                </CardHeader>
                <CardContent>
                  <dl className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Quotation</dt>
                      <dd className="font-mono">{card.quotationNo || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Override rows</dt>
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
