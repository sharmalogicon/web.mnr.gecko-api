"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  breakdown?: { label: string; value: string | number }[];
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  breakdown,
  className,
}: KpiCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "var(--gecko-success-600)"
      : trend?.direction === "down"
        ? "var(--gecko-error-600)"
        : "var(--gecko-text-secondary)";

  return (
    <div className={cn("gecko-card", className)} style={{ padding: "var(--gecko-space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 40,
            width: 40,
            borderRadius: "var(--gecko-radius-md)",
            background: "var(--gecko-primary-50)",
          }}
        >
          <Icon style={{ height: 20, width: 20, color: "var(--gecko-primary-600)" }} />
        </div>
        <span
          style={{
            fontSize: "var(--gecko-text-sm)",
            fontWeight: 500,
            color: "var(--gecko-text-secondary)",
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: "var(--gecko-font-weight-bold)",
            color: "var(--gecko-text-primary)",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {subtitle && (
          <span
            style={{
              marginLeft: 8,
              fontSize: "var(--gecko-text-sm)",
              color: "var(--gecko-text-secondary)",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            columnGap: 16,
            rowGap: 4,
            fontSize: "var(--gecko-text-sm)",
            color: "var(--gecko-text-secondary)",
          }}
        >
          {breakdown.map((item, index) => (
            <span key={index}>
              {item.label}:{" "}
              <span style={{ fontWeight: 500, color: "var(--gecko-text-primary)" }}>
                {item.value}
              </span>
            </span>
          ))}
        </div>
      )}

      {trend && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            fontSize: "var(--gecko-text-sm)",
            color: trendColor,
          }}
        >
          {trend.direction === "up" && <ArrowUp style={{ marginRight: 4, height: 16, width: 16 }} />}
          {trend.direction === "down" && <ArrowDown style={{ marginRight: 4, height: 16, width: 16 }} />}
          <span>{trend.value}</span>
          {trend.label && (
            <span style={{ marginLeft: 4, color: "var(--gecko-text-secondary)" }}>
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
