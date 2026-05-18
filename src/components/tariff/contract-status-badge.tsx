import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ContractStatus = "draft" | "active" | "expiring" | "expired" | "cancelled";

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

const statusConfig: Record<
  ContractStatus,
  {
    label: string;
    icon: string;
    variant: "secondary" | "success" | "warning" | "destructive";
  }
> = {
  draft: {
    label: "Draft",
    icon: "◐",
    variant: "secondary",
  },
  active: {
    label: "Active",
    icon: "✓",
    variant: "success",
  },
  expiring: {
    label: "Expiring",
    icon: "⚠️",
    variant: "warning",
  },
  expired: {
    label: "Expired",
    icon: "✗",
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: "○",
    variant: "secondary",
  },
};

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
