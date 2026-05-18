import { rateCards as seedRateCards } from '@/data/seed/tariff/rate-cards';
import type { RateCard } from '@/lib/types';

export interface RateCardRepo {
  list(): RateCard[];
  get(id: string): RateCard | undefined;
}

export class InMemoryRateCardRepo implements RateCardRepo {
  list(): RateCard[] {
    return seedRateCards;
  }
  get(id: string): RateCard | undefined {
    return seedRateCards.find((r) => r.id === id);
  }
}
