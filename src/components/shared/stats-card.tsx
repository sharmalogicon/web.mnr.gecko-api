"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "default" | "blue" | "green" | "amber" | "red" | "purple";
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  onClick?: () => void;
  active?: boolean;
}

// Map abstract colour names to gecko token pairs. Pinning Tailwind palette
// utilities (bg-blue-100 etc.) is avoided because the gecko bundle owns the
// canonical scale — this keeps cards on-brand if the design system shifts.
const COLOR_TOKENS: Record<
  NonNullable<StatsCardProps["color"]>,
  { bg: string; text: string }
> = {
  default: { bg: "var(--gecko-gray-100)",    text: "var(--gecko-gray-700)" },
  blue:    { bg: "var(--gecko-primary-100)", text: "var(--gecko-primary-700)" },
  green:   { bg: "var(--gecko-success-100)", text: "var(--gecko-success-700)" },
  amber:   { bg: "var(--gecko-warning-100)", text: "var(--gecko-warning-700)" },
  red:     { bg: "var(--gecko-error-100)",   text: "var(--gecko-error-700)" },
  purple:  { bg: "var(--gecko-accent-100)",  text: "var(--gecko-accent-700)" },
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = "default",
  trend,
  onClick,
  active,
}: StatsCardProps) {
  const tokens = COLOR_TOKENS[color];
  const trendColor =
    trend?.direction === "up"
      ? "var(--gecko-success-600)"
      : trend?.direction === "down"
        ? "var(--gecko-error-600)"
        : "var(--gecko-text-secondary)";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn("gecko-card", onClick && "cursor-pointer")}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--gecko-space-4)",
        textAlign: "center",
        transition: "box-shadow var(--gecko-transition-fast), transform var(--gecko-transition-fast)",
        outline: active ? "2px solid var(--gecko-primary-500)" : "none",
        outlineOffset: active ? 2 : 0,
      }}
    >
      {Icon && (
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            height: 40,
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--gecko-radius-md)",
            background: tokens.bg,
          }}
        >
          <Icon style={{ height: 20, width: 20, color: tokens.text }} />
        </div>
      )}
      <span style={{ fontSize: 24, fontWeight: "var(--gecko-font-weight-bold)", color: tokens.text }}>
        {value}
      </span>
      <span style={{ fontSize: "var(--gecko-text-sm)", color: "var(--gecko-text-secondary)" }}>
        {label}
      </span>
      {trend && (
        <span style={{ marginTop: 4, fontSize: "var(--gecko-text-xs)", color: trendColor }}>
          {trend.value}
        </span>
      )}
    </button>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        columns === 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      )}
    >
      {children}
    </div>
  );
}
