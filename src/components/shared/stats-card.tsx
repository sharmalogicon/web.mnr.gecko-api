"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

import styles from "./stats-card.module.css";

type StatsColor = "default" | "blue" | "green" | "amber" | "red" | "purple";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: StatsColor;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  onClick?: () => void;
  active?: boolean;
}

const ICON_BUBBLE_CLASS: Record<StatsColor, string> = {
  default: styles.iconBubbleDefault,
  blue: styles.iconBubbleBlue,
  green: styles.iconBubbleGreen,
  amber: styles.iconBubbleAmber,
  red: styles.iconBubbleRed,
  purple: styles.iconBubblePurple,
};

const VALUE_CLASS: Record<StatsColor, string> = {
  default: styles.valueDefault,
  blue: styles.valueBlue,
  green: styles.valueGreen,
  amber: styles.valueAmber,
  red: styles.valueRed,
  purple: styles.valuePurple,
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
  const trendClass =
    trend?.direction === "up"
      ? "gecko-text-success"
      : trend?.direction === "down"
        ? "gecko-text-danger"
        : "gecko-text-secondary";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "gecko-card",
        styles.card,
        onClick && "cursor-pointer",
        active && styles.cardActive,
      )}
    >
      {Icon && (
        <div className={cn(styles.iconBubble, ICON_BUBBLE_CLASS[color])}>
          <Icon size={20} />
        </div>
      )}
      <span className={cn(styles.value, VALUE_CLASS[color])}>{value}</span>
      <span className={styles.label}>{label}</span>
      {trend && (
        <span className={`${styles.trend} ${trendClass}`}>{trend.value}</span>
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
