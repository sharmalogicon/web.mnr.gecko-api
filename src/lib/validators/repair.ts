/**
 * Zod schema for repair-line authoring.
 * Phase 4, D-05.
 */

import { z } from 'zod';
import {
  cedexLocations,
  cedexComponents,
  cedexDamages,
  cedexRepairs,
} from '@/data/seed/_shared/cedex';

const locationCodes = cedexLocations.map((c) => c.code) as [string, ...string[]];
const componentCodes = cedexComponents.map((c) => c.code) as [string, ...string[]];
const damageCodes = cedexDamages.map((c) => c.code) as [string, ...string[]];
const repairActionCodes = cedexRepairs.map((c) => c.code) as [string, ...string[]];

export const repairLineSchema = z.object({
  location: z.enum(locationCodes, { errorMap: () => ({ message: 'Pick a CEDEX location' }) }),
  component: z.enum(componentCodes, { errorMap: () => ({ message: 'Pick a CEDEX component' }) }),
  damage: z.enum(damageCodes, { errorMap: () => ({ message: 'Pick a damage code' }) }),
  repair: z.enum(repairActionCodes, { errorMap: () => ({ message: 'Pick a repair action' }) }),
  dimensionCm: z.coerce.number().nonnegative().optional(),
  material: z.string().optional(),
  hours: z.coerce.number().positive('Hours must be > 0'),
  costThb: z.coerce.number().positive('Cost must be > 0'),
  responsibility: z.enum(['owner', 'operator', 'depot', 'insurance', 'warranty']),
});

export const repairJobInputSchema = z.object({
  equipmentId: z.string().min(11, 'Pick an equipment'),
  customerCode: z.string().min(1, 'Pick a customer'),
  estimatorId: z.string().min(1, 'Pick an estimator'),
  severity: z.enum(['minor', 'normal', 'critical']),
  lines: z.array(repairLineSchema).min(1, 'Add at least one repair line'),
});

export type RepairLineInput = z.infer<typeof repairLineSchema>;
export type RepairJobInput = z.infer<typeof repairJobInputSchema>;
