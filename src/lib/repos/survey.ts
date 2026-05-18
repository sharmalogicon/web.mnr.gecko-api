import { surveys as seedSurveys } from '@/data/seed/survey';
import type { SurveyRecord } from '@/lib/types';

export interface SurveyRepo {
  list(): SurveyRecord[];
  /** Look up by `reference` (e.g. 'SUR-2026-0123'). */
  get(reference: string): SurveyRecord | undefined;
  create(record: SurveyRecord): SurveyRecord;
  update(reference: string, patch: Partial<SurveyRecord>): SurveyRecord | undefined;
  /** Generates the next `SUR-YYYY-NNNN` reference. */
  nextReference(year?: number): string;
}

export class InMemorySurveyRepo implements SurveyRepo {
  list(): SurveyRecord[] {
    return seedSurveys;
  }
  get(reference: string): SurveyRecord | undefined {
    return seedSurveys.find((s) => s.reference === reference);
  }
  create(record: SurveyRecord): SurveyRecord {
    if (seedSurveys.some((s) => s.reference === record.reference)) {
      throw new Error(`Survey ${record.reference} already exists`);
    }
    seedSurveys.push(record);
    return record;
  }
  update(reference: string, patch: Partial<SurveyRecord>): SurveyRecord | undefined {
    const idx = seedSurveys.findIndex((s) => s.reference === reference);
    if (idx === -1) return undefined;
    const merged = { ...seedSurveys[idx], ...patch, reference };
    seedSurveys[idx] = merged as SurveyRecord;
    return merged as SurveyRecord;
  }
  nextReference(year: number = new Date().getFullYear()): string {
    const prefix = `SUR-${year}-`;
    const existing = seedSurveys
      .map((s) => s.reference)
      .filter((ref) => ref.startsWith(prefix))
      .map((ref) => parseInt(ref.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
