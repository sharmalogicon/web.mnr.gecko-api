import { vendorTariffCards as seedVendor } from '@/data/seed/tariff/vendor-tariff';
import type { VendorTariffCard } from '@/lib/types';

export interface VendorTariffRepo {
  list(): VendorTariffCard[];
  byVendor(vendorId: string): VendorTariffCard | undefined;
  get(id: string): VendorTariffCard | undefined;
  create(card: VendorTariffCard): VendorTariffCard;
  update(id: string, patch: Partial<VendorTariffCard>): VendorTariffCard | undefined;
  approve(id: string, approver: string, when?: string): VendorTariffCard | undefined;
  unapprove(id: string): VendorTariffCard | undefined;
  /** Generates the next `VQ-YYYY-NNNNN` reference. */
  nextQuotationNo(year?: number): string;
}

export class InMemoryVendorTariffRepo implements VendorTariffRepo {
  list(): VendorTariffCard[] {
    return seedVendor;
  }
  byVendor(vendorId: string): VendorTariffCard | undefined {
    return seedVendor.find((c) => c.vendorId === vendorId);
  }
  get(id: string): VendorTariffCard | undefined {
    return seedVendor.find((c) => c.id === id);
  }
  create(card: VendorTariffCard): VendorTariffCard {
    if (seedVendor.some((c) => c.id === card.id)) {
      throw new Error(`Vendor tariff ${card.id} already exists`);
    }
    seedVendor.push(card);
    return card;
  }
  update(id: string, patch: Partial<VendorTariffCard>): VendorTariffCard | undefined {
    const idx = seedVendor.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const merged = { ...seedVendor[idx], ...patch, id };
    seedVendor[idx] = merged as VendorTariffCard;
    return merged as VendorTariffCard;
  }
  approve(id: string, approver: string, when: string = new Date().toISOString().slice(0, 10)): VendorTariffCard | undefined {
    return this.update(id, { status: 'APPROVED', approvedBy: approver, approvedOn: when });
  }
  unapprove(id: string): VendorTariffCard | undefined {
    return this.update(id, { status: 'DRAFT', approvedBy: undefined, approvedOn: undefined });
  }
  nextQuotationNo(year: number = new Date().getFullYear()): string {
    const prefix = `VQ-${year}-`;
    const existing = seedVendor
      .map((c) => c.quotationNo)
      .filter((q) => q.startsWith(prefix))
      .map((q) => parseInt(q.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    return `${prefix}${String(next).padStart(5, '0')}`;
  }
}
