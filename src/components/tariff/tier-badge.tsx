import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CustomerTier = "platinum" | "gold" | "silver" | "bronze" | "standard";

interface TierBadgeProps {
  tier: CustomerTier;
  className?: string;
  showIcon?: boolean;
}

const tierConfig: Record<
  CustomerTier,
  { label: string; icon: string; className: string; discount: string }
> = {
  platinum: {
    label: "Platinum",
    icon: "🥇",
    className: "gecko-badge-tier-platinum",
    discount: "20%",
  },
  gold: {
    label: "Gold",
    icon: "🥈",
    className: "gecko-badge-tier-gold",
    discount: "15%",
  },
  silver: {
    label: "Silver",
    icon: "🥉",
    className: "gecko-badge-tier-silver",
    discount: "10%",
  },
  bronze: {
    label: "Bronze",
    icon: "🏅",
    className: "gecko-badge-tier-bronze",
    discount: "5%",
  },
  standard: {
    label: "Standard",
    icon: "──",
    className: "gecko-badge-tier-standard",
    discount: "0%",
  },
};

export function TierBadge({ tier, className, showIcon = true }: TierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <Badge className={cn(config.className, className)}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
