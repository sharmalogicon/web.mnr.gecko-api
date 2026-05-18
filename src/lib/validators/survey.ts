/**
 * Zod schema for the survey-authoring form.
 * Phase 5 / 6.
 */

import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const checklistResultSchema = z.object({
  itemId: z.string().min(1),
  result: z.enum(['pass', 'fail', 'na']),
  measurementCm: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const surveyInputSchema = z.object({
  equipmentId: z.string().min(11, 'Pick an equipment'),
  type: z.enum(['on_hire', 'off_hire', 'periodic', 'pti']),
  surveyorId: z.string().min(1, 'Pick a surveyor'),
  depotCode: z.string().min(2, 'Pick a depot'),
  performedDate: isoDate,
  outcome: z.enum(['pass', 'pass_with_notes', 'must_repair', 'reject']),
  costThb: z.coerce.number().positive('Cost must be > 0'),
  notes: z.string().optional(),
  checklist: z.array(checklistResultSchema).min(1, 'Walk the checklist'),
});

export type ChecklistResultInput = z.infer<typeof checklistResultSchema>;
export type SurveyInput = z.infer<typeof surveyInputSchema>;
