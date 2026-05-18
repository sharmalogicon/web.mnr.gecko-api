import { contracts as seedContracts } from '@/data/seed/tariff/contracts';
import type { Contract } from '@/lib/types';

export interface ContractRepo {
  list(): Contract[];
  get(id: string): Contract | undefined;
}

export class InMemoryContractRepo implements ContractRepo {
  list(): Contract[] {
    return seedContracts;
  }
  get(id: string): Contract | undefined {
    return seedContracts.find((c) => c.id === id);
  }
}
