/**
 * Seed: Parts catalogue.
 * Plan 01.07, Task 1, Step G.
 *
 * Unit costs are realistic SE-Asia depot wholesale prices in THB. `cedexCode` links
 * each part to the CEDEX component code used in `repair.ts` line items, so a
 * future "auto-pick from catalogue" workflow can wire up trivially.
 *
 * Categories covered (7 distinct):
 *   panel, door, floor, gasket, reefer_unit, tank_valve, fastener
 */

export type PartCategory =
  | 'panel'
  | 'door'
  | 'floor'
  | 'gasket'
  | 'reefer_unit'
  | 'tank_valve'
  | 'fastener';

export interface Part {
  /** e.g. 'PRT-PAN-001'. */
  sku: string;
  /** Human-readable name. */
  name: string;
  category: PartCategory;
  unitCostThb: number;
  stockOnHand: number;
  /** Optional CEDEX component code linking to `repair.ts` line items. */
  cedexCode?: string;
}

export const parts: Part[] = [
  // ---- panel (3) ----
  { sku: 'PRT-PAN-001', name: "Corrugated side panel, 40'",           category: 'panel',       unitCostThb:  8500, stockOnHand: 12, cedexCode: 'SDR' },
  { sku: 'PRT-PAN-002', name: "Corrugated side panel, 20'",           category: 'panel',       unitCostThb:  5400, stockOnHand: 18, cedexCode: 'SDR' },
  { sku: 'PRT-PAN-003', name: 'Front-nose panel (universal)',         category: 'panel',       unitCostThb:  6750, stockOnHand:  9, cedexCode: 'FNX' },

  // ---- door (2) ----
  { sku: 'PRT-DOR-001', name: 'Door cam latch assembly',              category: 'door',        unitCostThb:  1200, stockOnHand: 28, cedexCode: 'CAM' },
  { sku: 'PRT-DOR-002', name: 'Door hinge set, full perimeter',       category: 'door',        unitCostThb:  2350, stockOnHand: 14, cedexCode: 'DRH' },

  // ---- floor (1) ----
  { sku: 'PRT-FLR-001', name: 'Apitong floor plank, 28 mm × 1220 mm', category: 'floor',       unitCostThb:   850, stockOnHand: 76, cedexCode: 'FLR' },

  // ---- gasket (1) ----
  { sku: 'PRT-GAS-001', name: "Door gasket, full perimeter, 40'",     category: 'gasket',      unitCostThb:  2400, stockOnHand: 18, cedexCode: 'GAS' },

  // ---- reefer_unit (3) ----
  { sku: 'PRT-REE-001', name: 'Carrier 69NT40 compressor (refurbished)', category: 'reefer_unit', unitCostThb: 145000, stockOnHand:  2, cedexCode: 'CMP' },
  { sku: 'PRT-REE-002', name: 'Star Cool SCI evaporator fan (460V)',  category: 'reefer_unit', unitCostThb:  5800, stockOnHand:  6, cedexCode: 'FAN' },
  { sku: 'PRT-REE-003', name: 'Reefer return-air sensor (Carrier)',   category: 'reefer_unit', unitCostThb:  4850, stockOnHand:  8, cedexCode: 'SNS' },

  // ---- tank_valve (2) ----
  { sku: 'PRT-VLV-001', name: 'T11 manlid pressure-relief valve, 4 bar', category: 'tank_valve', unitCostThb:  4275, stockOnHand:  5, cedexCode: 'VLV' },
  { sku: 'PRT-VLV-002', name: 'Bottom-discharge ball valve, DN50, 316L', category: 'tank_valve', unitCostThb:  6100, stockOnHand:  4, cedexCode: 'VLV' },

  // ---- fastener (1) ----
  { sku: 'PRT-FAS-001', name: 'Twist-lock corner casting bolt M16, grade 8.8', category: 'fastener', unitCostThb:    85, stockOnHand: 420 },
];
