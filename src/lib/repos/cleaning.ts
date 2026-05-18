import { cleaningJobs as seedCleaning } from '@/data/seed/cleaning';
import type { CleaningJob } from '@/lib/types';

export interface CleaningRepo {
  list(): CleaningJob[];
  /** Look up by `reference` (e.g. 'CLN-2026-0042'). */
  get(reference: string): CleaningJob | undefined;
}

export class InMemoryCleaningRepo implements CleaningRepo {
  list(): CleaningJob[] {
    return seedCleaning;
  }
  get(reference: string): CleaningJob | undefined {
    return seedCleaning.find((c) => c.reference === reference);
  }
}
