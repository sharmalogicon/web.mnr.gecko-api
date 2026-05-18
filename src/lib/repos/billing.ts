import { invoices as seedInvoices } from '@/data/seed/billing';
import type { Invoice } from '@/lib/types';

export interface InvoiceRepo {
  list(): Invoice[];
  get(id: string): Invoice | undefined;
}

export class InMemoryInvoiceRepo implements InvoiceRepo {
  list(): Invoice[] {
    return seedInvoices;
  }
  get(id: string): Invoice | undefined {
    return seedInvoices.find((i) => i.id === id);
  }
}
