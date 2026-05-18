/**
 * Shared seed barrel.
 *
 * Plan 07 (per-entity seeds) consumes via a single import line:
 *   import {
 *     depots, customers, lessors, surveyors,
 *     bicOwnerCodes, isoSizeTypes,
 *   } from '@/data/seed/_shared';
 *
 * Types are re-exported alongside the data so consumers can type their own
 * lookups without reaching into individual files.
 */

export * from './customers';
export * from './lessors';
export * from './depots';
export * from './surveyors';
export * from './bic-owner-codes';
export * from './iso-6346-size-types';
