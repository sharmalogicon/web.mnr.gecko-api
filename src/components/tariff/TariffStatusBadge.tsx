import { Badge } from "@/components/ui/badge";
import type { TariffStatus } from "@/lib/types";

const TONE: Record<TariffStatus, { background: string; color: string; label: string }> = {
  DRAFT:    { background: "var(--gecko-warning-100)", color: "var(--gecko-warning-800)", label: "DRAFT" },
  APPROVED: { background: "var(--gecko-success-100)", color: "var(--gecko-success-800)", label: "APPROVED" },
  EXPIRED:  { background: "var(--gecko-gray-100)",    color: "var(--gecko-gray-700)",    label: "EXPIRED" },
};

export function TariffStatusBadge({ status }: { status: TariffStatus }) {
  const t = TONE[status];
  return (
    <Badge
      style={{
        background: t.background,
        color: t.color,
        fontWeight: "var(--gecko-font-weight-semibold)",
      }}
    >
      {t.label}
    </Badge>
  );
}
