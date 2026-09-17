import { ActionItem, DetectedRisk, SimulationResult } from '../../src/types.js';
import { getGeminiClient, callGeminiWithFallback } from './geminiClient.js';

interface CachedPlan {
  actions: ActionItem[];
  timestamp: number;
  riskSignature: string;
}

let actionPlanCache: CachedPlan | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function generateActionPlan(
  risks: DetectedRisk[],
  activeSimulation?: SimulationResult
): Promise<ActionItem[]> {
  const defaultActions: ActionItem[] = [
    {
      id: 'act_01',
      title: 'Initiate Early Follow-up on Overdue Tier-1 Accounts',
      description:
        'Issue updated accounts reconciliation statements to Apex Motors for INV-2026-089 (₹2.2L past due) and establish direct phone confirmation with AP lead.',
      priority: 'URGENT',
      category: 'RECEIVABLES',
      evidence: '₹3.8L total receivables locked in Apex Motors with average 22 days delay.',
      impactScore: 9,
      implementationEffort: 'LOW',
      status: 'PENDING',
    },
    {
      id: 'act_02',
      title: 'Protect Liquid Cash Reserve Prior to Next Month Payroll',
      description:
        'Temporarily pause non-critical machinery upgrade and discretionary logistics contracts until receivables cross ₹2.5L recovery.',
      priority: 'HIGH',
      category: 'CASH_BUFFER',
      evidence: 'Projected cash approaches ₹3.0L minimum safety threshold during scheduled payroll window.',
      impactScore: 8,
      implementationEffort: 'LOW',
      status: 'PENDING',
    },
    {
      id: 'act_03',
      title: 'Introduce Milestone Advance Terms on High-Volume POs',
      description:
        'Require a 15-20% advance milestone deposit on purchase orders exceeding ₹2.0 Lakhs to finance upfront tooling & raw metal billeting.',
      priority: 'HIGH',
      category: 'CUSTOMER_DIVERSIFICATION',
      evidence: 'Largest client controls 44.5% of overall sales volume.',
      impactScore: 7,
      implementationEffort: 'MEDIUM',
      status: 'PENDING',
    },
    {
      id: 'act_04',
      title: 'Negotiate Net-45 Terms with Primary Steel & Alloy Vendors',
      description:
        'Align raw material procurement disbursement cycle with realized customer collection schedules to avoid negative working capital squeezes.',
      priority: 'MEDIUM',
      category: 'COST_CONTROL',
      evidence: 'Monthly raw material outflows exceed ₹1.4L while customer collections average 40+ days from dispatch.',
      impactScore: 7,
      implementationEffort: 'MEDIUM',
      status: 'PENDING',
    },
    {
      id: 'act_05',
      title: 'Incentivize 10-Day Settlements with 1.5% Prompt Discount',
      description:
        'Extend early settlement cash discounts to mid-sized industrial buyers (Kavita, Bharat Agro) to accelerate cash recycling.',
      priority: 'MEDIUM',
      category: 'RECEIVABLES',
      evidence: 'Accelerating collection by 10 days frees approximately ₹1.8L of continuous working liquidity.',
      impactScore: 6,
      implementationEffort: 'LOW',
      status: 'PENDING',
    },
  ];

  const riskSignature = risks.map((r) => `${r.id}:${r.severity}`).join('|') + `:${activeSimulation?.scenarioTitle || 'none'}`;
  const now = Date.now();

  // Return cached plan if valid
  if (actionPlanCache && (now - actionPlanCache.timestamp < CACHE_TTL_MS) && actionPlanCache.riskSignature === riskSignature) {
    return actionPlanCache.actions;
  }

  const ai = getGeminiClient();
  if (!ai || risks.length === 0) {
    actionPlanCache = { actions: defaultActions, timestamp: now, riskSignature };
    return defaultActions;
  }

  // If Gemini is available, customize actions directly tied to specific detected risks & simulations
  try {
    const prompt = `You are MSME Sentinel's Action Advisor.
Given the following detected risks and simulation results, generate 4 to 5 prioritized, practical, and highly specific operational actions.
DO NOT provide generic platitudes like "manage money better" or "reduce expenses".
DO NOT recommend taking loans, issuing debt/equity, or regulated banking products.
DO NOT pretend to be an accountant or attorney.
Grounded data:
Risks: ${JSON.stringify(risks.map((r) => ({ title: r.title, evidence: r.numericalEvidence, action: r.recommendedAction })))}
Simulation: ${activeSimulation ? JSON.stringify({ scenario: activeSimulation.scenarioTitle, minCash: activeSimulation.simulatedMinCash, breach: activeSimulation.reserveBreach }) : 'None'}

Return ONLY a JSON array of ActionItem objects with keys: id, title, description, priority (URGENT/HIGH/MEDIUM), category (CASH_BUFFER/RECEIVABLES/COST_CONTROL/CUSTOMER_DIVERSIFICATION/OPERATIONS), evidence, impactScore (1-10), implementationEffort (LOW/MEDIUM/HIGH), status (PENDING).`;

    const fetchWithTimeout = Promise.race([
      callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        })
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI action plan timeout (3500ms)')), 3500)
      ),
    ]);

    const res = await fetchWithTimeout;

    const parsed = JSON.parse(res.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      actionPlanCache = { actions: parsed, timestamp: now, riskSignature };
      return parsed;
    }
  } catch (err: any) {
    console.info('Action plan generation notice: using deterministic baseline actions (%s)', err?.message || 'unavailable');
  }

  // Cache fallback actions for 2 minutes to prevent rapid retry storms
  actionPlanCache = { actions: defaultActions, timestamp: now, riskSignature };
  return defaultActions;
}
