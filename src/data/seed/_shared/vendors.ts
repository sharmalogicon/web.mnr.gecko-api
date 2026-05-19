/**
 * Shared seed: vendor master.
 * Phase 7 D-02.
 *
 * Third-party suppliers the depot outsources work to. Same shape as
 * `customers.ts` plus a vendor category for the future picker on
 * `/repair/new` when a line is outsourced.
 */

export type VendorCategory =
  | 'cleaning_specialist'
  | 'reefer_auth_dealer'
  | 'valve_test_shop'
  | 'heavy_lift'
  | 'atp_testing_lab'
  | 'paint_coating'
  | 'mobile_welding';

export interface Vendor {
  /** `V-{slug}` convention. */
  id: string;
  /** Human-readable name. */
  name: string;
  category: VendorCategory;
  country?: 'TH' | 'MY' | 'SG' | 'INTL';
  /** Operating contact phone (display-only). */
  contactNo?: string;
  /** Optional notes (specialization, certifications). */
  notes?: string;
}

/** 12 plausible SE-Asian / regional M&R vendors. */
export const vendors: Vendor[] = [
  { id: 'V-HAZCLEAN-TH', name: 'Bangkok Hazmat Cleaning Services',          category: 'cleaning_specialist', country: 'TH', contactNo: '02-589-4421', notes: 'IMO 1/2/4 chemical washout certified' },
  { id: 'V-FOOD-LCB',    name: 'Laem Chabang Food-Grade Wash Co.',           category: 'cleaning_specialist', country: 'TH', contactNo: '038-491-2310', notes: 'EFSIS member; food-grade only' },
  { id: 'V-CARRIER-TH',  name: 'Carrier Transicold Authorized Dealer (TH)',  category: 'reefer_auth_dealer',  country: 'TH', contactNo: '02-714-2200', notes: 'Carrier 69NT40 / StarCool authorized' },
  { id: 'V-TKING-MY',    name: 'Thermo King Service Center — Port Klang',    category: 'reefer_auth_dealer',  country: 'MY', contactNo: '03-3168-8900', notes: 'Thermo King MAGNUM / Precedent' },
  { id: 'V-VALVE-SG',    name: 'Singapore Tank Valve Test Shop',             category: 'valve_test_shop',     country: 'SG', contactNo: '+65 6862-1100', notes: 'On-site pressure + vacuum testing' },
  { id: 'V-VALVE-TH',    name: 'Eastern Seaboard Valve Services',            category: 'valve_test_shop',     country: 'TH', contactNo: '038-336-8800', notes: 'IMO 1/2/4 valve recert' },
  { id: 'V-CRANE-LCB',   name: 'Laem Chabang Mobile Crane Yard',             category: 'heavy_lift',          country: 'TH', contactNo: '038-407-1500', notes: '50T / 100T mobile cranes' },
  { id: 'V-CRANE-PKW',   name: 'Westport Heavy Lift Services',               category: 'heavy_lift',          country: 'MY', contactNo: '03-3168-1414' },
  { id: 'V-ATP-INTL',    name: 'TransFRIGOROUTE ATP Testing Lab',            category: 'atp_testing_lab',     country: 'INTL', contactNo: '+33 1-4456-2100', notes: 'ATP class FRC/RRC certification' },
  { id: 'V-PAINT-LKR',   name: 'Lat Krabang Marine Coating Co.',             category: 'paint_coating',       country: 'TH', contactNo: '02-360-1188', notes: 'Marine-grade epoxy + zinc-rich primer' },
  { id: 'V-WELD-PGU',    name: 'Pasir Gudang Mobile Welding',                category: 'mobile_welding',      country: 'MY', contactNo: '07-251-7700', notes: 'Certified welders, on-site rigs' },
  { id: 'V-WELD-JUR',    name: 'Jurong Marine Welding Services',             category: 'mobile_welding',      country: 'SG', contactNo: '+65 6261-3344' },
];

export function findVendor(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id);
}

export function vendorsByCategory(category: VendorCategory): Vendor[] {
  return vendors.filter((v) => v.category === category);
}
