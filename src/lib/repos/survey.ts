import { surveys as seedSurveys } from '@/data/seed/survey';
import type { SurveyRecord } from '@/lib/types';

export interface SurveyRepo {
  list(): SurveyRecord[];
  /** Look up by `reference` (e.g. 'SUR-2026-0123'). */
  get(reference: string): SurveyRecord | undefined;
}

export class InMemorySurveyRepo implements SurveyRepo {
  list(): SurveyRecord[] {
    return seedSurveys;
  }
  get(reference: string): SurveyRecord | undefined {
    return seedSurveys.find((s) => s.reference === reference);
  }
}
