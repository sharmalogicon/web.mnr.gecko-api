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

// Maps domain status → gecko-badge variant + dot color class. Keeps the
// status palette consistent with the rest of the gecko design system.
const STATUS_MAP: Record<StatusType, { gecko: string; dotClass: string; label: string }> = {
  pending:     { gecko: "gecko-badge-warning", dotClass: "gecko-status-dot-warning", label: "Pending" },
  in_progress: { gecko: "gecko-badge-info",    dotClass: "gecko-status-dot-info",    label: "In Progress" },
  completed:   { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Completed" },
  passed:      { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Passed" },
  failed:      { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Failed" },
  conditional: { gecko: "gecko-badge-accent",  dotClass: "gecko-status-dot-accent",  label: "Conditional" },
  queued:      { gecko: "gecko-badge-gray",    dotClass: "gecko-status-dot-neutral", label: "Queued" },
  cancelled:   { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Cancelled" },
  assigned:    { gecko: "gecko-badge-primary", dotClass: "gecko-status-dot-primary", label: "Assigned" },
  certified:   { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Certified" },
  approved:    { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Approved" },
  rejected:    { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Rejected" },
  draft:       { gecko: "gecko-badge-gray",    dotClass: "gecko-status-dot-neutral", label: "Draft" },
  shipped:     { gecko: "gecko-badge-info",    dotClass: "gecko-status-dot-info",    label: "Shipped" },
  received:    { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Received" },
  available:   { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Available" },
  occupied:    { gecko: "gecko-badge-info",    dotClass: "gecko-status-dot-info",    label: "Occupied" },
  maintenance: { gecko: "gecko-badge-warning", dotClass: "gecko-status-dot-warning", label: "Maintenance" },
  offline:     { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Offline" },
  paid:        { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Paid" },
  overdue:     { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Overdue" },
  active:      { gecko: "gecko-badge-error",   dotClass: "gecko-status-dot-danger",  label: "Active" },
  responding:  { gecko: "gecko-badge-info",    dotClass: "gecko-status-dot-info",    label: "Responding" },
  resolved:    { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "Resolved" },
  closed:      { gecko: "gecko-badge-gray",    dotClass: "gecko-status-dot-neutral", label: "Closed" },
  cleaning:    { gecko: "gecko-badge-info",    dotClass: "gecko-status-dot-info",    label: "Cleaning" },
  repair:      { gecko: "gecko-badge-accent",  dotClass: "gecko-status-dot-accent",  label: "Repair" },
  in_service:  { gecko: "gecko-badge-success", dotClass: "gecko-status-dot-success", label: "In Service" },
  storage:     { gecko: "gecko-badge-accent",  dotClass: "gecko-status-dot-accent",  label: "Storage" },
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
        <span className={`gecko-status-dot ${meta.dotClass}`} aria-hidden="true" />
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
