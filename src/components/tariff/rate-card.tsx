import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "./rate-card.module.css";

interface RateCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  rate: string;
  unit: string;
  status: "active" | "inactive";
  /** @deprecated unused — kept for backward compatibility. */
  iconToken?: string;
  /** @deprecated unused — kept for backward compatibility. */
  iconBgToken?: string;
  onEdit?: () => void;
  className?: string;
}

export function RateCard({
  icon: Icon,
  title,
  subtitle,
  rate,
  unit,
  status,
  onEdit,
  className,
}: RateCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow",
        status === "inactive" && "opacity-60",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={styles.iconBubble}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className={styles.title}>{title}</h3>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {status === "active" ? "✓ Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className={styles.rate}>{rate}</p>
          <p className="text-sm text-muted-foreground">{unit}</p>
        </div>
        {onEdit && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
