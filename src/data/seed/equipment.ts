/**
 * Seed: Equipment master register.
 * Plan 01.07 (initial) + Plan 03.01 (schema extension for EQUIP-04/05/06).
 *
 * Every container.id passes `isValidContainerNumber` from `@/lib/iso6346/check-digit`.
 * The permanent CI guard at `equipment.validation.test.ts` enforces this on every CI run.
 *
 * Phase 3 additions:
 *   - EQUIP-04 universal physical specs: internal L×W×H, door opening, floor type
 *   - EQUIP-05 certifications: CSC plate ID, ACEP registration, next periodic
 *     exam, 5-year structural test, 2.5-year intermediate test
 *   - EQUIP-06 ATP plate validity on REEFER records only
 *
 * Cert date conventions: all dates are realistic — exams scheduled within the
 * next 30 months from 2026-05-18, structural tests within the last 60 months,
 * intermediate tests within the last 30 months, ATP plate within the next
 * 24 months on active reefers.
 */

import { isValidContainerNumber } from '@/lib/iso6346/check-digit';

export type EquipmentCategory = 'DRY' | 'TANK' | 'REEFER' | 'BULK' | 'FLAT' | 'OPEN-TOP';
export type EquipmentStatus = 'available' | 'in_service' | 'repair' | 'cleaning' | 'storage' | 'off_hire';
export type FloorType = 'hardwood' | 'plywood' | 'bamboo' | 'composite' | 'steel';

export interface EquipmentRecord {
  /** 11-char container number (BIC-valid), e.g. 'MSKU2345671'. */
  id: string;
  /** 4-letter BIC owner code, e.g. 'MSKU'. */
  ownerCode: string;
  /** 6-digit serial, e.g. '234567'. */
  serial: string;
  /** 0-9, computed via `computeCheckDigit`. */
  checkDigit: number;
  /** Human owner name from bicOwnerCodes registry. */
  ownerName: string;
  /** ISO 6346 size/type, e.g. '22G1'. FK to `isoSizeTypes`. */
  isoSizeType: string;
  category: EquipmentCategory;
  tareKg: number;
  maxGrossKg: number;
  /** maxGrossKg - tareKg. */
  payloadKg: number;
  cubeM3: number;
  /** FK to `depots[].code`. */
  depotCode: string;
  status: EquipmentStatus;
  /** ISO YYYY-MM-DD. */
  lastSurveyDate: string;

  // ---------- EQUIP-04 universal physical specs ----------
  /** Internal length in meters (e.g. 5.9 for 20'). */
  internalLengthM: number;
  /** Internal width in meters (e.g. 2.35). */
  internalWidthM: number;
  /** Internal height in meters (e.g. 2.39 / 2.69 HC). */
  internalHeightM: number;
  /** Door opening width in meters (manhole diameter on tanks). */
  doorOpeningWidthM: number;
  /** Door opening height in meters. */
  doorOpeningHeightM: number;
  floorType: FloorType;

  // ---------- EQUIP-05 certifications ----------
  /** CSC safety plate id, e.g. "CSC/TH/12-345/2025". */
  cscPlateId: string;
  /** ACEP scheme registration, e.g. "ACEP/TH/A12345-MSKU". */
  acepRegistration: string;
  /** Next periodic examination ISO date. */
  nextPeriodicExam: string;
  /** Most recent 5-year structural test ISO date. */
  structuralTestDate: string;
  /** Most recent 2.5-year intermediate test ISO date. */
  intermediateTestDate: string;

  // ---------- EQUIP-06 ATP plate (REEFER only) ----------
  /** ATP perishable-cargo plate validity (ISO date). Present only when category=REEFER. */
  atpPlateValidity?: string;

  // ---------- TANK-specific extensions ----------
  tankShellMaterial?: '316L stainless' | 'food-grade lined' | 'carbon steel';
  tankPressureBar?: number;
  tankCapacityL?: number;
  tankImoClass?: 'IMO 1' | 'IMO 2' | 'IMO 4' | 'T7';

  // ---------- REEFER-specific extensions ----------
  reeferRefrigerant?: 'R-134a' | 'R-513A' | 'R-404A';
  reeferUnitModel?: string;
  reeferSetpointMinC?: number;
  reeferSetpointMaxC?: number;
}

// Common dimension presets to keep records consistent
const DIM_20 = { internalLengthM: 5.90, internalWidthM: 2.35, internalHeightM: 2.39, doorOpeningWidthM: 2.34, doorOpeningHeightM: 2.28 };
const DIM_40 = { internalLengthM: 12.03, internalWidthM: 2.35, internalHeightM: 2.39, doorOpeningWidthM: 2.34, doorOpeningHeightM: 2.28 };
const DIM_40HC = { internalLengthM: 12.03, internalWidthM: 2.35, internalHeightM: 2.69, doorOpeningWidthM: 2.34, doorOpeningHeightM: 2.58 };
const DIM_20TANK = { internalLengthM: 5.90, internalWidthM: 2.35, internalHeightM: 2.39, doorOpeningWidthM: 0.50, doorOpeningHeightM: 0.50 };
const DIM_40TANK = { internalLengthM: 12.03, internalWidthM: 2.35, internalHeightM: 2.39, doorOpeningWidthM: 0.50, doorOpeningHeightM: 0.50 };
const DIM_20FLAT = { internalLengthM: 5.94, internalWidthM: 2.40, internalHeightM: 2.27, doorOpeningWidthM: 0, doorOpeningHeightM: 0 };
const DIM_20BULK = { internalLengthM: 5.94, internalWidthM: 2.35, internalHeightM: 2.39, doorOpeningWidthM: 0.45, doorOpeningHeightM: 0.45 };

export const equipment: EquipmentRecord[] = [
  // ============================================================================
  // DRY containers (10) — carriers
  // ============================================================================

  { id: 'MSKU2345671', ownerCode: 'MSKU', serial: '234567', checkDigit: 1, ownerName: 'Maersk Line',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'LCB', status: 'available', lastSurveyDate: '2026-04-10', ...DIM_20, floorType: 'hardwood',
    cscPlateId: 'CSC/TH/12-001/2025', acepRegistration: 'ACEP/TH/A12001-MSKU',
    nextPeriodicExam: '2027-04-10', structuralTestDate: '2023-04-10', intermediateTestDate: '2025-10-10' },

  { id: 'CMAU4129351', ownerCode: 'CMAU', serial: '412935', checkDigit: 1, ownerName: 'CMA CGM',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'LKR', status: 'in_service', lastSurveyDate: '2026-03-22', ...DIM_40, floorType: 'hardwood',
    cscPlateId: 'CSC/TH/15-203/2024', acepRegistration: 'ACEP/FR/B41295-CMA',
    nextPeriodicExam: '2027-03-22', structuralTestDate: '2022-03-22', intermediateTestDate: '2024-09-22' },

  { id: 'ONEU7865430', ownerCode: 'ONEU', serial: '786543', checkDigit: 0, ownerName: 'Ocean Network Express',
    isoSizeType: '45G1', category: 'DRY', tareKg: 3920, maxGrossKg: 32500, payloadKg: 28580, cubeM3: 76.4,
    depotCode: 'PKN', status: 'available', lastSurveyDate: '2026-04-30', ...DIM_40HC, floorType: 'hardwood',
    cscPlateId: 'CSC/MY/22-415/2025', acepRegistration: 'ACEP/JP/C78654-ONE',
    nextPeriodicExam: '2027-04-30', structuralTestDate: '2023-04-30', intermediateTestDate: '2025-10-30' },

  { id: 'HLXU5554326', ownerCode: 'HLXU', serial: '555432', checkDigit: 6, ownerName: 'Hapag-Lloyd',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'JUR', status: 'storage', lastSurveyDate: '2026-02-15', ...DIM_40, floorType: 'hardwood',
    cscPlateId: 'CSC/SG/05-512/2024', acepRegistration: 'ACEP/DE/D55543-HLAG',
    nextPeriodicExam: '2027-02-15', structuralTestDate: '2022-02-15', intermediateTestDate: '2024-08-15' },

  { id: 'EVRU9012346', ownerCode: 'EVRU', serial: '901234', checkDigit: 6, ownerName: 'Evergreen Marine',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'LCB', status: 'in_service', lastSurveyDate: '2026-04-02', ...DIM_20, floorType: 'hardwood',
    cscPlateId: 'CSC/TH/12-088/2025', acepRegistration: 'ACEP/TW/E90123-EVRG',
    nextPeriodicExam: '2027-04-02', structuralTestDate: '2023-04-02', intermediateTestDate: '2025-10-02' },

  { id: 'MSCU6789016', ownerCode: 'MSCU', serial: '678901', checkDigit: 6, ownerName: 'MSC Mediterranean Shipping',
    isoSizeType: '45G1', category: 'DRY', tareKg: 3920, maxGrossKg: 32500, payloadKg: 28580, cubeM3: 76.4,
    depotCode: 'PPP', status: 'available', lastSurveyDate: '2026-05-05', ...DIM_40HC, floorType: 'hardwood',
    cscPlateId: 'CSC/SG/05-771/2025', acepRegistration: 'ACEP/CH/F67890-MSC',
    nextPeriodicExam: '2027-05-05', structuralTestDate: '2023-05-05', intermediateTestDate: '2025-11-05' },

  { id: 'COSU3456783', ownerCode: 'COSU', serial: '345678', checkDigit: 3, ownerName: 'COSCO Shipping',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'PGU', status: 'repair', lastSurveyDate: '2026-03-08', ...DIM_40, floorType: 'plywood',
    cscPlateId: 'CSC/MY/22-301/2024', acepRegistration: 'ACEP/CN/G34567-COSCO',
    nextPeriodicExam: '2027-03-08', structuralTestDate: '2022-03-08', intermediateTestDate: '2024-09-08' },

  { id: 'FCIU2345676', ownerCode: 'FCIU', serial: '234567', checkDigit: 6, ownerName: 'Florens Container Services',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'LKR', status: 'available', lastSurveyDate: '2026-04-19', ...DIM_40, floorType: 'bamboo',
    cscPlateId: 'CSC/TH/15-440/2025', acepRegistration: 'ACEP/HK/H23456-FLOR',
    nextPeriodicExam: '2027-04-19', structuralTestDate: '2023-04-19', intermediateTestDate: '2025-10-19' },

  { id: 'YMLU6789013', ownerCode: 'YMLU', serial: '678901', checkDigit: 3, ownerName: 'Yang Ming',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'JUR', status: 'off_hire', lastSurveyDate: '2026-01-25', ...DIM_20, floorType: 'hardwood',
    cscPlateId: 'CSC/SG/05-228/2024', acepRegistration: 'ACEP/TW/J67890-YMLU',
    nextPeriodicExam: '2027-01-25', structuralTestDate: '2022-01-25', intermediateTestDate: '2024-07-25' },

  { id: 'HMMU9012342', ownerCode: 'HMMU', serial: '901234', checkDigit: 2, ownerName: 'HMM',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'PKW', status: 'in_service', lastSurveyDate: '2026-04-14', ...DIM_20, floorType: 'hardwood',
    cscPlateId: 'CSC/MY/22-619/2025', acepRegistration: 'ACEP/KR/K90123-HMM',
    nextPeriodicExam: '2027-04-14', structuralTestDate: '2023-04-14', intermediateTestDate: '2025-10-14' },

  // ============================================================================
  // TANK containers (4)
  // ============================================================================

  { id: 'TCNU8453210', ownerCode: 'TCNU', serial: '845321', checkDigit: 0, ownerName: 'Triton International',
    isoSizeType: '22T1', category: 'TANK', tareKg: 3850, maxGrossKg: 36000, payloadKg: 32150, cubeM3: 26.0,
    depotCode: 'LCB', status: 'cleaning', lastSurveyDate: '2026-04-05', ...DIM_20TANK, floorType: 'steel',
    cscPlateId: 'CSC/TH/12-715/2025', acepRegistration: 'ACEP/US/L84532-TRT',
    nextPeriodicExam: '2027-04-05', structuralTestDate: '2023-04-05', intermediateTestDate: '2025-10-05',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 26000, tankImoClass: 'IMO 1' },

  { id: 'BEAU2671941', ownerCode: 'BEAU', serial: '267194', checkDigit: 1, ownerName: 'Beacon Intermodal Leasing',
    isoSizeType: '22T6', category: 'TANK', tareKg: 4100, maxGrossKg: 34000, payloadKg: 29900, cubeM3: 25.0,
    depotCode: 'PGU', status: 'available', lastSurveyDate: '2026-04-18', ...DIM_20TANK, floorType: 'steel',
    cscPlateId: 'CSC/MY/22-832/2025', acepRegistration: 'ACEP/US/M26719-BEACON',
    nextPeriodicExam: '2027-04-18', structuralTestDate: '2023-04-18', intermediateTestDate: '2025-10-18',
    tankShellMaterial: 'food-grade lined', tankPressureBar: 6, tankCapacityL: 25000, tankImoClass: 'IMO 4' },

  { id: 'SEKU1234563', ownerCode: 'SEKU', serial: '123456', checkDigit: 3, ownerName: 'SeaCo Global',
    isoSizeType: '22T1', category: 'TANK', tareKg: 3850, maxGrossKg: 36000, payloadKg: 32150, cubeM3: 26.0,
    depotCode: 'LKR', status: 'in_service', lastSurveyDate: '2026-03-12', ...DIM_20TANK, floorType: 'steel',
    cscPlateId: 'CSC/TH/15-103/2024', acepRegistration: 'ACEP/UK/N12345-SEACO',
    nextPeriodicExam: '2027-03-12', structuralTestDate: '2022-03-12', intermediateTestDate: '2024-09-12',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 26000, tankImoClass: 'IMO 1' },

  { id: 'TCNU1122333', ownerCode: 'TCNU', serial: '112233', checkDigit: 3, ownerName: 'Triton International',
    isoSizeType: '42T1', category: 'TANK', tareKg: 5200, maxGrossKg: 36000, payloadKg: 30800, cubeM3: 32.0,
    depotCode: 'PPP', status: 'storage', lastSurveyDate: '2026-02-28', ...DIM_40TANK, floorType: 'steel',
    cscPlateId: 'CSC/SG/05-118/2024', acepRegistration: 'ACEP/US/L11223-TRT',
    nextPeriodicExam: '2027-02-28', structuralTestDate: '2022-02-28', intermediateTestDate: '2024-08-28',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 32000, tankImoClass: 'IMO 1' },

  // ============================================================================
  // REEFER containers (4) — ATP plate required (EQUIP-06)
  // ============================================================================

  { id: 'MNBU4598321', ownerCode: 'MNBU', serial: '459832', checkDigit: 1, ownerName: 'Maersk Reefer',
    isoSizeType: '42R1', category: 'REEFER', tareKg: 4800, maxGrossKg: 34000, payloadKg: 29200, cubeM3: 67.5,
    depotCode: 'LCB', status: 'available', lastSurveyDate: '2026-04-22', ...DIM_40, floorType: 'composite',
    cscPlateId: 'CSC/TH/12-908/2025', acepRegistration: 'ACEP/DK/P45983-MSKR',
    nextPeriodicExam: '2027-04-22', structuralTestDate: '2023-04-22', intermediateTestDate: '2025-10-22',
    atpPlateValidity: '2028-04-22',
    reeferRefrigerant: 'R-134a', reeferUnitModel: 'Carrier 69NT40', reeferSetpointMinC: -25, reeferSetpointMaxC: 25 },

  { id: 'MWCU6784034', ownerCode: 'MWCU', serial: '678403', checkDigit: 4, ownerName: 'Maersk Star Cool',
    isoSizeType: '45R1', category: 'REEFER', tareKg: 5100, maxGrossKg: 34000, payloadKg: 28900, cubeM3: 76.2,
    depotCode: 'PPP', status: 'in_service', lastSurveyDate: '2026-04-28', ...DIM_40HC, floorType: 'composite',
    cscPlateId: 'CSC/SG/05-967/2025', acepRegistration: 'ACEP/DK/Q67840-STARCOOL',
    nextPeriodicExam: '2027-04-28', structuralTestDate: '2023-04-28', intermediateTestDate: '2025-10-28',
    atpPlateValidity: '2028-04-28',
    reeferRefrigerant: 'R-513A', reeferUnitModel: 'Star Cool SCI', reeferSetpointMinC: -29, reeferSetpointMaxC: 30 },

  { id: 'TGHU5678908', ownerCode: 'TGHU', serial: '567890', checkDigit: 8, ownerName: 'Triton International (Reefer)',
    isoSizeType: '42R1', category: 'REEFER', tareKg: 4800, maxGrossKg: 34000, payloadKg: 29200, cubeM3: 67.5,
    depotCode: 'JUR', status: 'repair', lastSurveyDate: '2026-03-01', ...DIM_40, floorType: 'composite',
    cscPlateId: 'CSC/SG/05-340/2024', acepRegistration: 'ACEP/US/R56789-TRTRF',
    nextPeriodicExam: '2027-03-01', structuralTestDate: '2022-03-01', intermediateTestDate: '2024-09-01',
    atpPlateValidity: '2027-09-01',
    reeferRefrigerant: 'R-134a', reeferUnitModel: 'Carrier 69NT40', reeferSetpointMinC: -25, reeferSetpointMaxC: 25 },

  { id: 'ZIMU3456781', ownerCode: 'ZIMU', serial: '345678', checkDigit: 1, ownerName: 'ZIM',
    isoSizeType: '45R1', category: 'REEFER', tareKg: 5050, maxGrossKg: 34000, payloadKg: 28950, cubeM3: 76.0,
    depotCode: 'LCB', status: 'cleaning', lastSurveyDate: '2026-04-26', ...DIM_40HC, floorType: 'composite',
    cscPlateId: 'CSC/TH/12-456/2025', acepRegistration: 'ACEP/IL/S34567-ZIM',
    nextPeriodicExam: '2027-04-26', structuralTestDate: '2023-04-26', intermediateTestDate: '2025-10-26',
    atpPlateValidity: '2028-04-26',
    reeferRefrigerant: 'R-404A', reeferUnitModel: 'Thermo King MAGNUM', reeferSetpointMinC: -29, reeferSetpointMaxC: 25 },

  // ============================================================================
  // Stubs (BULK / FLAT — selectable per EQUIP-03, no dedicated workflow in v1)
  // ============================================================================

  { id: 'CARU4567897', ownerCode: 'CARU', serial: '456789', checkDigit: 7, ownerName: 'Caribbean Container Services',
    isoSizeType: '22P1', category: 'FLAT', tareKg: 2880, maxGrossKg: 30480, payloadKg: 27600, cubeM3: 0,
    depotCode: 'PKN', status: 'available', lastSurveyDate: '2026-03-30', ...DIM_20FLAT, floorType: 'hardwood',
    cscPlateId: 'CSC/MY/22-456/2025', acepRegistration: 'ACEP/BS/T45678-CARRIB',
    nextPeriodicExam: '2027-03-30', structuralTestDate: '2023-03-30', intermediateTestDate: '2025-09-30' },

  { id: 'FCIU9988777', ownerCode: 'FCIU', serial: '998877', checkDigit: 7, ownerName: 'Florens Container Services',
    isoSizeType: '22B1', category: 'BULK', tareKg: 2450, maxGrossKg: 30480, payloadKg: 28030, cubeM3: 30.5,
    depotCode: 'PKW', status: 'storage', lastSurveyDate: '2026-02-10', ...DIM_20BULK, floorType: 'steel',
    cscPlateId: 'CSC/MY/22-998/2024', acepRegistration: 'ACEP/HK/U99887-FLOR',
    nextPeriodicExam: '2027-02-10', structuralTestDate: '2022-02-10', intermediateTestDate: '2024-08-10' },
];

// Self-validate at module load (dev only). If any container number has an invalid
// BIC check digit, throw early — caught immediately when the seed is imported.
if (process.env.NODE_ENV !== 'production') {
  for (const r of equipment) {
    if (!isValidContainerNumber(r.id)) {
      throw new Error(
        `[seed] equipment[${r.id}] has invalid BIC check digit — fix in src/data/seed/equipment.ts`,
      );
    }
  }
}
