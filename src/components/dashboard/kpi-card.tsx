"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";

import styles from "./kpi-card.module.css";

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
  const trendClass =
    trend?.direction === "up"
      ? "gecko-text-success"
      : trend?.direction === "down"
        ? "gecko-text-danger"
        : "gecko-text-secondary";

  return (
    <div className={cn("gecko-card", styles.root, className)}>
      <div className={styles.head}>
        <div className={styles.iconBubble}>
          <Icon size={20} />
        </div>
        <span className={styles.title}>{title}</span>
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className={styles.breakdown}>
          {breakdown.map((item, index) => (
            <span key={index}>
              {item.label}:{" "}
              <span className={styles.breakdownValue}>{item.value}</span>
            </span>
          ))}
        </div>
      )}

      {trend && (
        <div className={`${styles.trend} ${trendClass}`}>
          {trend.direction === "up" && <ArrowUp size={16} />}
          {trend.direction === "down" && <ArrowDown size={16} />}
          <span>{trend.value}</span>
          {trend.label && <span className={styles.trendLabel}>{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
