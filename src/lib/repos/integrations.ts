import { integrations as seedIntegrations } from '@/data/seed/integrations';
import type { IntegrationEntry } from '@/lib/types';

export interface IntegrationRepo {
  list(): IntegrationEntry[];
  get(id: string): IntegrationEntry | undefined;
}

export class InMemoryIntegrationRepo implements IntegrationRepo {
  list(): IntegrationEntry[] {
    return seedIntegrations;
  }
  get(id: string): IntegrationEntry | undefined {
    return seedIntegrations.find((i) => i.id === id);
  }
}
