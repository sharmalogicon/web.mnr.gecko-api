/**
 * Shared seed: Surveyor registry.
 * Source of truth: UI-SPEC §9.4 (10 plausibly SE-Asian surveyor names).
 *
 * Names are literal — auditor (plan 10) greps for these strings. Per UI-SPEC,
 * `Nguyen Van An` is modelled as VN-expat based in TH, hence homeCountry: 'TH'.
 * All other names align with their natural country.
 *
 * IICL-6 is the baseline container-survey qualification; ATP is the additional
 * reefer/perishables transport qualification.
 */

export interface Surveyor {
  /** `SRV-NNN` zero-padded sequence. */
  id: string;
  /** Human-readable name. Literal per UI-SPEC §9.4. */
  name: string;
  homeCountry: 'TH' | 'MY' | 'SG';
  /** e.g. ['IICL-6'] or ['IICL-6', 'ATP']. */
  certifications: string[];
}

/** 10 plausibly SE-Asian surveyor names per UI-SPEC §9.4. */
export const surveyors: Surveyor[] = [
  { id: 'SRV-001', name: 'Somchai Kraisorn',         homeCountry: 'TH', certifications: ['IICL-6'] },
  { id: 'SRV-002', name: 'Tan Wei Ming',             homeCountry: 'SG', certifications: ['IICL-6', 'ATP'] },
  { id: 'SRV-003', name: 'Ahmad bin Razak',          homeCountry: 'MY', certifications: ['IICL-6'] },
  { id: 'SRV-004', name: 'Nguyen Van An',            homeCountry: 'TH', certifications: ['IICL-6'] }, // VN-expat in TH per UI-SPEC
  { id: 'SRV-005', name: 'Prasong Suthikorn',        homeCountry: 'TH', certifications: ['IICL-6', 'ATP'] },
  { id: 'SRV-006', name: 'Lim Boon Keng',            homeCountry: 'SG', certifications: ['IICL-6'] },
  { id: 'SRV-007', name: 'Wira Hadi',                homeCountry: 'MY', certifications: ['IICL-6'] },
  { id: 'SRV-008', name: 'Apirak Chaiwan',           homeCountry: 'TH', certifications: ['IICL-6', 'ATP'] },
  { id: 'SRV-009', name: 'Goh Mei Ling',             homeCountry: 'SG', certifications: ['IICL-6'] },
  { id: 'SRV-010', name: 'Mohd Faizal bin Hashim',   homeCountry: 'MY', certifications: ['IICL-6'] },
];

export function getSurveyorById(id: string): Surveyor | undefined {
  return surveyors.find(s => s.id === id);
}
