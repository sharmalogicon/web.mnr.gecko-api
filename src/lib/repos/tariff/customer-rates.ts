import { customerRates as seedCustomerRates } from '@/data/seed/tariff/customer-rates';
import type { CustomerRate } from '@/lib/types';

export interface CustomerRateRepo {
  list(): CustomerRate[];
  get(id: string): CustomerRate | undefined;
  /** Filter overrides scoped to a single customer code. */
  byCustomer(customerCode: string): CustomerRate[];
}

export class InMemoryCustomerRateRepo implements CustomerRateRepo {
  list(): CustomerRate[] {
    return seedCustomerRates;
  }
  get(id: string): CustomerRate | undefined {
    return seedCustomerRates.find((r) => r.id === id);
  }
  byCustomer(customerCode: string): CustomerRate[] {
    return seedCustomerRates.filter((r) => r.customerCode === customerCode);
  }
}
