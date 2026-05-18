"use client";

import { cn } from "@/lib/utils";

interface SeverityCount {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
}

const severityConfig: Record<
  SeverityCount["severity"],
  { label: string; dot: string; text: string; bg: string; bgHover: string; border: string }
> = {
  critical: {
    label: "Critical",
    dot: "var(--gecko-error-500)",
    text: "var(--gecko-error-600)",
    bg: "var(--gecko-error-50)",
    bgHover: "var(--gecko-error-100)",
    border: "var(--gecko-error-200)",
  },
  high: {
    label: "High",
    dot: "var(--gecko-accent-500)",
    text: "var(--gecko-accent-600)",
    bg: "var(--gecko-accent-50)",
    bgHover: "var(--gecko-accent-100)",
    border: "var(--gecko-accent-200)",
  },
  medium: {
    label: "Medium",
    dot: "var(--gecko-warning-500)",
    text: "var(--gecko-warning-600)",
    bg: "var(--gecko-warning-50)",
    bgHover: "var(--gecko-warning-100)",
    border: "var(--gecko-warning-200)",
  },
  low: {
    label: "Low",
    dot: "var(--gecko-success-500)",
    text: "var(--gecko-success-600)",
    bg: "var(--gecko-success-50)",
    bgHover: "var(--gecko-success-100)",
    border: "var(--gecko-success-200)",
  },
};

interface SeverityFilterProps {
  counts: SeverityCount[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function SeverityFilter({
  counts,
  selected,
  onChange,
}: SeverityFilterProps) {
  const toggleSeverity = (severity: string) => {
    if (selected.includes(severity)) {
      onChange(selected.filter((s) => s !== severity));
    } else {
      onChange([...selected, severity]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {counts.map(({ severity, count }) => {
        const config = severityConfig[severity];
        const isSelected = selected.length === 0 || selected.includes(severity);

        return (
          <button
            key={severity}
            onClick={() => toggleSeverity(severity)}
            className="mnr-severity-pill"
            data-selected={isSelected}
            style={{
              ["--pill-bg" as any]: config.bg,
              ["--pill-bg-hover" as any]: config.bgHover,
              ["--pill-border" as any]: config.border,
              ["--pill-text" as any]: config.text,
            }}
          >
            <span
              style={{
                height: 10,
                width: 10,
                borderRadius: "var(--gecko-radius-full)",
                background: config.dot,
                display: "inline-block",
              }}
            />
            <span className="mnr-severity-pill-label">{config.label}</span>
            <span className="mnr-severity-pill-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
