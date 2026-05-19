/**
 * Shared seed: tariff cargo-category catalogue.
 * Phase 7 D-03.
 */

export type CargoCategory = 'GENERAL' | 'HAZMAT' | 'REEFER' | 'FOODGRADE';

export interface CargoCategoryEntry {
  code: CargoCategory;
  label: string;
}

export const cargoCategories: CargoCategoryEntry[] = [
  { code: 'GENERAL',   label: 'General cargo' },
  { code: 'HAZMAT',    label: 'Hazardous (IMO classed)' },
  { code: 'REEFER',    label: 'Reefer (perishable / ATP)' },
  { code: 'FOODGRADE', label: 'Food grade (tank)' },
];
