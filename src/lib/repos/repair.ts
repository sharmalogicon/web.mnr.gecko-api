import { repairs as seedRepairs } from '@/data/seed/repair';
import type { RepairJob } from '@/lib/types';

export interface RepairRepo {
  list(): RepairJob[];
  /** Look up by `reference` (e.g. 'REP-2026-0042'). */
  get(reference: string): RepairJob | undefined;
}

export class InMemoryRepairRepo implements RepairRepo {
  list(): RepairJob[] {
    return seedRepairs;
  }
  get(reference: string): RepairJob | undefined {
    return seedRepairs.find((r) => r.reference === reference);
  }
}
