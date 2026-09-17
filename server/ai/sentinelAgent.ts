import { FunctionDeclaration, Type } from '@google/genai';
import { getGeminiClient, callGeminiWithFallback } from './geminiClient.js';
import { store } from '../database/store.js';
import {
  calculateBusinessHealth,
} from '../financial/healthScore.js';
import {
  calculateReceivablesAnalysis,
  calculateConcentration,
  calculateRevenueStability,
  calculateExpensePressure,
  forecastCashFlow,
  calculateCashRunway,
} from '../financial/cashFlowEngine.js';
import { detectRisks } from '../financial/riskEngine.js';
import { runScenario, compareScenarios, calculateResilienceIndex } from '../financial/scenarioEngine.js';
import { searchKnowledgeBase } from './knowledgeAssistant.js';
import { ChatMessage, ScenarioParameters, SimulationResult } from '../../src/types.js';

// Function Declarations for Gemini
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'calculateBusinessHealth',
    description: 'Calculates the current Business Health Score (0-100) with detailed component metrics and grades.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getTopRisks',
    description: 'Retrieves all detected financial vulnerabilities, cash risks, customer dependencies, and severity levels.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getCustomerRisk',
    description: 'Returns customer concentration metrics, payment delays, reliability ratings, and revenue shares.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Optional specific customer name to inspect' },
      },
    },
  },
  {
    name: 'getReceivablesAnalysis',
    description: 'Returns overdue amounts, aging buckets (Current, 1-7d, 8-30d, 31-60d, 60+d), and average collection delays.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'forecastCashFlow',
    description: 'Generates deterministic 30, 60, or 90 day baseline cash flow projections, expected inflows, outflows, and lowest cash point.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        horizonDays: { type: Type.NUMBER, description: 'Forecast horizon: 30, 60, or 90 days' },
      },
    },
  },
  {
    name: 'runScenario',
    description: 'Executes a deterministic crisis simulation (What-If test) for payment delays, revenue drops, cost increases, customer loss, or hiring decisions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description:
            'Scenario type: CUSTOMER_PAYMENT_DELAY, REVENUE_DROP, EXPENSE_INCREASE, MAJOR_CUSTOMER_LOSS, HIRING_DECISION, or CUSTOM_SCENARIO',
        },
        delayDays: { type: Type.NUMBER, description: 'Days of customer payment delay (e.g. 7, 15, 30)' },
        revenueDropPercent: { type: Type.NUMBER, description: 'Percentage sales drop (e.g. 10, 20, 30)' },
        expenseIncreasePercent: { type: Type.NUMBER, description: 'Percentage increase in operating expenses' },
        customerName: { type: Type.STRING, description: 'Customer name if delay or loss scenario applies' },
        hiringMonthlySalary: { type: Type.NUMBER, description: 'Monthly salary of new employee' },
      },
      required: ['type'],
    },
  },
  {
    name: 'getExpenseAnalysis',
    description: 'Analyzes operating expenses, recurring commitments, critical vs non-critical costs, and expense-to-revenue ratio.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getRevenueAnalysis',
    description: 'Returns monthly turnover trends, revenue volatility, and trajectory.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'retrieveKnowledge',
    description: 'Looks up MSME working capital, DSO, concentration risk, and payment term definitions from the knowledge base.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search term or financial concept' },
      },
      required: ['query'],
    },
  },
];

// Execute tool call deterministically
export function executeDeterministicTool(name: string, args: Record<string, any>) {
  const business = store.getBusiness();
  const customers = store.getCustomers();
  const invoices = store.getInvoices();
  const expenses = store.getExpenses();

  switch (name) {
    case 'calculateBusinessHealth': {
      const health = calculateBusinessHealth(business, customers, invoices, expenses);
      return {
        overallScore: health.overallScore,
        grade: health.grade,
        label: health.label,
        trend: health.trend,
        scoreChange: health.scoreChange,
        trendDescription: health.trendDescription,
        history: health.history?.map((h) => ({
          month: h.label,
          score: h.overallScore,
          status: h.status,
          milestone: h.operationalMilestone,
        })),
        components: health.components.map((c) => ({
          name: c.name,
          score: c.score,
          status: c.status,
          currentValue: c.currentMetricValue,
          impact: c.impactExplanation,
        })),
        summary: health.summary,
      };
    }

    case 'getTopRisks': {
      const risks = detectRisks(business, customers, invoices, expenses);
      return {
        totalRisks: risks.length,
        risks: risks.map((r) => ({
          title: r.title,
          severity: r.severity,
          metric: r.metric,
          evidence: r.numericalEvidence,
          recommendedAction: r.recommendedAction,
        })),
      };
    }

    case 'getCustomerRisk': {
      const concentration = calculateConcentration(customers);
      return {
        top1Customer: {
          name: concentration.top1CustomerName,
          share: `${concentration.top1CustomerShare}%`,
        },
        top3CustomerShare: `${concentration.top3CustomerShare}%`,
        hasDangerousDependency: concentration.hasDangerousDependency,
        allCustomers: customers.map((c) => ({
          name: c.name,
          revenueShare: `${c.revenueShare}%`,
          totalRevenue: `₹${c.totalRevenue.toLocaleString()}`,
          outstanding: `₹${c.outstandingAmount.toLocaleString()}`,
          avgDelayDays: c.averagePaymentDelay,
          reliability: c.paymentReliability,
        })),
      };
    }

    case 'getReceivablesAnalysis': {
      const rec = calculateReceivablesAnalysis(invoices);
      return {
        totalReceivables: `₹${rec.totalReceivables.toLocaleString()}`,
        overdueAmount: `₹${rec.overdueAmount.toLocaleString()}`,
        overdueInvoiceCount: rec.overdueCount,
        averagePaymentDelayDays: rec.averagePaymentDelay,
        daysSalesOutstanding: rec.dso,
        agingBuckets: rec.agingBuckets.map((b) => ({
          bucket: b.name,
          amount: `₹${b.amount.toLocaleString()}`,
          count: b.count,
          percentage: `${b.percentage}%`,
        })),
      };
    }

    case 'forecastCashFlow': {
      const horizon = (args.horizonDays as 30 | 60 | 90) || 60;
      const forecast = forecastCashFlow(business, invoices, customers, expenses, horizon);
      return {
        horizonDays: forecast.horizonDays,
        currentCash: `₹${forecast.openingCash.toLocaleString()}`,
        minimumReserve: `₹${forecast.minimumReserve.toLocaleString()}`,
        lowestProjectedCash: `₹${forecast.lowestProjectedCash.toLocaleString()}`,
        lowestCashDate: forecast.lowestCashDate,
        reserveBreachExpected: forecast.reserveBreachExpected,
        breachStartDate: forecast.breachStartDate || 'None',
        confidence: forecast.forecastConfidence,
      };
    }

    case 'runScenario': {
      let targetCustId: string | undefined;
      if (args.customerName) {
        const found = customers.find((c) => c.name.toLowerCase().includes(args.customerName.toLowerCase()));
        if (found) targetCustId = found.id;
      }
      const params: ScenarioParameters = {
        type: args.type as any,
        title: args.customerName ? `Delay for ${args.customerName}` : 'Crisis Simulation',
        customerId: targetCustId,
        customerName: args.customerName,
        delayDays: args.delayDays,
        revenueDropPercent: args.revenueDropPercent,
        expenseIncreasePercent: args.expenseIncreasePercent,
        hiringMonthlySalary: args.hiringMonthlySalary,
      };

      const result = runScenario(business, customers, invoices, expenses, params, 60);
      return {
        scenarioTitle: result.scenarioTitle,
        baselineMinCash: `₹${result.baselineMinCash.toLocaleString()}`,
        simulatedMinCash: `₹${result.simulatedMinCash.toLocaleString()}`,
        cashDifference: `₹${result.cashDifference.toLocaleString()}`,
        reserveBreached: result.reserveBreach,
        breachAmount: result.breachAmount > 0 ? `₹${result.breachAmount.toLocaleString()}` : '₹0',
        lowestCashDate: result.simulatedLowestDate,
        riskLevel: result.riskLevel,
        resilienceScore: `${result.resilienceScore}/100`,
        rawResult: result,
      };
    }

    case 'getExpenseAnalysis': {
      const rev = calculateRevenueStability(invoices);
      const exp = calculateExpensePressure(expenses, rev.monthlyAverage);
      return {
        monthlyAverageExpenses: `₹${exp.monthlyExpenses.toLocaleString()}`,
        recurringMonthly: `₹${exp.recurringExpenses.toLocaleString()}`,
        criticalMonthly: `₹${exp.criticalExpenses.toLocaleString()}`,
        expenseToRevenueRatio: `${(exp.expenseToRevenueRatio * 100).toFixed(1)}%`,
        topCategories: exp.breakdownByCategory.slice(0, 4).map((c) => ({
          category: c.category,
          amount: `₹${c.amount.toLocaleString()}`,
          percentage: `${c.percentage}%`,
        })),
      };
    }

    case 'getRevenueAnalysis': {
      const rev = calculateRevenueStability(invoices);
      return {
        monthlyAverageRevenue: `₹${rev.monthlyAverage.toLocaleString()}`,
        revenueTrend: rev.trend,
        volatility: rev.revenueVolatility,
        monthlyTrends: rev.monthlyTrends.map((t) => ({
          month: t.month,
          amount: `₹${t.amount.toLocaleString()}`,
          growthRate: `${t.growthRate}%`,
        })),
      };
    }

    case 'retrieveKnowledge': {
      const articles = searchKnowledgeBase(args.query || '');
      return {
        query: args.query,
        foundArticles: articles.map((a) => ({
          title: a.title,
          summary: a.summary,
          explanation: a.explanation,
          practicalAction: a.practicalAction,
        })),
      };
    }

    default:
      return { error: `Tool ${name} not recognized` };
  }
}

export async function processSentinelChat(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<{
  reply: string;
  toolInvocations: { toolName: string; arguments: Record<string, any>; resultSummary?: string }[];
  evidence: { metric: string; value: string; source: string }[];
  scenarioResult?: SimulationResult;
}> {
  const ai = getGeminiClient();

  const business = store.getBusiness();
  const customers = store.getCustomers();
  const invoices = store.getInvoices();
  const expenses = store.getExpenses();

  // If offline / no API key: run deterministic tool matching directly!
  if (!ai) {
    const msgLower = userMessage.toLowerCase();
    let invokedToolName = 'calculateBusinessHealth';
    let toolArgs: Record<string, any> = {};

    if (msgLower.includes('health') || msgLower.includes('score')) {
      invokedToolName = 'calculateBusinessHealth';
    } else if (msgLower.includes('risk') || msgLower.includes('danger') || msgLower.includes('problem')) {
      invokedToolName = 'getTopRisks';
    } else if (msgLower.includes('customer') || msgLower.includes('concentration') || msgLower.includes('apex')) {
      invokedToolName = 'getCustomerRisk';
    } else if (msgLower.includes('receivable') || msgLower.includes('overdue') || msgLower.includes('invoice')) {
      invokedToolName = 'getReceivablesAnalysis';
    } else if (msgLower.includes('late') || msgLower.includes('delay') || msgLower.includes('what if') || msgLower.includes('hire')) {
      invokedToolName = 'runScenario';
      toolArgs = {
        type: msgLower.includes('hire') ? 'HIRING_DECISION' : 'CUSTOMER_PAYMENT_DELAY',
        delayDays: 15,
        hiringMonthlySalary: 45000,
      };
    } else if (msgLower.includes('expense') || msgLower.includes('cost')) {
      invokedToolName = 'getExpenseAnalysis';
    } else if (msgLower.includes('forecast') || msgLower.includes('cash flow')) {
      invokedToolName = 'forecastCashFlow';
    } else {
      invokedToolName = 'getTopRisks';
    }

    const toolResult = executeDeterministicTool(invokedToolName, toolArgs);

    let reply = ``;
    let simResult: SimulationResult | undefined;
    const userAskedActions = msgLower.includes('what should') || msgLower.includes('action') || msgLower.includes('recommend') || msgLower.includes('do now') || msgLower.includes('how to fix');

    if (invokedToolName === 'calculateBusinessHealth') {
      const components = toolResult.components || [];
      const weakest = [...components].sort((a: any, b: any) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);
      const strongest = [...components].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2);

      reply = `Your Business Health Score is ${toolResult.overallScore}/100 (${toolResult.label}).\n\nThe biggest factors pulling the score down are:\n` +
        weakest.map((c: any) => `• ${c.name}: ${c.score}/100 — ${c.currentValue || c.explanation || c.status}`).join('\n') +
        `\n\nYour stronger areas are ${strongest.map((c: any) => `${c.name} (${c.score}/100)`).join(' and ')}.`;
      if (userAskedActions) {
        reply += `\n\nSuggested actions:\n• Accelerate collection of overdue invoices exceeding 30 days.\n• Negotiate shorter credit terms or staged billing with top counterparties.\n• Rebuild cash buffer toward the ₹3.00L safety floor.`;
      }
    } else if (invokedToolName === 'runScenario') {
      simResult = toolResult.rawResult;
      reply = `Stress test results for **${toolResult.scenarioTitle}**:\n` +
        `• Projected Lowest Cash: ${toolResult.simulatedMinCash} (Baseline: ${toolResult.baselineMinCash})\n` +
        `• Cash Impact: ${toolResult.cashDifference}\n` +
        `• Safety Buffer Breached? ${toolResult.reserveBreached ? `YES (Shortfall: ${toolResult.breachAmount})` : 'NO (Maintained above safety reserve)'}\n` +
        `• Resilience Score: ${toolResult.resilienceScore}`;
      if (userAskedActions) {
        reply += `\n\nSuggested actions:\n• Follow up early with procurement leads before payment dates.\n• Rebalance subsequent deliveries until outstanding balances are cleared.\n• Keep non-essential outflows paused during the drawdown window.`;
      }
    } else if (invokedToolName === 'getCustomerRisk') {
      reply = `Customer concentration analysis:\n` +
        `• Largest customer: **${toolResult.top1Customer.name}** accounts for **${toolResult.top1Customer.share}** of all revenue.\n` +
        `• Top 3 customers represent **${toolResult.top3CustomerShare}** of total sales.\n` +
        `• Single-client exposure status: ${toolResult.hasDangerousDependency ? 'High dependency with delayed payment collection risk.' : 'Within standard risk thresholds.'}`;
      if (userAskedActions) {
        reply += `\n\nSuggested actions:\n• Diversify client pipeline to lower single-account exposure below 30%.\n• Require advance deposits or milestone billing for high-volume orders.`;
      }
    } else if (invokedToolName === 'getTopRisks') {
      reply = `Financial vulnerabilities detected by the engine:\n` +
        toolResult.risks.slice(0, 3).map((r: any) => `• **${r.title}** (${r.severity}): ${r.evidence}`).join('\n');
      if (userAskedActions) {
        reply += `\n\nSuggested actions:\n` + toolResult.risks.slice(0, 3).map((r: any) => `• ${r.recommendedAction}`).join('\n');
      }
    } else {
      reply = `Financial Engine Query Result for ${invokedToolName}:\n${JSON.stringify(toolResult, null, 2)}`;
    }

    return {
      reply,
      toolInvocations: [{ toolName: invokedToolName, arguments: toolArgs, resultSummary: 'Calculated via deterministic engine' }],
      evidence: [
        { metric: 'Current Cash', value: `₹${business.currentCash.toLocaleString()}`, source: 'Ledger Store' },
        { metric: 'Minimum Reserve', value: `₹${business.minimumCashReserve.toLocaleString()}`, source: 'Business Policy' },
      ],
      scenarioResult: simResult,
    };
  }

  // With Gemini Client: Call with tools and handle tool execution!
  const systemInstruction = `You are Sentinel Copilot, an operational business intelligence assistant for MSMEs.

Your job is to explain the results returned by Sentinel's deterministic financial tools.

IMPORTANT:
- Never calculate financial metrics yourself.
- Never invent financial figures, dates, transactions, customers, payment behavior, or trends.
- Use only values returned by tools or explicitly provided in the conversation.
- Never create unsupported explanations for why a metric changed.
- Do not fabricate historical events or business context.
- If the available data does not support an explanation, say so.

RESPONSE STYLE:
- Answer the user's exact question first.
- Keep normal answers concise: 3–6 sentences or up to 4 bullets.
- Do NOT automatically generate an executive report.
- Do NOT automatically include sections such as "What Happened", "Why It Happened", or "Three Prioritized Actions".
- Only provide detailed analysis when the user explicitly asks for it.
- Only provide recommendations when the user asks what they should do, or when the tool specifically requests recommendations.
- When recommendations are given, clearly label them as "Suggested actions", not guaranteed outcomes.
- Never invent percentage targets, discount rates, credit limits, payment terms, or financial thresholds unless they are returned by a tool or supported by the knowledge base.
- Avoid unnecessary disclaimers in every response.

HEALTH SCORE:
When explaining the Business Health Score, state the overall score and identify the main deterministic drivers returned by the health-score tool.

Example format:
"Your Business Health Score is 56/100 (Grade C).

The biggest factors pulling the score down are:
• Receivables Aging: 20/100 — ₹5.43L of ₹7.33L in receivables is overdue.
• Payment Velocity: 40/100 — customers are averaging about 24 days beyond agreed terms.
• Customer Concentration: 45/100 — Apex Motors Ltd. accounts for 44.5% of invoiced revenue.

Your stronger areas are Cash Reserve Buffer (85/100) and Operating Cost Pressure (95/100)."

Do not add recommendations unless the user asks for them.`;

  try {
    const firstCall = await callGeminiWithFallback((model) =>
      ai.models.generateContent({
        model,
        contents: userMessage,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: toolDeclarations }],
        },
      })
    );

    const invocations: { toolName: string; arguments: Record<string, any>; resultSummary?: string }[] = [];
    const evidenceList: { metric: string; value: string; source: string }[] = [];
    let scenarioResult: SimulationResult | undefined;

    // Check if Gemini invoked any tools
    if (firstCall.functionCalls && firstCall.functionCalls.length > 0) {
      const toolCall = firstCall.functionCalls[0];
      const toolName = toolCall.name;
      const toolArgs = (toolCall.args as Record<string, any>) || {};

      invocations.push({
        toolName,
        arguments: toolArgs,
      });

      // Run deterministic function
      const executionResult = executeDeterministicTool(toolName, toolArgs);

      if (toolName === 'runScenario' && executionResult.rawResult) {
        scenarioResult = executionResult.rawResult;
      }

      // Add evidence metrics
      if (executionResult.overallScore !== undefined) {
        evidenceList.push({ metric: 'Health Score', value: `${executionResult.overallScore}/100`, source: 'Health Engine' });
      }
      if (executionResult.simulatedMinCash !== undefined) {
        evidenceList.push({ metric: 'Simulated Min Cash', value: String(executionResult.simulatedMinCash), source: 'Scenario Engine' });
      }

      // Second step: Ask model to interpret the deterministic results for the user
      const secondCall = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            {
              role: 'model',
              parts: [
                {
                  text: `I executed the deterministic financial function ${toolName} with parameters ${JSON.stringify(toolArgs)}. Here are the exact calculated application results:\n${JSON.stringify(executionResult, null, 2)}`,
                },
              ],
            },
            {
              role: 'user',
              parts: [
                {
                  text: `Explain these results to the MSME owner following your Sentinel Copilot response rules:
1. Answer the user's exact question first.
2. Keep normal answers concise: 3–6 sentences or up to 4 bullets.
3. Do NOT automatically generate an executive report.
4. Do NOT automatically include sections such as "What Happened", "Why It Happened", or "Three Prioritized Actions".
5. Only provide detailed analysis if the user explicitly asked for it.
6. Only provide recommendations when the user asks what they should do, or when the tool specifically requests recommendations. If recommendations are provided, label them as "Suggested actions".
7. Never calculate financial metrics yourself or invent numbers; quote only the exact calculated numbers from the tool output.
8. If explaining the Business Health Score, state the overall score and grade, identify the main deterministic drivers pulling the score down, and state the stronger areas. Do not add recommendations unless asked.`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
          },
        })
      );

      return {
        reply: secondCall.text || firstCall.text || 'Calculation completed.',
        toolInvocations: invocations,
        evidence: evidenceList,
        scenarioResult,
      };
    }

    // Direct response without tool call
    return {
      reply: firstCall.text || 'How can I assist you with your business health and cash flow today?',
      toolInvocations: [],
      evidence: [],
    };
  } catch (error: any) {
    console.error('Sentinel AI error:', error);
    // Fallback gracefully to direct deterministic engine execution
    const fallbackHealth = calculateBusinessHealth(business, customers, invoices, expenses);
    return {
      reply: `I ran an on-demand check using our deterministic engine: Your Business Health Score is **${fallbackHealth.overallScore}/100 (${fallbackHealth.label})**. Outstanding receivables stand at ₹${(invoices.reduce((s, i) => s + (i.outstandingAmount || 0), 0) / 100000).toFixed(2)} Lakhs with current cash buffer of ₹${(business.currentCash / 100000).toFixed(2)} Lakhs.`,
      toolInvocations: [{ toolName: 'calculateBusinessHealth', arguments: {}, resultSummary: 'Local fallback engine' }],
      evidence: [{ metric: 'Health Score', value: `${fallbackHealth.overallScore}/100`, source: 'Health Engine' }],
    };
  }
}
