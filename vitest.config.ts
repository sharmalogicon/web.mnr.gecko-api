/**
 * Vitest configuration.
 *
 * Mirrors the `@/*` → `./src/*` path alias from `tsconfig.json` so seed files
 * (which use `from '@/lib/iso6346/check-digit'` per plan 01.07 key_links) can
 * be imported by the `equipment.validation.test.ts` CI guard.
 *
 * Added by plan 01.07 Task 3 (Rule 3 deviation — missing config blocked the
 * D-10 CI guard from running).
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
