/**
 * Tariff status pill — Phase 7.9-B native gecko-pill primitives.
 * Renders as a gecko-pill in the matching tone.
 */
import type { TariffStatus } from "@/lib/types";

const TONE_CLASS: Record<TariffStatus, string> = {
  DRAFT: "gecko-pill gecko-pill-warning",
  APPROVED: "gecko-pill gecko-pill-success",
  EXPIRED: "gecko-pill gecko-pill-neutral",
};

export function TariffStatusBadge({ status }: { status: TariffStatus }) {
  return <span className={TONE_CLASS[status]}>{status}</span>;
}
