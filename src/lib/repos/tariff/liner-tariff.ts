import { linerTariffCards as seedLiner } from '@/data/seed/tariff/liner-tariff';
import type { LinerTariffCard } from '@/lib/types';

export interface LinerTariffRepo {
  list(): LinerTariffCard[];
  /** Look up active liner card for a given agent. */
  byAgent(agentCode: string): LinerTariffCard | undefined;
  get(id: string): LinerTariffCard | undefined;
  create(card: LinerTariffCard): LinerTariffCard;
  update(id: string, patch: Partial<LinerTariffCard>): LinerTariffCard | undefined;
  /** Clone an existing card. New id, new quotation number, status reset to DRAFT, audit cleared. */
  clone(sourceId: string, targetAgentCode: string): LinerTariffCard | undefined;
  approve(id: string, approver: string, when?: string): LinerTariffCard | undefined;
  unapprove(id: string): LinerTariffCard | undefined;
  /** Generates the next `QU-YYYY-NNNNN` reference. */
  nextQuotationNo(year?: number): string;
}

export class InMemoryLinerTariffRepo implements LinerTariffRepo {
  list(): LinerTariffCard[] {
    return seedLiner;
  }
  byAgent(agentCode: string): LinerTariffCard | undefined {
    return seedLiner.find((c) => c.agentCode === agentCode);
  }
  get(id: string): LinerTariffCard | undefined {
    return seedLiner.find((c) => c.id === id);
  }
  create(card: LinerTariffCard): LinerTariffCard {
    if (seedLiner.some((c) => c.id === card.id)) {
      throw new Error(`Liner tariff ${card.id} already exists`);
    }
    seedLiner.push(card);
    return card;
  }
  update(id: string, patch: Partial<LinerTariffCard>): LinerTariffCard | undefined {
    const idx = seedLiner.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const merged = { ...seedLiner[idx], ...patch, id };
    seedLiner[idx] = merged as LinerTariffCard;
    return merged as LinerTariffCard;
  }
  clone(sourceId: string, targetAgentCode: string): LinerTariffCard | undefined {
    const src = this.get(sourceId);
    if (!src) return undefined;
    const today = new Date().toISOString().slice(0, 10);
    const cloned: LinerTariffCard = {
      ...src,
      id: `LNR-${targetAgentCode.replace(/^C-/, '')}-DRAFT-${Date.now()}`,
      agentCode: targetAgentCode,
      quotationNo: '', // assigned on save
      status: 'DRAFT',
      approvedBy: undefined,
      approvedOn: undefined,
      createdOn: today,
      modifiedBy: undefined,
      modifiedOn: undefined,
      rows: src.rows.map((row, i) => ({ ...row, id: `r-${i + 1}` })),
    };
    return cloned;
  }
  approve(id: string, approver: string, when: string = new Date().toISOString().slice(0, 10)): LinerTariffCard | undefined {
    return this.update(id, { status: 'APPROVED', approvedBy: approver, approvedOn: when });
  }
  unapprove(id: string): LinerTariffCard | undefined {
    return this.update(id, { status: 'DRAFT', approvedBy: undefined, approvedOn: undefined });
  }
  nextQuotationNo(year: number = new Date().getFullYear()): string {
    const prefix = `QU-${year}-`;
    const existing = seedLiner
      .map((c) => c.quotationNo)
      .filter((q) => q.startsWith(prefix))
      .map((q) => parseInt(q.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    return `${prefix}${String(next).padStart(5, '0')}`;
  }
}
