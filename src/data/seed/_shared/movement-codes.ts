/**
 * Shared seed: tariff movement-code catalogue.
 * Phase 7 D-03.
 *
 * Describes the physical movement involved when the charge applies.
 */

export interface MovementCode {
  code: string;
  label: string;
}

export const movementCodes: MovementCode[] = [
  { code: 'FULL IN',   label: 'Full container — gate in' },
  { code: 'FULL OUT',  label: 'Full container — gate out' },
  { code: 'EMPTY IN',  label: 'Empty container — gate in' },
  { code: 'EMPTY OUT', label: 'Empty container — gate out' },
  { code: 'M&R MOVE',  label: 'Internal yard move for M&R' },
];

export function findMovementCode(code: string): MovementCode | undefined {
  return movementCodes.find((m) => m.code === code);
}
