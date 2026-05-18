import { equipment as seedEquipment } from '@/data/seed/equipment';
import type { EquipmentRecord } from '@/lib/types';

export interface EquipmentRepo {
  list(): EquipmentRecord[];
  get(id: string): EquipmentRecord | undefined;
}

export class InMemoryEquipmentRepo implements EquipmentRepo {
  list(): EquipmentRecord[] {
    return seedEquipment;
  }
  get(id: string): EquipmentRecord | undefined {
    return seedEquipment.find((e) => e.id === id);
  }
}
