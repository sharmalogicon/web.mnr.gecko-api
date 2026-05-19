/**
 * Shared seed: unit-of-measure catalogue for tariff charge rows.
 * Phase 7.7 D-17.
 *
 * Distinct from BillingUnit (which scopes the price unit — CONT/TEU/HOUR/etc).
 * UOM is for material/effort quantities inside a slab table.
 */

export interface Uom {
  code: string;
  label: string;
}

export const uoms: Uom[] = [
  { code: 'BAG', label: 'Bag' },
  { code: 'KG',  label: 'Kilogram' },
  { code: 'EA',  label: 'Each' },
  { code: 'M',   label: 'Metre' },
  { code: 'M2',  label: 'Square metre' },
  { code: 'L',   label: 'Litre' },
  { code: 'HR',  label: 'Hour' },
  { code: 'JOB', label: 'Per job (flat)' },
];

export function findUom(code: string): Uom | undefined {
  return uoms.find((u) => u.code === code);
}
