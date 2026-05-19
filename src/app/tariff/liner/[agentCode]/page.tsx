"use client";

/**
 * /tariff/liner/[agentCode] — view a liner tariff card.
 * Phase 7 D-02 + D-07 (clone).
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
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";

export default function LinerTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentCode = String(params?.agentCode ?? "");
  const card = linerTariffRepo.byAgent(agentCode);
  const liner = getCustomerByCode(agentCode);

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="Liner tariff not found"
          description={`No tariff configured for agent ${agentCode}.`}
          primary={{ label: "Back to Liner Tariffs", href: "/tariff/liner" }}
        />
      </AppShell>
    );
  }

  const onClone = () => {
    const cloned = linerTariffRepo.clone(card.id, agentCode);
    if (!cloned) return;
    linerTariffRepo.create(cloned);
    router.push(`/tariff/liner/${encodeURIComponent(agentCode)}/edit?cloneId=${encodeURIComponent(cloned.id)}`);
  };

  return (
    <AppShell>
      <Link href="/tariff/liner">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Liner Tariffs
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{liner?.name ?? card.agentCode}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono">{card.quotationNo || "—"}</span> ·{" "}
              Effective {card.effectiveDate} → {card.expiryDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TariffStatusBadge status={card.status} />
            <Button asChild>
              <Link href={`/tariff/liner/${encodeURIComponent(card.agentCode)}/edit`}>
                <Icon name="edit" size={16} className="mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Agent</dt>
              <dd className="font-mono">{card.agentCode}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Sales person</dt>
              <dd>{card.salesPerson}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Contact</dt>
              <dd className="gecko-text-mono text-xs">{card.contactNo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Tier</dt>
              <dd>{liner?.tier ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Free days grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Storage Free Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs uppercase text-muted-foreground mb-2">Full</h4>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left pb-1">Dir</th>
                    <th className="text-center pb-1">Normal</th>
                    <th className="text-center pb-1">Reefer</th>
                    <th className="text-center pb-1">DG</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1">Export</td>
                    <td className="text-center font-medium">{card.freeDays.fullExport.normal}</td>
                    <td className="text-center font-medium">{card.freeDays.fullExport.reefer}</td>
                    <td className="text-center font-medium">{card.freeDays.fullExport.dg}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Import</td>
                    <td className="text-center font-medium">{card.freeDays.fullImport.normal}</td>
                    <td className="text-center font-medium">{card.freeDays.fullImport.reefer}</td>
                    <td className="text-center font-medium">{card.freeDays.fullImport.dg}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-xs uppercase text-muted-foreground mb-2">Empty (import)</h4>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-center pb-1">Normal</th>
                    <th className="text-center pb-1">Reefer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-medium py-1">{card.freeDays.emptyImport.normal}</td>
                    <td className="text-center font-medium py-1">{card.freeDays.emptyImport.reefer}</td>
                  </tr>
                </tbody>
              </table>
              {card.waiveStorageForEmptyDmContainers && (
                <p className="text-xs mt-3 italic text-muted-foreground">
                  Storage waived for empty DM containers.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChargesTable rows={card.rows} />

      <TariffCardFooter
        status={card.status}
        onClose={() => router.push("/tariff/liner")}
        onApprove={() => {
          linerTariffRepo.approve(card.id, "CURRENT-USER");
          router.refresh();
        }}
        onUnApprove={() => {
          linerTariffRepo.unapprove(card.id);
          router.refresh();
        }}
        onClone={onClone}
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
