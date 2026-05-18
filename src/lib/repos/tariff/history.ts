import { tariffHistory as seedHistory } from '@/data/seed/tariff/history';
import type { TariffHistoryEntry } from '@/lib/types';

export interface TariffHistoryRepo {
  list(): TariffHistoryEntry[];
  get(id: string): TariffHistoryEntry | undefined;
}

export class InMemoryTariffHistoryRepo implements TariffHistoryRepo {
  list(): TariffHistoryEntry[] {
    return seedHistory;
  }
  get(id: string): TariffHistoryEntry | undefined {
    return seedHistory.find((h) => h.id === id);
  }
}
