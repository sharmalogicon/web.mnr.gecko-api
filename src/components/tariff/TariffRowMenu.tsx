"use client";

/**
 * Row trailing "..." dropdown menu for the 3 tariff list pages.
 * Phase 7.7-O.
 *
 * Actions per lane:
 *   - View      → push detail page
 *   - Edit      → push edit page
 *   - Duplicate → liner only — clone + create + push to new edit page
 *   - Delete    → confirm + mark card EXPIRED (soft delete, audit trail)
 */

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  linerTariffRepo,
  standardTariffRepo,
  vendorTariffRepo,
} from "@/lib/repos";
import styles from "./TariffRowMenu.module.css";

export type TariffRowMenuLane = "standard" | "liner" | "vendor";

export interface TariffRowMenuProps {
  lane: TariffRowMenuLane;
  /** The card id (e.g. STD-LCB-2026) — used for the soft-delete repo.update call. */
  cardId: string;
  /** Route param used in URLs — depotCode / agentCode / vendorId. */
  routeParam: string;
}

function deleteByLane(lane: TariffRowMenuLane, cardId: string) {
  if (lane === "standard") return standardTariffRepo.update(cardId, { status: "EXPIRED" });
  if (lane === "liner") return linerTariffRepo.update(cardId, { status: "EXPIRED" });
  return vendorTariffRepo.update(cardId, { status: "EXPIRED" });
}

export function TariffRowMenu({ lane, cardId, routeParam }: TariffRowMenuProps) {
  const router = useRouter();
  const base = `/tariff/${lane}`;
  const encoded = encodeURIComponent(routeParam);

  const onView = () => router.push(`${base}/${encoded}`);
  const onEdit = () => router.push(`${base}/${encoded}/edit`);

  const onDuplicate = () => {
    if (lane !== "liner") return;
    const cloned = linerTariffRepo.clone(cardId, routeParam);
    if (!cloned) return;
    linerTariffRepo.create(cloned);
    router.push(`/tariff/liner/${encoded}/edit?cloneId=${encodeURIComponent(cloned.id)}`);
  };

  const onDelete = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("Delete this tariff card? This cannot be undone.");
    if (!ok) return;
    deleteByLane(lane, cardId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={styles.trigger}
          aria-label="Row actions"
        >
          <Icon name="moreHorizontal" size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onView}>
          <Icon name="eye" size={14} /> View
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Icon name="edit" size={14} /> Edit
        </DropdownMenuItem>
        {lane === "liner" && (
          <DropdownMenuItem onSelect={onDuplicate}>
            <Icon name="copy" size={14} /> Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Icon name="trash" size={14} /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
