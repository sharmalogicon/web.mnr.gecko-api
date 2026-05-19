"use client";

/**
 * /tariff/standard/[depot] — view a depot's standard tariff card.
 * Phase 7 D-01.
 */

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChargesTable,
  TariffCardFooter,
  TariffStatusBadge,
} from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";

export default function StandardTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const depotCode = String(params?.depot ?? "");
  const card = standardTariffRepo.byDepot(depotCode);
  const depot = getDepotByCode(depotCode);

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="No standard tariff for this depot"
          description={`Depot ${depotCode} has no Standard tariff configured.`}
          primary={{ label: "Back to Standard Tariffs", href: "/tariff/standard" }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/tariff/standard">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Standard Tariffs
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">
              <span className="font-mono">{card.depotCode}</span>
              <span className="ml-3 text-base text-muted-foreground">{depot?.name}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Effective {card.effectiveDate} → {card.expiryDate} ·{" "}
              {card.rows.length} charge row{card.rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TariffStatusBadge status={card.status} />
            <Button asChild>
              <Link href={`/tariff/standard/${encodeURIComponent(card.depotCode)}/edit`}>
                <Icon name="edit" size={16} className="mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Depot</dt>
              <dd className="font-mono">{card.depotCode}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Country</dt>
              <dd>{depot?.country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Currency</dt>
              <dd>THB (internal)</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Card ID</dt>
              <dd className="gecko-text-mono text-xs">{card.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ChargesTable rows={card.rows} />

      <TariffCardFooter
        status={card.status}
        onClose={() => router.push("/tariff/standard")}
        onApprove={() => {
          standardTariffRepo.approve(card.id, "CURRENT-USER");
          router.refresh();
        }}
        onUnApprove={() => {
          standardTariffRepo.unapprove(card.id);
          router.refresh();
        }}
        audit={{
          createdBy: card.createdBy,
          createdOn: card.createdOn,
          modifiedBy: card.modifiedBy,
          modifiedOn: card.modifiedOn,
          approvedBy: card.approvedBy,
          approvedOn: card.approvedOn,
        }}
      />
    </AppShell>
  );
}
