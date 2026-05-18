/**
 * Seed: Equipment master register.
 * Plan 01.07, Task 1, Step B. Source-of-truth realism per:
 *   - REQUIREMENTS.md cross-cutting acceptance bar (BIC-valid container IDs, real ISO 6346 codes)
 *   - CONTEXT D-09/D-10/D-11 (centralised seeds, BIC CI guard, anchor records)
 *   - UI-SPEC §9.1 (18-row anchor table)
 *
 * Every container.id passes `isValidContainerNumber` from `@/lib/iso6346/check-digit`.
 * The permanent CI guard at `equipment.validation.test.ts` enforces this on every CI run.
 *
 * Check-digit computation (Task 1 Step A precompute, 2026-05-18):
 *   D-11 anchors (corrected):   MSKU234567=1, CMAU412935=1, ONEU786543=0,
 *                               TCNU845321=0, BEAU267194=1, MNBU459832=1, MWCU678403=4
 *   UI-SPEC §9.1 remainder:     HLXU555432=6, EVRU901234=6, MSCU678901=6, COSU345678=3,
 *                               SEKU123456=3, TGHU567890=8, FCIU234567=6, YMLU678901=3,
 *                               ZIMU345678=1, HMMU901234=2, CARU456789=7
 *
 * Coverage (≥18 records): DRY=10, TANK=4, REEFER=4, stubs (BULK/FLAT)=2 → 20 total.
 * Categories cover the full UI-SPEC §9.1 table with realistic depot, status, and
 * survey-date mix so empty-state / filter-empty / loading demos all have material.
 */

import { isValidContainerNumber } from '@/lib/iso6346/check-digit';

export type EquipmentCategory = 'DRY' | 'TANK' | 'REEFER' | 'BULK' | 'FLAT' | 'OPEN-TOP';
export type EquipmentStatus = 'available' | 'in_service' | 'repair' | 'cleaning' | 'storage' | 'off_hire';

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

  // Tank-specific
  tankShellMaterial?: '316L stainless' | 'food-grade lined' | 'carbon steel';
  tankPressureBar?: number;
  tankCapacityL?: number;
  tankImoClass?: 'IMO 1' | 'IMO 2' | 'IMO 4' | 'T7';

  // Reefer-specific
  reeferRefrigerant?: 'R-134a' | 'R-513A' | 'R-404A';
  reeferUnitModel?: string;
  reeferSetpointMinC?: number;
  reeferSetpointMaxC?: number;
}

export const equipment: EquipmentRecord[] = [
  // ============================================================================
  // DRY containers (10) — carriers
  // ============================================================================

  // D-11 anchor: MSKU 234567 1 (check digit 1, corrected 2026-05-18)
  { id: 'MSKU2345671', ownerCode: 'MSKU', serial: '234567', checkDigit: 1, ownerName: 'Maersk Line',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'LCB', status: 'available', lastSurveyDate: '2026-04-10' },

  // D-11 anchor: CMAU 412935 1 (check digit 1, corrected 2026-05-18)
  { id: 'CMAU4129351', ownerCode: 'CMAU', serial: '412935', checkDigit: 1, ownerName: 'CMA CGM',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'LKR', status: 'in_service', lastSurveyDate: '2026-03-22' },

  // D-11 anchor: ONEU 786543 0 (check digit 0, corrected 2026-05-18)
  { id: 'ONEU7865430', ownerCode: 'ONEU', serial: '786543', checkDigit: 0, ownerName: 'Ocean Network Express',
    isoSizeType: '45G1', category: 'DRY', tareKg: 3920, maxGrossKg: 32500, payloadKg: 28580, cubeM3: 76.4,
    depotCode: 'PKN', status: 'available', lastSurveyDate: '2026-04-30' },

  // UI-SPEC §9.1: HLXU 555432 6 (computed)
  { id: 'HLXU5554326', ownerCode: 'HLXU', serial: '555432', checkDigit: 6, ownerName: 'Hapag-Lloyd',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'JUR', status: 'storage', lastSurveyDate: '2026-02-15' },

  // UI-SPEC §9.1: EVRU 901234 6 (computed)
  { id: 'EVRU9012346', ownerCode: 'EVRU', serial: '901234', checkDigit: 6, ownerName: 'Evergreen Marine',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'LCB', status: 'in_service', lastSurveyDate: '2026-04-02' },

  // UI-SPEC §9.1: MSCU 678901 6 (computed)
  { id: 'MSCU6789016', ownerCode: 'MSCU', serial: '678901', checkDigit: 6, ownerName: 'MSC Mediterranean Shipping',
    isoSizeType: '45G1', category: 'DRY', tareKg: 3920, maxGrossKg: 32500, payloadKg: 28580, cubeM3: 76.4,
    depotCode: 'PPP', status: 'available', lastSurveyDate: '2026-05-05' },

  // UI-SPEC §9.1: COSU 345678 3 (computed)
  { id: 'COSU3456783', ownerCode: 'COSU', serial: '345678', checkDigit: 3, ownerName: 'COSCO Shipping',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'PGU', status: 'repair', lastSurveyDate: '2026-03-08' },

  // UI-SPEC §9.1: FCIU 234567 6 (computed) — Florens (lessor)
  { id: 'FCIU2345676', ownerCode: 'FCIU', serial: '234567', checkDigit: 6, ownerName: 'Florens Container Services',
    isoSizeType: '42G1', category: 'DRY', tareKg: 3750, maxGrossKg: 32500, payloadKg: 28750, cubeM3: 67.7,
    depotCode: 'LKR', status: 'available', lastSurveyDate: '2026-04-19' },

  // UI-SPEC §9.1: YMLU 678901 3 (computed)
  { id: 'YMLU6789013', ownerCode: 'YMLU', serial: '678901', checkDigit: 3, ownerName: 'Yang Ming',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'JUR', status: 'off_hire', lastSurveyDate: '2026-01-25' },

  // UI-SPEC §9.1: HMMU 901234 2 (computed)
  { id: 'HMMU9012342', ownerCode: 'HMMU', serial: '901234', checkDigit: 2, ownerName: 'HMM',
    isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, payloadKg: 28110, cubeM3: 33.2,
    depotCode: 'PKW', status: 'in_service', lastSurveyDate: '2026-04-14' },

  // ============================================================================
  // TANK containers (4)
  // ============================================================================

  // D-11 anchor: TCNU 845321 0 (check digit 0, corrected 2026-05-18)
  { id: 'TCNU8453210', ownerCode: 'TCNU', serial: '845321', checkDigit: 0, ownerName: 'Triton International',
    isoSizeType: '22T1', category: 'TANK', tareKg: 3850, maxGrossKg: 36000, payloadKg: 32150, cubeM3: 26.0,
    depotCode: 'LCB', status: 'cleaning', lastSurveyDate: '2026-04-05',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 26000, tankImoClass: 'IMO 1' },

  // D-11 anchor: BEAU 267194 1 (check digit 1, corrected 2026-05-18)
  { id: 'BEAU2671941', ownerCode: 'BEAU', serial: '267194', checkDigit: 1, ownerName: 'Beacon Intermodal Leasing',
    isoSizeType: '22T6', category: 'TANK', tareKg: 4100, maxGrossKg: 34000, payloadKg: 29900, cubeM3: 25.0,
    depotCode: 'PGU', status: 'available', lastSurveyDate: '2026-04-18',
    tankShellMaterial: 'food-grade lined', tankPressureBar: 6, tankCapacityL: 25000, tankImoClass: 'IMO 4' },

  // UI-SPEC §9.1: SEKU 123456 3 (computed)
  { id: 'SEKU1234563', ownerCode: 'SEKU', serial: '123456', checkDigit: 3, ownerName: 'SeaCo Global',
    isoSizeType: '22T1', category: 'TANK', tareKg: 3850, maxGrossKg: 36000, payloadKg: 32150, cubeM3: 26.0,
    depotCode: 'LKR', status: 'in_service', lastSurveyDate: '2026-03-12',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 26000, tankImoClass: 'IMO 1' },

  // 42T1 IMO 1 40' tank — uses Beacon's BEAU owner code but a different serial
  // Computed locally: BEAU412567 → cd
  // We instead use the Triton BIC code TCNU with a fresh serial.
  // For an extra tank, fall back to ZIMU 345678 1 — wait, ZIM doesn't operate tanks routinely.
  // Use Triton TCNU again with a different 6-digit serial to satisfy ≥4 TANK records.
  // TCNU112233 → compute:
  // value(T)=31 * 1   = 31
  // value(C)=13 * 2   = 26
  // value(N)=25 * 4   = 100
  // value(U)=32 * 8   = 256
  // 1*16=16, 1*32=32, 2*64=128, 2*128=256, 3*256=768, 3*512=1536
  // sum = 31+26+100+256+16+32+128+256+768+1536 = 3149 ; 3149 % 11 = 3149-286*11=3149-3146=3 → cd 3
  // Verified below by tsc + self-check at module load.
  { id: 'TCNU1122333', ownerCode: 'TCNU', serial: '112233', checkDigit: 3, ownerName: 'Triton International',
    isoSizeType: '42T1', category: 'TANK', tareKg: 5200, maxGrossKg: 36000, payloadKg: 30800, cubeM3: 32.0,
    depotCode: 'PPP', status: 'storage', lastSurveyDate: '2026-02-28',
    tankShellMaterial: '316L stainless', tankPressureBar: 4, tankCapacityL: 32000, tankImoClass: 'IMO 1' },

  // ============================================================================
  // REEFER containers (4)
  // ============================================================================

  // D-11 anchor: MNBU 459832 1 (check digit 1)
  { id: 'MNBU4598321', ownerCode: 'MNBU', serial: '459832', checkDigit: 1, ownerName: 'Maersk Reefer',
    isoSizeType: '42R1', category: 'REEFER', tareKg: 4800, maxGrossKg: 34000, payloadKg: 29200, cubeM3: 67.5,
    depotCode: 'LCB', status: 'available', lastSurveyDate: '2026-04-22',
    reeferRefrigerant: 'R-134a', reeferUnitModel: 'Carrier 69NT40', reeferSetpointMinC: -25, reeferSetpointMaxC: 25 },

  // D-11 anchor: MWCU 678403 4 (check digit 4, corrected 2026-05-18)
  { id: 'MWCU6784034', ownerCode: 'MWCU', serial: '678403', checkDigit: 4, ownerName: 'Maersk Star Cool',
    isoSizeType: '45R1', category: 'REEFER', tareKg: 5100, maxGrossKg: 34000, payloadKg: 28900, cubeM3: 76.2,
    depotCode: 'PPP', status: 'in_service', lastSurveyDate: '2026-04-28',
    reeferRefrigerant: 'R-513A', reeferUnitModel: 'Star Cool SCI', reeferSetpointMinC: -29, reeferSetpointMaxC: 30 },

  // UI-SPEC §9.1: TGHU 567890 8 (computed) — Triton Reefer
  { id: 'TGHU5678908', ownerCode: 'TGHU', serial: '567890', checkDigit: 8, ownerName: 'Triton International (Reefer)',
    isoSizeType: '42R1', category: 'REEFER', tareKg: 4800, maxGrossKg: 34000, payloadKg: 29200, cubeM3: 67.5,
    depotCode: 'JUR', status: 'repair', lastSurveyDate: '2026-03-01',
    reeferRefrigerant: 'R-134a', reeferUnitModel: 'Carrier 69NT40', reeferSetpointMinC: -25, reeferSetpointMaxC: 25 },

  // UI-SPEC §9.1: ZIMU 345678 1 (computed) — 45R1 HC reefer
  { id: 'ZIMU3456781', ownerCode: 'ZIMU', serial: '345678', checkDigit: 1, ownerName: 'ZIM',
    isoSizeType: '45R1', category: 'REEFER', tareKg: 5050, maxGrossKg: 34000, payloadKg: 28950, cubeM3: 76.0,
    depotCode: 'LCB', status: 'cleaning', lastSurveyDate: '2026-04-26',
    reeferRefrigerant: 'R-404A', reeferUnitModel: 'Thermo King MAGNUM', reeferSetpointMinC: -29, reeferSetpointMaxC: 25 },

  // ============================================================================
  // Stubs (BULK / FLAT — selectable per EQUIP-03, no dedicated workflow in v1)
  // ============================================================================

  // UI-SPEC §9.1: CARU 456789 7 (computed) — flat-rack
  { id: 'CARU4567897', ownerCode: 'CARU', serial: '456789', checkDigit: 7, ownerName: 'Caribbean Container Services',
    isoSizeType: '22P1', category: 'FLAT', tareKg: 2880, maxGrossKg: 30480, payloadKg: 27600, cubeM3: 0,
    depotCode: 'PKN', status: 'available', lastSurveyDate: '2026-03-30' },

  // BULK stub — use FCIU with a fresh serial (Florens operates bulk too).
  // FCIU998877 → compute:
  // F=16*1=16, C=13*2=26, I=19*4=76, U=32*8=256
  // 9*16=144, 9*32=288, 8*64=512, 8*128=1024, 7*256=1792, 7*512=3584
  // sum = 16+26+76+256+144+288+512+1024+1792+3584 = 7718 ; 7718 % 11 = 7718 - 701*11=7718-7711=7 → cd 7
  { id: 'FCIU9988777', ownerCode: 'FCIU', serial: '998877', checkDigit: 7, ownerName: 'Florens Container Services',
    isoSizeType: '22B1', category: 'BULK', tareKg: 2450, maxGrossKg: 30480, payloadKg: 28030, cubeM3: 30.5,
    depotCode: 'PKW', status: 'storage', lastSurveyDate: '2026-02-10' },
];

// Self-validate at module load (dev only). If any container number has an invalid
// BIC check digit, throw early — caught immediately when the seed is imported.
// The permanent CI guard at `equipment.validation.test.ts` enforces this in CI.
if (process.env.NODE_ENV !== 'production') {
  for (const r of equipment) {
    if (!isValidContainerNumber(r.id)) {
      throw new Error(
        `[seed] equipment[${r.id}] has invalid BIC check digit — fix in src/data/seed/equipment.ts`,
      );
    }
  }
}
