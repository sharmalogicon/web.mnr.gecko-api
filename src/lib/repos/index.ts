// THE wiring file — DATA-02 single point of swap.
//
// To migrate any entity from in-memory to HTTP (or any future adapter):
//   1. Change the right-hand side of the corresponding `export const` below.
//   2. Done. No other file in the codebase constructs a repo instance.
//
// (Grep `new InMemory` to confirm — all hits should be in this file.)

import {
  InMemoryEquipmentRepo,
  type EquipmentRepo,
} from './equipment';
import { InMemoryRepairRepo, type RepairRepo } from './repair';
import { InMemorySurveyRepo, type SurveyRepo } from './survey';
import { InMemoryCleaningRepo, type CleaningRepo } from './cleaning';
import { InMemoryStorageRepo, type StorageRepo } from './storage';
import { InMemoryPartRepo, type PartRepo } from './parts';
import { InMemoryInvoiceRepo, type InvoiceRepo } from './billing';
import {
  InMemoryModificationRepo,
  type ModificationRepo,
} from './modification';
import { InMemoryEmergencyRepo, type EmergencyRepo } from './emergency';
import {
  InMemoryIntegrationRepo,
  type IntegrationRepo,
} from './integrations';
import { InMemoryUserRepo, type UserRepo } from './users';

import {
  InMemoryRateCardRepo,
  type RateCardRepo,
} from './tariff/rate-cards';
import {
  InMemoryCustomerRateRepo,
  type CustomerRateRepo,
} from './tariff/customer-rates';
import {
  InMemoryContractRepo,
  type ContractRepo,
} from './tariff/contracts';
import {
  InMemorySurchargeRepo,
  type SurchargeRepo,
} from './tariff/surcharges';
import {
  InMemoryTariffHistoryRepo,
  type TariffHistoryRepo,
} from './tariff/history';

// Phase 7 — 3-tier tariff repos (Standard / Liner / Vendor).
import {
  InMemoryStandardTariffRepo,
  type StandardTariffRepo,
} from './tariff/standard-tariff';
import {
  InMemoryLinerTariffRepo,
  type LinerTariffRepo,
} from './tariff/liner-tariff';
import {
  InMemoryVendorTariffRepo,
  type VendorTariffRepo,
} from './tariff/vendor-tariff';

// Main entity repos
export const equipmentRepo: EquipmentRepo = new InMemoryEquipmentRepo();
export const repairRepo: RepairRepo = new InMemoryRepairRepo();
export const surveyRepo: SurveyRepo = new InMemorySurveyRepo();
export const cleaningRepo: CleaningRepo = new InMemoryCleaningRepo();
export const storageRepo: StorageRepo = new InMemoryStorageRepo();
export const partRepo: PartRepo = new InMemoryPartRepo();
export const invoiceRepo: InvoiceRepo = new InMemoryInvoiceRepo();
export const modificationRepo: ModificationRepo = new InMemoryModificationRepo();
export const emergencyRepo: EmergencyRepo = new InMemoryEmergencyRepo();
export const integrationRepo: IntegrationRepo = new InMemoryIntegrationRepo();
export const userRepo: UserRepo = new InMemoryUserRepo();

// Tariff sub-domain repos (v1.0 — being retired through Phase 7; kept while
// legacy /rate-cards, /customer-rates, /contracts routes redirect).
export const rateCardRepo: RateCardRepo = new InMemoryRateCardRepo();
export const customerRateRepo: CustomerRateRepo = new InMemoryCustomerRateRepo();
export const contractRepo: ContractRepo = new InMemoryContractRepo();
export const surchargeRepo: SurchargeRepo = new InMemorySurchargeRepo();
export const historyRepo: TariffHistoryRepo = new InMemoryTariffHistoryRepo();

// Phase 7 — 3-tier tariff repos.
export const standardTariffRepo: StandardTariffRepo = new InMemoryStandardTariffRepo();
export const linerTariffRepo: LinerTariffRepo = new InMemoryLinerTariffRepo();
export const vendorTariffRepo: VendorTariffRepo = new InMemoryVendorTariffRepo();

// Re-export interfaces so consumers can type repo arguments / props
export type {
  EquipmentRepo,
  RepairRepo,
  SurveyRepo,
  CleaningRepo,
  StorageRepo,
  PartRepo,
  InvoiceRepo,
  ModificationRepo,
  EmergencyRepo,
  IntegrationRepo,
  UserRepo,
  StandardTariffRepo,
  LinerTariffRepo,
  VendorTariffRepo,
  RateCardRepo,
  CustomerRateRepo,
  ContractRepo,
  SurchargeRepo,
  TariffHistoryRepo,
};
