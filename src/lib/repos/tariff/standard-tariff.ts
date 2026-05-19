import { standardTariffCards as seedStandard } from '@/data/seed/tariff/standard-tariff';
import type { StandardTariffCard } from '@/lib/types';

export interface StandardTariffRepo {
  list(): StandardTariffCard[];
  /** Lookup by depot code; one card per depot per Phase 7 D-01. */
  byDepot(depotCode: string): StandardTariffCard | undefined;
  get(id: string): StandardTariffCard | undefined;
  create(card: StandardTariffCard): StandardTariffCard;
  update(id: string, patch: Partial<StandardTariffCard>): StandardTariffCard | undefined;
  approve(id: string, approver: string, when?: string): StandardTariffCard | undefined;
  unapprove(id: string): StandardTariffCard | undefined;
}

export class InMemoryStandardTariffRepo implements StandardTariffRepo {
  list(): StandardTariffCard[] {
    return seedStandard;
  }
  byDepot(depotCode: string): StandardTariffCard | undefined {
    return seedStandard.find((c) => c.depotCode === depotCode);
  }
  get(id: string): StandardTariffCard | undefined {
    return seedStandard.find((c) => c.id === id);
  }
  create(card: StandardTariffCard): StandardTariffCard {
    if (seedStandard.some((c) => c.id === card.id)) {
      throw new Error(`Standard tariff ${card.id} already exists`);
    }
    seedStandard.push(card);
    return card;
  }
  update(id: string, patch: Partial<StandardTariffCard>): StandardTariffCard | undefined {
    const idx = seedStandard.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const merged = { ...seedStandard[idx], ...patch, id };
    seedStandard[idx] = merged as StandardTariffCard;
    return merged as StandardTariffCard;
  }
  approve(id: string, approver: string, when: string = new Date().toISOString().slice(0, 10)): StandardTariffCard | undefined {
    return this.update(id, { status: 'APPROVED', approvedBy: approver, approvedOn: when });
  }
  unapprove(id: string): StandardTariffCard | undefined {
    return this.update(id, { status: 'DRAFT', approvedBy: undefined, approvedOn: undefined });
  }
}
