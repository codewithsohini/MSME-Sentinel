import {
  Business,
  Customer,
  Invoice,
  Expense,
  DetectedRisk,
} from '../../src/types.js';
import {
  calculateReceivablesAnalysis,
  calculateConcentration,
  calculateRevenueStability,
  calculateExpensePressure,
  forecastCashFlow,
} from './cashFlowEngine.js';

export function detectRisks(
  business: Business,
  customers: Customer[],
  invoices: Invoice[],
  expenses: Expense[]
): DetectedRisk[] {
  const risks: DetectedRisk[] = [];
  const receivables = calculateReceivablesAnalysis(invoices);
  const concentration = calculateConcentration(customers);
  const revenue = calculateRevenueStability(invoices);
  const expensePressure = calculateExpensePressure(expenses, revenue.monthlyAverage);
  const forecast = forecastCashFlow(business, invoices, customers, expenses, 60);

  const now = new Date().toISOString();

  // 1. Customer Dependency Risk (Major customer with high share AND poor payment reliability)
  if (concentration.top1CustomerShare >= 35) {
    const topCustomer = customers.find((c) => c.name === concentration.top1CustomerName);
    if (topCustomer && (topCustomer.averagePaymentDelay > 14 || topCustomer.paymentReliability === 'LOW')) {
      risks.push({
        id: 'risk_cust_dependency',
        businessId: business.id,
        riskType: 'CUSTOMER_DEPENDENCY',
        severity: 'CRITICAL',
        title: 'Severe Customer Dependency & Delay Exposure',
        metric: `${concentration.top1CustomerShare}% Revenue Share | +${topCustomer.averagePaymentDelay}d Avg Delay`,
        numericalEvidence: `${topCustomer.name} generates ${concentration.top1CustomerShare}% of total revenue (₹${topCustomer.totalRevenue.toLocaleString()}) and currently holds ₹${topCustomer.outstandingAmount.toLocaleString()} outstanding, with historical payments delayed by an average of ${topCustomer.averagePaymentDelay} days.`,
        explanation:
          'High concentration coupled with slow payment turnaround makes your operating cash balance acutely dependent on this single client’s accounts payable cycle.',
        affectedMetric: 'Operating Cash Flow & Concentration Vulnerability',
        recommendedAction:
          'Stagger production batch billing, request 20% advance milestone releases on upcoming orders, and diversify outreach to secondary automotive buyers.',
        createdAt: now,
      });
    }
  }

  // 2. Receivables Overdue Risk
  if (receivables.overdueAmount > 0) {
    const overdueRatio = receivables.totalReceivables > 0
      ? receivables.overdueAmount / receivables.totalReceivables
      : 0;

    if (receivables.overdueAmount >= 200000 || overdueRatio > 0.35) {
      risks.push({
        id: 'risk_receivables_overdue',
        businessId: business.id,
        riskType: 'RECEIVABLES_OVERDUE',
        severity: overdueRatio > 0.5 ? 'CRITICAL' : 'HIGH',
        title: 'Elevated Overdue Receivables Capital Lockup',
        metric: `₹${(receivables.overdueAmount / 100000).toFixed(2)}L Overdue (${(overdueRatio * 100).toFixed(0)}% of Receivables)`,
        numericalEvidence: `Out of ₹${receivables.totalReceivables.toLocaleString()} total outstanding invoices, ₹${receivables.overdueAmount.toLocaleString()} is past its due date across ${receivables.overdueCount} invoices. ₹${receivables.agingBuckets.find(b => b.name === '31-60 days')?.amount.toLocaleString() || 0} is over 30 days delinquent.`,
        explanation:
          'A significant portion of your invoiced working capital is tied up in delinquent balances, increasing borrowing pressures and choking cash conversion velocity.',
        affectedMetric: 'Days Sales Outstanding (DSO) & Working Capital Liquidity',
        recommendedAction:
          'Issue formal statement reconciliations to overdue accounts, initiate direct phone follow-ups with finance managers, and pause subsequent shipments for accounts overdue > 30 days.',
        createdAt: now,
      });
    }
  }

  // 3. Cash Reserve Breach Risk in 30-60 Days Baseline
  if (forecast.reserveBreachExpected) {
    risks.push({
      id: 'risk_cash_reserve_breach',
      businessId: business.id,
      riskType: 'CASH_RESERVE_BREACH',
      severity: 'HIGH',
      title: 'Projected Cash Reserve Safety Breach',
      metric: `Min Cash: ₹${(forecast.lowestProjectedCash / 100000).toFixed(2)}L (Below ₹${(business.minimumCashReserve / 100000).toFixed(2)}L)`,
      numericalEvidence: `Under expected operational inflows and recurring expenses, projected liquid cash reaches a low of ₹${forecast.lowestProjectedCash.toLocaleString()} on ${forecast.lowestCashDate}, falling below your target safety reserve of ₹${business.minimumCashReserve.toLocaleString()}.`,
      explanation:
        'Scheduled recurring payments (payroll, factory rent, material deliveries) cluster before expected invoice collections materialize.',
      affectedMetric: 'Liquid Cash Safety Reserve',
      recommendedAction:
        'Expedite early collection of current invoices due this month and temporarily defer discretionary maintenance outlays until cash returns above target reserve.',
      createdAt: now,
    });
  }

  // 4. Customer Concentration Risk (General Top 3 Share)
  if (concentration.top3CustomerShare > 65) {
    risks.push({
      id: 'risk_cust_concentration',
      businessId: business.id,
      riskType: 'CUSTOMER_CONCENTRATION',
      severity: 'MEDIUM',
      title: 'High Client Revenue Concentration',
      metric: `${concentration.top3CustomerShare}% Revenue in Top 3 Clients`,
      numericalEvidence: `Your top 3 clients (${customers.slice(0, 3).map((c) => c.name).join(', ')}) account for ${concentration.top3CustomerShare}% of total historical turnover.`,
      explanation:
        'A loss or dispute with any one of these three accounts would have an immediate outsized negative impact on your top line.',
      affectedMetric: 'Revenue Concentration & Operational Resilience',
      recommendedAction:
        'Cultivate 2 to 3 mid-tier industrial accounts in adjacent sectors (e.g. electrical assemblies, agricultural tools) to balance client exposure.',
      createdAt: now,
    });
  }

  // 5. Expense Pressure Risk
  if (expensePressure.expenseToRevenueRatio > 0.85) {
    risks.push({
      id: 'risk_expense_pressure',
      businessId: business.id,
      riskType: 'EXPENSE_PRESSURE',
      severity: 'MEDIUM',
      title: 'Compressed Operating Margins',
      metric: `${(expensePressure.expenseToRevenueRatio * 100).toFixed(0)}% Expense-to-Revenue Ratio`,
      numericalEvidence: `Monthly operating outflows average ₹${expensePressure.monthlyExpenses.toLocaleString()} against average revenues of ₹${revenue.monthlyAverage.toLocaleString()}, with ₹${expensePressure.recurringExpenses.toLocaleString()} committed to non-deferrable recurring costs.`,
      explanation:
        'Fixed and recurring overhead absorbs a dominant portion of incoming receipts, leaving thin retained cash margins for unexpected production disruptions.',
      affectedMetric: 'Operating Cash Flow Margin',
      recommendedAction:
        'Negotiate extended supplier credit terms (from net-30 to net-45) for key raw material consignments and audit auxiliary tooling costs.',
      createdAt: now,
    });
  }

  // Sort risks by severity (CRITICAL > HIGH > MEDIUM > LOW)
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
