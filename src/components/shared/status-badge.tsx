"use client";

import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "in_progress"
  | "completed"
  | "passed"
  | "failed"
  | "conditional"
  | "queued"
  | "cancelled"
  | "assigned"
  | "certified"
  | "approved"
  | "rejected"
  | "draft"
  | "shipped"
  | "received"
  | "available"
  | "occupied"
  | "maintenance"
  | "offline"
  | "paid"
  | "overdue"
  | "active"
  | "responding"
  | "resolved"
  | "closed"
  | "cleaning"
  | "repair"
  | "in_service"
  | "storage";

// Maps domain status → gecko-badge variant + dot colour token. Keeps the
// status palette consistent with the rest of the gecko design system instead
// of pinning literal Tailwind colour utilities.
const STATUS_MAP: Record<StatusType, { gecko: string; dot: string; label: string }> = {
  pending:     { gecko: "gecko-badge-warning", dot: "var(--gecko-warning-500)", label: "Pending" },
  in_progress: { gecko: "gecko-badge-info",    dot: "var(--gecko-info-500)",    label: "In Progress" },
  completed:   { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Completed" },
  passed:      { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Passed" },
  failed:      { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Failed" },
  conditional: { gecko: "gecko-badge-accent",  dot: "var(--gecko-accent-500)",  label: "Conditional" },
  queued:      { gecko: "gecko-badge-gray",    dot: "var(--gecko-gray-500)",    label: "Queued" },
  cancelled:   { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Cancelled" },
  assigned:    { gecko: "gecko-badge-primary", dot: "var(--gecko-primary-500)", label: "Assigned" },
  certified:   { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Certified" },
  approved:    { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Approved" },
  rejected:    { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Rejected" },
  draft:       { gecko: "gecko-badge-gray",    dot: "var(--gecko-gray-500)",    label: "Draft" },
  shipped:     { gecko: "gecko-badge-info",    dot: "var(--gecko-info-500)",    label: "Shipped" },
  received:    { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Received" },
  available:   { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Available" },
  occupied:    { gecko: "gecko-badge-info",    dot: "var(--gecko-info-500)",    label: "Occupied" },
  maintenance: { gecko: "gecko-badge-warning", dot: "var(--gecko-warning-500)", label: "Maintenance" },
  offline:     { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Offline" },
  paid:        { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Paid" },
  overdue:     { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Overdue" },
  active:      { gecko: "gecko-badge-error",   dot: "var(--gecko-error-500)",   label: "Active" },
  responding:  { gecko: "gecko-badge-info",    dot: "var(--gecko-info-500)",    label: "Responding" },
  resolved:    { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "Resolved" },
  closed:      { gecko: "gecko-badge-gray",    dot: "var(--gecko-gray-500)",    label: "Closed" },
  cleaning:    { gecko: "gecko-badge-info",    dot: "var(--gecko-info-500)",    label: "Cleaning" },
  repair:      { gecko: "gecko-badge-accent",  dot: "var(--gecko-accent-500)",  label: "Repair" },
  in_service:  { gecko: "gecko-badge-success", dot: "var(--gecko-success-500)", label: "In Service" },
  storage:     { gecko: "gecko-badge-accent",  dot: "var(--gecko-accent-500)",  label: "Storage" },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
  const meta = STATUS_MAP[status];
  const displayLabel = label || meta?.label || status;

  if (!meta) {
    return <span className="gecko-badge gecko-badge-gray">{displayLabel}</span>;
  }

  return (
    <span className={cn("gecko-badge", meta.gecko)}>
      {showDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: meta.dot,
            display: "inline-block",
            marginRight: 4,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}

// Stock badge — quantity vs. minimum threshold.
type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const STOCK_MAP: Record<StockStatus, { gecko: string; label: string }> = {
  in_stock:     { gecko: "gecko-badge-success", label: "In Stock" },
  low_stock:    { gecko: "gecko-badge-warning", label: "Low Stock" },
  out_of_stock: { gecko: "gecko-badge-error",   label: "Out of Stock" },
};

interface StockBadgeProps {
  quantity: number;
  minimum: number;
}

export function StockBadge({ quantity, minimum }: StockBadgeProps) {
  const status: StockStatus =
    quantity === 0
      ? "out_of_stock"
      : quantity <= minimum
        ? "low_stock"
        : "in_stock";
  const meta = STOCK_MAP[status];

  return <span className={cn("gecko-badge", meta.gecko)}>{quantity}</span>;
}
