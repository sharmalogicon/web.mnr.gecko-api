import { users as seedUsers } from '@/data/seed/users';
import type { UserRecord } from '@/lib/types';

export interface UserRepo {
  list(): UserRecord[];
  get(id: string): UserRecord | undefined;
}

export class InMemoryUserRepo implements UserRepo {
  list(): UserRecord[] {
    return seedUsers;
  }
  get(id: string): UserRecord | undefined {
    return seedUsers.find((u) => u.id === id);
  }
}
