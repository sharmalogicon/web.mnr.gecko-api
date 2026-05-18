import { modifications as seedModifications } from '@/data/seed/modification';
import type { ModificationJob } from '@/lib/types';

export interface ModificationRepo {
  list(): ModificationJob[];
  /** Look up by `reference` (e.g. 'MOD-2026-0042'). */
  get(reference: string): ModificationJob | undefined;
}

export class InMemoryModificationRepo implements ModificationRepo {
  list(): ModificationJob[] {
    return seedModifications;
  }
  get(reference: string): ModificationJob | undefined {
    return seedModifications.find((m) => m.reference === reference);
  }
}
