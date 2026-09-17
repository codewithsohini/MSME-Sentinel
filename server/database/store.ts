import {
  Business,
  Customer,
  Invoice,
  Payment,
  Expense,
  Sale,
  ScenarioParameters,
  SimulationResult,
} from '../../src/types.js';
import { getSyntheticDemoData } from './demoData.js';

export interface SavedScenarioRecord {
  id: string;
  title: string;
  parameters: ScenarioParameters;
  result: SimulationResult;
  savedAt: string;
}

class FinancialStore {
  private business: Business;
  private customers: Map<string, Customer> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private sales: Map<string, Sale> = new Map();
  private savedScenarios: Map<string, SavedScenarioRecord> = new Map();

  constructor() {
    const demo = getSyntheticDemoData();
    this.business = demo.business;
    this.loadData(demo);
  }

  public loadData(data: {
    business: Business;
    customers: Customer[];
    invoices: Invoice[];
    payments: Payment[];
    expenses: Expense[];
    sales: Sale[];
  }) {
    this.business = { ...data.business };
    this.customers.clear();
    this.invoices.clear();
    this.payments.clear();
    this.expenses.clear();
    this.sales.clear();

    for (const c of data.customers) this.customers.set(c.id, { ...c });
    for (const inv of data.invoices) this.invoices.set(inv.id, { ...inv });
    for (const p of data.payments) this.payments.set(p.id, { ...p });
    for (const e of data.expenses) this.expenses.set(e.id, { ...e });
    for (const s of data.sales) this.sales.set(s.id, { ...s });
  }

  public resetToDemo(): void {
    const demo = getSyntheticDemoData();
    this.loadData(demo);
  }

  public getBusiness(): Business {
    return {
      ...this.business,
      liquidCash: this.business.currentCash,
      minimumReserve: this.business.minimumCashReserve,
    };
  }

  public updateBusiness(partial: Partial<Business>): Business {
    this.business = {
      ...this.business,
      ...partial,
    };
    return { ...this.business };
  }

  // Customers
  public getCustomers(): Customer[] {
    // Recalculate customer statistics dynamically to ensure consistency
    const invoices = Array.from(this.invoices.values());
    const totalRevenueAll = invoices.reduce((sum, i) => sum + i.amount, 0);

    return Array.from(this.customers.values()).map((customer) => {
      const custInvoices = invoices.filter((i) => i.customerId === customer.id);
      const totalRev = custInvoices.reduce((sum, i) => sum + i.amount, 0);
      const outstanding = custInvoices.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);
      const share = totalRevenueAll > 0 ? Number(((totalRev / totalRevenueAll) * 100).toFixed(1)) : 0;

      return {
        ...customer,
        totalRevenue: totalRev,
        invoiceCount: custInvoices.length,
        outstandingAmount: outstanding,
        revenueShare: share,
      };
    });
  }

  public getCustomer(id: string): Customer | undefined {
    const list = this.getCustomers();
    return list.find((c) => c.id === id);
  }

  public addCustomer(customer: Customer): Customer {
    this.customers.set(customer.id, customer);
    return customer;
  }

  // Invoices
  public getInvoices(): Invoice[] {
    const now = new Date('2026-09-14').getTime();
    return Array.from(this.invoices.values()).map((inv) => {
      // update daysOverdue dynamically
      const due = new Date(inv.dueDate).getTime();
      const isPastDue = now > due;
      const diffDays = isPastDue ? Math.floor((now - due) / (1000 * 60 * 60 * 24)) : 0;
      let status = inv.status;
      if (inv.outstandingAmount > 0 && isPastDue) {
        status = 'OVERDUE';
      } else if (inv.outstandingAmount === 0) {
        status = 'PAID';
      }
      return {
        ...inv,
        status,
        daysOverdue: diffDays,
      };
    });
  }

  public getInvoice(id: string): Invoice | undefined {
    return this.invoices.get(id);
  }

  public addInvoice(invoice: Invoice): Invoice {
    this.invoices.set(invoice.id, invoice);
    // Ensure customer exists or update customer record
    if (invoice.customerId && !this.customers.has(invoice.customerId)) {
      this.customers.set(invoice.customerId, {
        id: invoice.customerId,
        businessId: this.business.id,
        name: invoice.customerName || 'New Customer',
        totalRevenue: invoice.amount,
        invoiceCount: 1,
        outstandingAmount: invoice.outstandingAmount,
        averagePaymentDelay: 0,
        paymentReliability: 'MEDIUM',
        revenueShare: 0,
      });
    }
    return invoice;
  }

  public updateInvoice(id: string, partial: Partial<Invoice>): Invoice | undefined {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial };
    this.invoices.set(id, updated);
    return updated;
  }

  public deleteInvoice(id: string): boolean {
    return this.invoices.delete(id);
  }

  // Payments
  public getPayments(): Payment[] {
    return Array.from(this.payments.values());
  }

  public addPayment(payment: Payment): Payment {
    this.payments.set(payment.id, payment);
    // If matched to invoice, reduce outstandingAmount
    if (payment.invoiceId && this.invoices.has(payment.invoiceId)) {
      const inv = this.invoices.get(payment.invoiceId)!;
      const newOutstanding = Math.max(0, inv.outstandingAmount - payment.amount);
      inv.outstandingAmount = newOutstanding;
      inv.status = newOutstanding === 0 ? 'PAID' : 'PARTIAL';
      this.invoices.set(inv.id, inv);
    }
    return payment;
  }

  public deletePayment(id: string): boolean {
    return this.payments.delete(id);
  }

  // Expenses
  public getExpenses(): Expense[] {
    return Array.from(this.expenses.values());
  }

  public addExpense(expense: Expense): Expense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  public deleteExpense(id: string): boolean {
    return this.expenses.delete(id);
  }

  // Sales
  public getSales(): Sale[] {
    return Array.from(this.sales.values());
  }

  // Saved Scenarios
  public getSavedScenarios(): SavedScenarioRecord[] {
    return Array.from(this.savedScenarios.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  public saveScenario(record: SavedScenarioRecord): SavedScenarioRecord {
    this.savedScenarios.set(record.id, record);
    return record;
  }

  public deleteSavedScenario(id: string): boolean {
    return this.savedScenarios.delete(id);
  }
}

export const store = new FinancialStore();
