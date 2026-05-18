import { equipment as seedEquipment } from '@/data/seed/equipment';
import type { EquipmentRecord } from '@/lib/types';

export interface EquipmentRepo {
  list(): EquipmentRecord[];
  get(id: string): EquipmentRecord | undefined;
  /** Append a new record. In-memory implementation mutates the seed array. */
  create(record: EquipmentRecord): EquipmentRecord;
  /**
   * Patch fields on an existing record by id. Returns the updated record
   * or `undefined` if the id is unknown.
   */
  update(id: string, patch: Partial<EquipmentRecord>): EquipmentRecord | undefined;
}

export class InMemoryEquipmentRepo implements EquipmentRepo {
  list(): EquipmentRecord[] {
    return seedEquipment;
  }
  get(id: string): EquipmentRecord | undefined {
    return seedEquipment.find((e) => e.id === id);
  }
  create(record: EquipmentRecord): EquipmentRecord {
    if (seedEquipment.some((e) => e.id === record.id)) {
      throw new Error(`Equipment with id ${record.id} already exists`);
    }
    seedEquipment.push(record);
    return record;
  }
  update(id: string, patch: Partial<EquipmentRecord>): EquipmentRecord | undefined {
    const idx = seedEquipment.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const merged = { ...seedEquipment[idx], ...patch, id };
    seedEquipment[idx] = merged as EquipmentRecord;
    return merged as EquipmentRecord;
  }
}
