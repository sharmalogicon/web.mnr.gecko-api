import { repairs as seedRepairs } from '@/data/seed/repair';
import type { RepairJob } from '@/lib/types';

export interface RepairRepo {
  list(): RepairJob[];
  /** Look up by `reference` (e.g. 'REP-2026-0042'). */
  get(reference: string): RepairJob | undefined;
  create(record: RepairJob): RepairJob;
  update(reference: string, patch: Partial<RepairJob>): RepairJob | undefined;
  /**
   * Generates the next `REP-YYYY-NNNN` reference based on existing records.
   * Pure helper so the form can preview the eventual id.
   */
  nextReference(year?: number): string;
}

export class InMemoryRepairRepo implements RepairRepo {
  list(): RepairJob[] {
    return seedRepairs;
  }
  get(reference: string): RepairJob | undefined {
    return seedRepairs.find((r) => r.reference === reference);
  }
  create(record: RepairJob): RepairJob {
    if (seedRepairs.some((r) => r.reference === record.reference)) {
      throw new Error(`Repair ${record.reference} already exists`);
    }
    seedRepairs.push(record);
    return record;
  }
  update(reference: string, patch: Partial<RepairJob>): RepairJob | undefined {
    const idx = seedRepairs.findIndex((r) => r.reference === reference);
    if (idx === -1) return undefined;
    const merged = { ...seedRepairs[idx], ...patch, reference };
    seedRepairs[idx] = merged as RepairJob;
    return merged as RepairJob;
  }
  nextReference(year: number = new Date().getFullYear()): string {
    const prefix = `REP-${year}-`;
    const existing = seedRepairs
      .map((r) => r.reference)
      .filter((ref) => ref.startsWith(prefix))
      .map((ref) => parseInt(ref.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
