import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RateCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  rate: string;
  unit: string;
  status: "active" | "inactive";
  iconToken?: string;
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
  iconToken = "var(--gecko-primary-600)",
  iconBgToken = "var(--gecko-primary-100)",
  onEdit,
  className,
}: RateCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow",
        status === "inactive" && "opacity-60",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                borderRadius: "var(--gecko-radius-lg)",
                padding: "var(--gecko-space-2)",
                background: iconBgToken,
              }}
            >
              <Icon style={{ height: 20, width: 20, color: iconToken }} />
            </div>
            <div>
              <h3
                style={{
                  fontWeight: "var(--gecko-font-weight-medium)",
                  color: "var(--gecko-text-primary)",
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {status === "active" ? "✓ Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p
            style={{
              fontSize: "var(--gecko-text-2xl)",
              fontWeight: "var(--gecko-font-weight-bold)",
              color: "var(--gecko-text-primary)",
            }}
          >
            {rate}
          </p>
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
