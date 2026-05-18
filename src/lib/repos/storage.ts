import { storage as seedStorage } from '@/data/seed/storage';
import type { StorageRecord } from '@/lib/types';

export interface StorageRepo {
  list(): StorageRecord[];
  /** Look up by `reference` — storage records have no `id` field. */
  get(reference: string): StorageRecord | undefined;
}

export class InMemoryStorageRepo implements StorageRepo {
  list(): StorageRecord[] {
    return seedStorage;
  }
  get(reference: string): StorageRecord | undefined {
    return seedStorage.find((s) => s.reference === reference);
  }
}
