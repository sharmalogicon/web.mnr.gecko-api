import { emergencyJobs as seedEmergency } from '@/data/seed/emergency';
import type { EmergencyJob } from '@/lib/types';

export interface EmergencyRepo {
  list(): EmergencyJob[];
  /** Look up by `reference` (e.g. 'EMG-2026-0042'). */
  get(reference: string): EmergencyJob | undefined;
}

export class InMemoryEmergencyRepo implements EmergencyRepo {
  list(): EmergencyJob[] {
    return seedEmergency;
  }
  get(reference: string): EmergencyJob | undefined {
    return seedEmergency.find((e) => e.reference === reference);
  }
}
