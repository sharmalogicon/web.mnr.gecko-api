"use client";

/**
 * /tariff/vendor/[vendorId] — view a vendor tariff card.
 * Phase 7 D-02.
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
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";

export default function VendorTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = String(params?.vendorId ?? "");
  const card = vendorTariffRepo.byVendor(vendorId);
  const vendor = findVendor(vendorId);

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="Vendor tariff not found"
          description={`No tariff configured for vendor ${vendorId}.`}
          primary={{ label: "Back to Vendor Tariffs", href: "/tariff/vendor" }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/tariff/vendor">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Vendor Tariffs
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{vendor?.name ?? card.vendorId}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono">{card.quotationNo || "—"}</span> ·{" "}
              {vendor?.category?.replace(/_/g, " ") ?? "—"} ·{" "}
              Effective {card.effectiveDate} → {card.expiryDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TariffStatusBadge status={card.status} />
            <Button asChild>
              <Link href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}/edit`}>
                <Icon name="edit" size={16} className="mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Vendor ID</dt>
              <dd className="font-mono text-xs">{card.vendorId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Country</dt>
              <dd>{vendor?.country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Procurement</dt>
              <dd>{card.procurementContact}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Contact</dt>
              <dd className="gecko-text-mono text-xs">{vendor?.contactNo ?? "—"}</dd>
            </div>
          </dl>
          {vendor?.notes && (
            <p className="text-sm text-muted-foreground mt-3 italic">{vendor.notes}</p>
          )}
        </CardContent>
      </Card>

      <ChargesTable rows={card.rows} />

      <TariffCardFooter
        status={card.status}
        onClose={() => router.push("/tariff/vendor")}
        onApprove={() => {
          vendorTariffRepo.approve(card.id, "CURRENT-USER");
          router.refresh();
        }}
        onUnApprove={() => {
          vendorTariffRepo.unapprove(card.id);
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
