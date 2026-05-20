"use client";

import styles from "./severity-filter.module.css";

interface SeverityCount {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
}

const severityLabels: Record<SeverityCount["severity"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
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
        const isSelected = selected.length === 0 || selected.includes(severity);

        return (
          <button
            key={severity}
            onClick={() => toggleSeverity(severity)}
            className="mnr-severity-pill"
            data-selected={isSelected}
            data-severity={severity}
          >
            <span className={styles.dot} data-tone={severity} />
            <span className="mnr-severity-pill-label">{severityLabels[severity]}</span>
            <span className="mnr-severity-pill-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
