import { KnowledgeArticle } from '../../src/types.js';

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb_concentration_risk',
    title: 'Customer Concentration Risk in MSMEs',
    category: 'CONCENTRATION_RISK',
    summary: 'Why having a single customer account for >30% of revenue creates extreme vulnerability.',
    explanation:
      'Customer concentration occurs when a single buyer represents a disproportionate share of an enterprise’s cash inflows. While securing a large corporate or OEM client is a major growth milestone, it shifts pricing power and cash flow control entirely to that buyer. If that buyer experiences supply disruptions, shifts vendor policies, or delays payments by 30 to 60 days, the MSME faces immediate liquidity distress regardless of its paper profitability.',
    practicalAction:
      '1. Benchmark target: No single customer should exceed 25-30% of turnover.\n2. Require milestone or advance payments (15-25%) on large custom production runs.\n3. Actively cultivate adjacent tier-2 industrial accounts.\n4. Avoid granting unverified extended credit to high-share clients.',
    formulaOrMetric: 'Top Customer Share = (Revenue from Largest Customer / Total Revenue) × 100%',
  },
  {
    id: 'kb_receivables_aging',
    title: 'Receivables Aging Buckets & Days Sales Outstanding (DSO)',
    category: 'RECEIVABLES_MANAGEMENT',
    summary: 'How to classify outstanding bills into aging buckets and benchmark collection velocity.',
    explanation:
      'Receivables aging analyzes unpaid customer invoices based on the elapsed time since issuance or due date. Standard buckets include: Current (not yet due), 1–7 days, 8–30 days, 31–60 days, and 60+ days overdue. The probability of collecting an overdue invoice drops significantly after 60 days past due date. Days Sales Outstanding (DSO) measures the average number of days it takes an enterprise to collect payment after a sale has been completed.',
    practicalAction:
      '1. Implement a three-touch reminder rhythm: 5 days prior to due date, on the due date, and 3 days overdue.\n2. For 31+ day delinquencies, elevate directly to finance/procurement leads with complete invoice reconciliations.\n3. Implement a strict "hold on subsequent dispatches" policy for accounts exceeding 45 days overdue.',
    formulaOrMetric: 'DSO = (Total Outstanding Accounts Receivable / Total Invoiced Credit Sales) × Days in Period',
  },
  {
    id: 'kb_cash_runway',
    title: 'Cash Runway & The Minimum Liquidity Buffer',
    category: 'CASH_RUNWAY',
    summary: 'Estimating operating runway under stress and setting non-negotiable cash reserves.',
    explanation:
      'Cash runway represents the number of months an MSME can maintain operations before liquid funds reach zero, assuming current net cash burn rates. For an operating business with irregular collections, the minimum cash reserve represents the safety buffer required to cover unavoidable critical outflows (payroll, statutory taxes, factory power, facility lease) during temporary invoice delays.',
    practicalAction:
      '1. Calculate your "Zero-Revenue Monthly Burn" (payroll + rent + utilities + debt service).\n2. Set minimum cash reserve to equal 45 to 60 days of critical fixed burn.\n3. Re-evaluate this reserve quarterly as head count or capacity grows.',
    formulaOrMetric: 'Runway (Months) = Current Liquid Cash / Monthly Net Outflow Burn',
  },
  {
    id: 'kb_working_capital',
    title: 'Working Capital vs. Accounting Profit',
    category: 'WORKING_CAPITAL',
    summary: 'Why profitable MSMEs still fail due to working capital mismatches.',
    explanation:
      'In accrual accounting, revenue is recognized when an invoice is issued, even if the cash has not arrived. Meanwhile, suppliers, workers, and utility providers demand payment in cash. A business can be reporting healthy 20% operating margins on its P&L while simultaneously running out of cash in the bank because collections lag disbursements by 30 to 45 days.',
    practicalAction:
      '1. Prioritize Cash Flow Forecasting over monthly P&L statements for day-to-day decisions.\n2. Match vendor payment terms with client payment cycles.\n3. Reconcile bank transactions weekly to detect unrecorded leakage.',
    formulaOrMetric: 'Working Capital = Current Assets (Cash + Receivables + Inventory) − Current Liabilities',
  },
  {
    id: 'kb_payment_terms',
    title: 'Structuring Contract Terms & Early Payment Discounts',
    category: 'PAYMENT_TERMS',
    summary: 'How to incentivize prompt settlement without damaging customer relationships.',
    explanation:
      'Standard payment terms (Net 30, Net 45, Net 60) often result in informal delays of an additional 15 to 25 days in practice. Offering early settlement incentives (such as 1.5% discount for payment within 10 days) effectively pays for itself by reducing short-term credit facility costs and eliminating collection chasing.',
    practicalAction:
      '1. State terms clearly on all purchase orders, dispatch notes, and invoices: "2/10 Net 30" (2% discount if paid within 10 days, full due in 30 days).\n2. Include specific bank payment details, QR/UPI codes, and contact email directly on invoice footers.\n3. Confirm receipt of goods/invoices within 48 hours to prevent "delayed due to missing invoice" excuses.',
    formulaOrMetric: 'Annualized Cost of Not Taking Discount = [Discount% / (100 − Discount%)] × [365 / (Total Days − Discount Days)]',
  },
];

export function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  const q = query.toLowerCase();
  return KNOWLEDGE_BASE.filter(
    (kb) =>
      kb.title.toLowerCase().includes(q) ||
      kb.summary.toLowerCase().includes(q) ||
      kb.explanation.toLowerCase().includes(q) ||
      kb.category.toLowerCase().includes(q)
  );
}
