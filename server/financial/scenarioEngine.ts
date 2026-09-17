import {
  Business,
  Customer,
  Invoice,
  Expense,
  ScenarioParameters,
  SimulationResult,
  ScenarioComparison,
} from '../../src/types.js';
import { forecastCashFlow } from './cashFlowEngine.js';

const REFERENCE_DATE = '2026-09-14';

export function runScenario(
  business: Business,
  customers: Customer[],
  invoices: Invoice[],
  expenses: Expense[],
  params: ScenarioParameters,
  horizonDays: number = 60
): SimulationResult {
  const refDate = new Date(REFERENCE_DATE);

  // First, compute baseline forecast
  const baseline = forecastCashFlow(business, invoices, customers, expenses, 60);

  // Clone collections for simulation
  const simInvoices: Invoice[] = JSON.parse(JSON.stringify(invoices));
  const simExpenses: Expense[] = JSON.parse(JSON.stringify(expenses));
  const simCustomers: Customer[] = JSON.parse(JSON.stringify(customers));

  let affectedRevenue = 0;
  let affectedExpenses = 0;
  let affectedReceivables = 0;

  // Apply Scenario Alterations deterministically
  switch (params.type) {
    case 'CUSTOMER_PAYMENT_DELAY': {
      // Find customer: default to largest customer if not specified
      let targetCustId = params.customerId;
      if (!targetCustId) {
        const sorted = [...simCustomers].sort((a, b) => b.totalRevenue - a.totalRevenue);
        targetCustId = sorted[0]?.id;
      }
      const targetCustomer = simCustomers.find((c) => c.id === targetCustId);
      const delayDays = params.delayDays || 15;

      for (const inv of simInvoices) {
        if (inv.customerId === targetCustId && inv.outstandingAmount > 0) {
          affectedReceivables += inv.outstandingAmount;
          // Shift dueDate forward by delayDays
          const currentDue = new Date(inv.dueDate);
          currentDue.setDate(currentDue.getDate() + delayDays);
          inv.dueDate = currentDue.toISOString().substring(0, 10);
        }
      }
      break;
    }

    case 'REVENUE_DROP': {
      const dropFraction = (params.revenueDropPercent || 20) / 100;
      for (const inv of simInvoices) {
        if (inv.outstandingAmount > 0) {
          const reduction = Math.round(inv.outstandingAmount * dropFraction);
          inv.outstandingAmount -= reduction;
          affectedRevenue += reduction;
        }
      }
      break;
    }

    case 'EXPENSE_INCREASE': {
      const increaseFraction = (params.expenseIncreasePercent || 10) / 100;
      for (const exp of simExpenses) {
        if (params.expenseCategory === 'ALL' || !params.expenseCategory || exp.category === params.expenseCategory) {
          const addAmount = Math.round(exp.amount * increaseFraction);
          exp.amount += addAmount;
          affectedExpenses += addAmount * 2; // over horizon
        }
      }
      break;
    }

    case 'MAJOR_CUSTOMER_LOSS': {
      // Find largest customer or specified customer
      let lostCustId = params.lostCustomerId;
      if (!lostCustId) {
        const sorted = [...simCustomers].sort((a, b) => b.totalRevenue - a.totalRevenue);
        lostCustId = sorted[0]?.id;
      }
      const lostCustomer = simCustomers.find((c) => c.id === lostCustId);
      if (lostCustomer) {
        affectedRevenue = lostCustomer.totalRevenue;
      }

      // Eliminate all future receivables from this customer
      for (const inv of simInvoices) {
        if (inv.customerId === lostCustId && inv.outstandingAmount > 0) {
          affectedReceivables += inv.outstandingAmount;
          inv.outstandingAmount = 0; // default/cancelled
        }
      }
      break;
    }

    case 'HIRING_DECISION': {
      const salary = params.hiringMonthlySalary || 45000;
      const count = params.hiringCount || 1;
      const totalNewMonthlyCost = salary * count;
      const joinDate = params.hiringJoiningDate || REFERENCE_DATE;

      simExpenses.push({
        id: `sim_exp_hiring_${Date.now()}`,
        businessId: business.id,
        category: 'PAYROLL',
        amount: totalNewMonthlyCost,
        date: joinDate,
        dueDate: joinDate,
        recurring: true,
        frequency: 'MONTHLY',
        critical: true,
        description: `New Hire Salary (${count} employee @ ₹${salary.toLocaleString()}/mo)`,
      });
      affectedExpenses = totalNewMonthlyCost * 2;
      break;
    }

    case 'CUSTOM_SCENARIO': {
      if (params.revenueDropPercent) {
        const dropFraction = params.revenueDropPercent / 100;
        for (const inv of simInvoices) {
          if (inv.outstandingAmount > 0) {
            const reduction = Math.round(inv.outstandingAmount * dropFraction);
            inv.outstandingAmount -= reduction;
            affectedRevenue += reduction;
          }
        }
      }
      if (params.delayDays) {
        for (const inv of simInvoices) {
          if (inv.outstandingAmount > 0) {
            const currentDue = new Date(inv.dueDate);
            currentDue.setDate(currentDue.getDate() + params.delayDays);
            inv.dueDate = currentDue.toISOString().substring(0, 10);
          }
        }
      }
      if (params.expenseIncreasePercent) {
        const increaseFraction = params.expenseIncreasePercent / 100;
        for (const exp of simExpenses) {
          const addAmount = Math.round(exp.amount * increaseFraction);
          exp.amount += addAmount;
          affectedExpenses += addAmount * 2;
        }
      }
      break;
    }
  }

  // Calculate simulated cash-flow forecast
  const simulatedForecast = forecastCashFlow(business, simInvoices, simCustomers, simExpenses, 60);

  const baselineMinCash = baseline.lowestProjectedCash;
  const simulatedMinCash = simulatedForecast.lowestProjectedCash;
  const cashDifference = simulatedMinCash - baselineMinCash;

  const reserveBreach = simulatedMinCash < business.minimumCashReserve;
  const breachAmount = reserveBreach ? business.minimumCashReserve - simulatedMinCash : 0;

  // Count days where cash is below minimum reserve
  let breachDurationDays = 0;
  for (const pt of simulatedForecast.points) {
    if (pt.projectedCash < business.minimumCashReserve) {
      breachDurationDays++;
    }
  }

  // Determine Risk Level of this scenario
  let riskLevel: SimulationResult['riskLevel'] = 'LOW';
  if (simulatedMinCash < 0) {
    riskLevel = 'CRITICAL';
  } else if (reserveBreach && breachAmount > 100000) {
    riskLevel = 'CRITICAL';
  } else if (reserveBreach) {
    riskLevel = 'HIGH';
  } else if (simulatedMinCash < business.minimumCashReserve * 1.25) {
    riskLevel = 'MEDIUM';
  }

  // Calculate resilience score (0-100)
  // 100 if cash never drops below reserve, decreasing linearly as buffer erodes
  let resilienceScore = 100;
  if (simulatedMinCash < 0) {
    resilienceScore = Math.max(0, 15 - Math.round((Math.abs(simulatedMinCash) / business.minimumCashReserve) * 15));
  } else if (reserveBreach) {
    const ratio = simulatedMinCash / business.minimumCashReserve; // 0 to 1
    resilienceScore = Math.round(20 + ratio * 40); // 20 - 60
  } else {
    const bufferHeadroom = (simulatedMinCash - business.minimumCashReserve) / business.minimumCashReserve;
    resilienceScore = Math.min(100, Math.round(65 + Math.min(1.0, bufferHeadroom) * 35));
  }

  // Merge points for side-by-side interactive charting
  const points = baseline.points.map((basePt, index) => {
    const simPt = simulatedForecast.points[index] || basePt;
    return {
      date: basePt.date,
      dayIndex: basePt.dayIndex,
      baselineCash: basePt.projectedCash,
      simulatedCash: simPt.projectedCash,
      minimumReserve: business.minimumCashReserve,
      inflowImpact: simPt.expectedInflows - basePt.expectedInflows,
      outflowImpact: simPt.expectedOutflows - basePt.expectedOutflows,
    };
  });

  return {
    scenarioId: `scen_${Date.now()}`,
    scenarioTitle: params.title || getScenarioDefaultTitle(params),
    parameters: params,
    horizonDays,
    baselineMinCash,
    baselineLowestDate: baseline.lowestCashDate,
    simulatedMinCash,
    simulatedLowestDate: simulatedForecast.lowestCashDate,
    cashDifference,
    reserveBreach,
    breachAmount,
    breachDurationDays,
    affectedRevenue,
    affectedExpenses,
    affectedReceivables,
    riskLevel,
    resilienceScore,
    points,
    calculatedAt: new Date().toISOString(),
  };
}

export function compareScenarios(baselineResult: SimulationResult, stressResult: SimulationResult): ScenarioComparison {
  const lastBase = baselineResult.points[baselineResult.points.length - 1];
  const lastStress = stressResult.points[stressResult.points.length - 1];

  let dangerStart = '';
  let dangerEnd = '';
  let worstShortfall = 0;

  for (const pt of stressResult.points) {
    if (pt.simulatedCash < pt.minimumReserve) {
      if (!dangerStart) dangerStart = pt.date;
      dangerEnd = pt.date;
      const shortfall = pt.minimumReserve - pt.simulatedCash;
      if (shortfall > worstShortfall) worstShortfall = shortfall;
    }
  }

  const dangerDuration = dangerStart
    ? Math.max(1, Math.round((new Date(dangerEnd).getTime() - new Date(dangerStart).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    baseline: {
      minCash: baselineResult.baselineMinCash,
      lowestDate: baselineResult.baselineLowestDate,
      endCash: lastBase ? lastBase.baselineCash : baselineResult.baselineMinCash,
      reserveBreached: baselineResult.baselineMinCash < stressResult.points[0]?.minimumReserve,
    },
    scenario: {
      minCash: stressResult.simulatedMinCash,
      lowestDate: stressResult.simulatedLowestDate,
      endCash: lastStress ? lastStress.simulatedCash : stressResult.simulatedMinCash,
      reserveBreached: stressResult.reserveBreach,
    },
    difference: {
      minCashDiff: stressResult.cashDifference,
      endCashDiff: (lastStress?.simulatedCash || 0) - (lastBase?.baselineCash || 0),
      reserveShortfall: stressResult.breachAmount,
      bufferImpactPercent: Number(
        (((baselineResult.baselineMinCash - stressResult.simulatedMinCash) / (baselineResult.baselineMinCash || 1)) * 100).toFixed(1)
      ),
    },
    dangerPeriod: dangerStart
      ? {
          start: dangerStart,
          end: dangerEnd,
          durationDays: dangerDuration,
          worstShortfall,
        }
      : undefined,
  };
}

export function calculateResilienceIndex(
  business: Business,
  customers: Customer[],
  invoices: Invoice[],
  expenses: Expense[]
): {
  overallIndex: number; // 0-100
  status: 'RESILIENT' | 'MODERATE' | 'VULNERABLE' | 'FRAGILE';
  scenarioOutcomes: { title: string; survivesReserve: boolean; minCash: number; shortfall: number }[];
  primaryVulnerability: string;
} {
  const testScenarios: ScenarioParameters[] = [
    { type: 'CUSTOMER_PAYMENT_DELAY', title: 'Top Customer 15-Day Payment Delay', delayDays: 15 },
    { type: 'CUSTOMER_PAYMENT_DELAY', title: 'Top Customer 30-Day Payment Delay', delayDays: 30 },
    { type: 'REVENUE_DROP', title: 'Immediate 20% Inflow Contraction', revenueDropPercent: 20 },
    { type: 'EXPENSE_INCREASE', title: '15% Surge in Raw Material & Utility Costs', expenseIncreasePercent: 15 },
    { type: 'MAJOR_CUSTOMER_LOSS', title: 'Abrupt Loss of Largest Account' },
  ];

  const outcomes = testScenarios.map((scen) => {
    const res = runScenario(business, customers, invoices, expenses, scen, 60);
    return {
      title: scen.title,
      survivesReserve: !res.reserveBreach,
      minCash: res.simulatedMinCash,
      shortfall: res.breachAmount,
    };
  });

  const survivedCount = outcomes.filter((o) => o.survivesReserve).length;
  const overallIndex = Math.round((survivedCount / outcomes.length) * 100);

  let status: 'RESILIENT' | 'MODERATE' | 'VULNERABLE' | 'FRAGILE' = 'MODERATE';
  if (overallIndex >= 80) status = 'RESILIENT';
  else if (overallIndex >= 60) status = 'MODERATE';
  else if (overallIndex >= 40) status = 'VULNERABLE';
  else status = 'FRAGILE';

  // Identify worst shock
  const worst = [...outcomes].sort((a, b) => a.minCash - b.minCash)[0];
  const primaryVulnerability = worst
    ? `${worst.title} causes the largest cash drawdown, bringing minimum cash to ₹${worst.minCash.toLocaleString()} (${worst.shortfall > 0 ? `breaching safety reserve by ₹${worst.shortfall.toLocaleString()}` : 'maintaining thin buffer'}).`
    : 'Prolonged receivables delay from dominant clients.';

  return {
    overallIndex,
    status,
    scenarioOutcomes: outcomes,
    primaryVulnerability,
  };
}

function getScenarioDefaultTitle(params: ScenarioParameters): string {
  switch (params.type) {
    case 'CUSTOMER_PAYMENT_DELAY':
      return `Customer Payment Delay (${params.delayDays || 15} Days)`;
    case 'REVENUE_DROP':
      return `Revenue Drop of ${params.revenueDropPercent || 20}%`;
    case 'EXPENSE_INCREASE':
      return `Operating Cost Surge of ${params.expenseIncreasePercent || 10}%`;
    case 'MAJOR_CUSTOMER_LOSS':
      return `Loss of Largest Customer`;
    case 'HIRING_DECISION':
      return `Hiring Decision (Salary ₹${(params.hiringMonthlySalary || 45000).toLocaleString()}/mo)`;
    default:
      return 'Custom Financial Stress Test';
  }
}
