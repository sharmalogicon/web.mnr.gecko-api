import { surcharges as seedSurcharges } from '@/data/seed/tariff/surcharges';
import type { Surcharge } from '@/lib/types';

export interface SurchargeRepo {
  list(): Surcharge[];
  get(id: string): Surcharge | undefined;
}

export class InMemorySurchargeRepo implements SurchargeRepo {
  list(): Surcharge[] {
    return seedSurcharges;
  }
  get(id: string): Surcharge | undefined {
    return seedSurcharges.find((s) => s.id === id);
  }
}
