import { parts as seedParts } from '@/data/seed/parts';
import type { Part } from '@/lib/types';

export interface PartRepo {
  list(): Part[];
  /** Look up by `sku` — parts use SKUs, not numeric ids. */
  get(sku: string): Part | undefined;
}

export class InMemoryPartRepo implements PartRepo {
  list(): Part[] {
    return seedParts;
  }
  get(sku: string): Part | undefined {
    return seedParts.find((p) => p.sku === sku);
  }
}
