// HTTP variant — DOCUMENTED EXAMPLE, NOT WIRED IN V1.0.
//
// This file demonstrates the shape a future REST-backed repo will take. The
// in-memory variant in `../equipment.ts` is the active impl per the wiring
// file at `../index.ts`.
//
// To swap to HTTP later:
//   1. Confirm the REST API matches this contract (GET /equipment list, GET
//      /equipment/:id detail).
//   2. Promote the EquipmentRepo interface in `../equipment.ts` from sync to
//      async (return Promise<T[]> / Promise<T | null>).
//   3. Add hook wrappers (`useEquipmentList()` / `useEquipmentGet(id)`) that
//      manage loading/error state.
//   4. Migrate pages to consume hooks instead of direct repo calls.
//   5. In `../index.ts`, swap `new InMemoryEquipmentRepo()` for
//      `new HttpEquipmentRepo(process.env.NEXT_PUBLIC_API_BASE!)`.
//
// Step (5) is the "single wiring file" change called out by DATA-02. Steps
// (2)-(4) are the larger refactor that v1.0 explicitly defers.

import type { EquipmentRecord } from '@/lib/types';

export class HttpEquipmentRepo {
  constructor(private readonly base: string) {}

  async list(): Promise<EquipmentRecord[]> {
    const res = await fetch(`${this.base}/equipment`);
    if (!res.ok) {
      throw new Error(`HttpEquipmentRepo.list failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as EquipmentRecord[];
  }

  async get(id: string): Promise<EquipmentRecord | null> {
    const res = await fetch(`${this.base}/equipment/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`HttpEquipmentRepo.get failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as EquipmentRecord;
  }
}
