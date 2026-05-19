/**
 * Shared seed: tariff order-type catalogue.
 * Phase 7 D-03.
 *
 * Depot-flavoured (simpler than TOS's terminal-shaped CY/CY-IN universe).
 * An order type describes the operational context the charge applies to.
 */

export interface OrderType {
  code: string;
  label: string;
  notes?: string;
}

export const orderTypes: OrderType[] = [
  { code: 'M&R-IN',       label: 'M&R — inbound',           notes: 'Container arrives at depot for M&R work' },
  { code: 'M&R-OUT',      label: 'M&R — outbound',          notes: 'Container released after M&R work' },
  { code: 'REPAIR-ONLY',  label: 'Repair only (in-yard)',   notes: 'Already at depot; repair scoped, no gate move' },
  { code: 'PTI-ONLY',     label: 'PTI only',                notes: 'Reefer Pre-Trip Inspection visit' },
  { code: 'STORAGE',      label: 'Storage',                 notes: 'Hold container in yard for daily-rate billing' },
  { code: 'EMERGENCY',    label: 'Emergency callout',       notes: 'After-hours / urgent response' },
];

export function findOrderType(code: string): OrderType | undefined {
  return orderTypes.find((o) => o.code === code);
}
