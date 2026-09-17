/**
 * MSME Sentinel - Core Type Definitions
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Business {
  id: string;
  name: string;
  industry: string;
  currency: CurrencyCode;
  currencySymbol: string;
  currentCash: number;
  minimumCashReserve: number;
  liquidCash?: number;
  minimumReserve?: number;
  monthlyExpenses?: number;
  monthlyRevenue?: number;
  createdAt: string;
  isDemo: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
  outstandingAmount: number;
  averagePaymentDelay: number; // in days (positive = late, negative = early)
  averagePaymentDelayDays?: number;
  medianPaymentDelay?: number;
  paymentReliability: 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  creditTermsDays?: number;
  revenueShare: number; // percentage e.g. 44.5%
  contactPerson?: string;
  email?: string;
}

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number;
  taxAmount?: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  extractionConfidence?: number; // 0 to 1
  daysOverdue?: number;
  lineItems?: InvoiceLineItem[];
  sourceDocument?: string;
}

export interface Payment {
  id: string;
  businessId: string;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  reference: string;
  paymentType: 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CASH' | 'OTHER';
  description?: string;
  reconciliationConfidence: number; // 0 to 1
  reconciliationStatus: 'MATCHED' | 'PARTIAL' | 'UNMATCHED' | 'NEEDS_REVIEW';
  possibleMatches?: { invoiceId: string; invoiceNumber: string; customerName: string; confidence: number; reason: string }[];
}

export type ExpenseCategory =
  | 'PAYROLL'
  | 'RENT'
  | 'UTILITIES'
  | 'RAW_MATERIALS'
  | 'MACHINERY_MAINTENANCE'
  | 'LOGISTICS'
  | 'TAXES_STATUTORY'
  | 'MARKETING'
  | 'OFFICE_SUPPLIES'
  | 'OTHER';

export interface Expense {
  id: string;
  businessId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string;
  recurring: boolean;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
  critical: boolean; // cannot be deferred (payroll, statutory, factory power)
  description?: string;
}

export interface Sale {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  category?: string;
}

export interface AgingBucket {
  name: 'Current' | '1-7 days' | '8-30 days' | '31-60 days' | '60+ days';
  amount: number;
  count: number;
  percentage: number;
}

export interface ReceivablesAnalysis {
  totalReceivables: number;
  overdueAmount: number;
  overdueCount: number;
  currentAmount: number;
  averagePaymentDelay: number;
  medianPaymentDelay: number;
  agingBuckets: AgingBucket[];
  dso: number; // Days Sales Outstanding
  dsoDays?: number;
  overdueRate?: number;
}

export interface ConcentrationMetric {
  top1CustomerShare: number;
  top1CustomerName: string;
  top3CustomerShare: number;
  totalCustomers: number;
  hasDangerousDependency: boolean;
}

export interface RevenueStabilityAnalysis {
  monthlyAverage: number;
  monthlyTrends: { month: string; amount: number; growthRate: number }[];
  revenueVolatility: number; // standard deviation / mean
  trend: 'GROWING' | 'STABLE' | 'DECLINING';
}

export interface ExpensePressureAnalysis {
  monthlyExpenses: number;
  recurringExpenses: number;
  criticalExpenses: number;
  expenseToRevenueRatio: number;
  breakdownByCategory: { category: ExpenseCategory; amount: number; percentage: number }[];
  growthRateMom: number;
}

export interface CashRunwayEstimate {
  months: number | null; // null if insufficient data or cash flow positive
  monthsOfRunway?: number | null;
  days: number | null;
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CASH_FLOW_POSITIVE' | 'INSUFFICIENT_DATA';
  label: string;
  assumptions: string;
  monthlyBurnRate: number;
  averageMonthlyBurn?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  standaloneMonths?: number;
  zeroCashDate?: string;
}

export interface HealthScoreComponent {
  id: 'cash_stability' | 'receivables_health' | 'payment_delays' | 'customer_concentration' | 'revenue_stability' | 'expense_pressure';
  name: string;
  score: number; // 0-100
  weight: number; // decimal e.g. 0.20
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  currentMetricValue: string;
  idealBenchmark: string;
  impactExplanation: string;
  suggestedImprovement: string;
}

export interface HealthScoreHistoryPoint {
  date: string; // YYYY-MM-DD
  label: string; // "Apr '26", "May '26", etc.
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  status: 'Resilient' | 'Stable' | 'Vulnerable' | 'High Risk' | 'Critical Alert';
  cashStabilityScore: number;
  receivablesScore: number;
  concentrationScore: number;
  paymentDelaysScore: number;
  revenueConsistencyScore: number;
  costPressureScore: number;
  changeFromPrevious?: number;
  operationalMilestone?: string;
}

export interface BusinessHealthScore {
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  label: 'Resilient' | 'Stable' | 'Vulnerable' | 'High Risk' | 'Critical Alert';
  components: HealthScoreComponent[];
  calculatedAt: string;
  summary: string;
  disclaimer: string;
  history?: HealthScoreHistoryPoint[];
  trend?: 'IMPROVING' | 'DECLINING' | 'STABLE';
  scoreChange?: number; // net point change across historical period
  trendDescription?: string;
  dataConfidenceAssessment?: DataConfidenceAssessment;
}

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskType =
  | 'CASH_RESERVE_BREACH'
  | 'RECEIVABLES_OVERDUE'
  | 'CUSTOMER_CONCENTRATION'
  | 'PAYMENT_DELAY_TREND'
  | 'REVENUE_INSTABILITY'
  | 'EXPENSE_PRESSURE'
  | 'CUSTOMER_DEPENDENCY';

export interface DetectedRisk {
  id: string;
  businessId: string;
  riskType: RiskType;
  severity: RiskSeverity;
  title: string;
  metric: string;
  numericalEvidence: string;
  explanation: string;
  affectedMetric: string;
  recommendedAction: string;
  createdAt: string;
}

export interface ForecastPoint {
  date: string; // YYYY-MM-DD
  dayIndex: number;
  openingCash: number;
  expectedInflows: number;
  expectedOutflows: number;
  projectedCash: number;
  minimumReserve: number;
  isBreach: boolean;
  actual?: number; // if historical point
}

export interface CashFlowForecast {
  horizonDays: 30 | 60 | 90;
  openingCash: number;
  minimumReserve: number;
  totalProjectedInflows: number;
  totalProjectedOutflows: number;
  netCashFlow: number;
  lowestProjectedCash: number;
  lowestCashDate: string;
  reserveBreachExpected: boolean;
  breachStartDate?: string;
  forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceExplanation: string;
  points: ForecastPoint[];
}

export type ScenarioType =
  | 'CUSTOMER_PAYMENT_DELAY'
  | 'REVENUE_DROP'
  | 'EXPENSE_INCREASE'
  | 'MAJOR_CUSTOMER_LOSS'
  | 'HIRING_DECISION'
  | 'CUSTOM_SCENARIO';

export interface ScenarioParameters {
  type: ScenarioType;
  title: string;
  // Delay scenario
  customerId?: string;
  customerName?: string;
  delayDays?: number; // 7, 15, 30, or custom
  customDelayDays?: number;
  // Revenue drop
  revenueDropPercent?: number; // e.g. 20 for 20%
  dropPercentage?: number;
  customRevenueDropPct?: number;
  // Expense increase
  expenseIncreasePercent?: number; // e.g. 10 for 10%
  increasePercentage?: number;
  customExpenseIncreasePct?: number;
  expenseCategory?: ExpenseCategory | 'ALL';
  customCapexAmount?: number;
  // Major customer loss
  lostCustomerId?: string;
  lostCustomerName?: string;
  // Hiring decision
  hiringMonthlySalary?: number;
  hiringJoiningDate?: string;
  hiringCount?: number;
  // Custom combined parameters
  customNotes?: string;
}

export interface SavedScenarioRecord {
  id: string;
  title: string;
  parameters: ScenarioParameters;
  result: SimulationResult;
  savedAt: string;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioTitle: string;
  parameters: ScenarioParameters;
  horizonDays: number;
  baselineMinCash: number;
  baselineLowestDate: string;
  simulatedMinCash: number;
  simulatedLowestDate: string;
  cashDifference: number; // simulated - baseline (usually negative)
  reserveBreach: boolean;
  breachAmount: number; // how much below minimum reserve
  breachDurationDays: number;
  affectedRevenue: number;
  affectedExpenses: number;
  affectedReceivables: number;
  riskLevel: RiskSeverity;
  resilienceScore: number; // 0 to 100
  points: {
    date: string;
    dayIndex: number;
    baselineCash: number;
    simulatedCash: number;
    minimumReserve: number;
    inflowImpact: number;
    outflowImpact: number;
  }[];
  calculatedAt: string;
}

export interface ScenarioComparison {
  baseline: {
    minCash: number;
    lowestDate: string;
    endCash: number;
    reserveBreached: boolean;
  };
  scenario: {
    minCash: number;
    lowestDate: string;
    endCash: number;
    reserveBreached: boolean;
  };
  difference: {
    minCashDiff: number;
    endCashDiff: number;
    reserveShortfall: number;
    bufferImpactPercent: number;
  };
  dangerPeriod?: {
    start: string;
    end: string;
    durationDays: number;
    worstShortfall: number;
  };
}

export type ActionItemCategory = 'CASH_BUFFER' | 'RECEIVABLES' | 'COST_CONTROL' | 'CUSTOMER_DIVERSIFICATION' | 'OPERATIONS';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: ActionItemCategory;
  evidence: string;
  impactScore: number; // 1-10
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'COMPLETED';
}

export interface DataConfidenceAssessment {
  overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  overallScore?: number; // alias for score
  historicalTimeSpanDays: number;
  invoiceCount: number;
  reconciledInvoicesCount?: number; // alias for invoiceCount
  paymentCount: number;
  reconciliationQualityScore: number;
  expenseCompletenessScore: number;
  summaryExplanation: string;
  missingDataWarnings: string[];
}

export interface ExtractedInvoicePayload {
  invoiceId: string | null;
  customerName: string | null;
  customerId?: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  totalAmount: number | null;
  taxAmount: number | null;
  outstandingAmount: number | null;
  paymentStatus: InvoiceStatus | null;
  lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[];
  extractionConfidence: number;
  warnings: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolInvocations?: {
    toolName: string;
    arguments: Record<string, unknown>;
    resultSummary?: string;
  }[];
  evidence?: {
    metric: string;
    value: string;
    source: string;
  }[];
  scenarioResult?: SimulationResult;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'WORKING_CAPITAL' | 'RECEIVABLES_MANAGEMENT' | 'CONCENTRATION_RISK' | 'CASH_RUNWAY' | 'PAYMENT_TERMS';
  summary: string;
  explanation: string;
  practicalAction: string;
  formulaOrMetric?: string;
}
