import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Play,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Clock,
  UserX,
  UserPlus,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  RotateCcw,
  Info,
  ShieldCheck,
  Building2,
  Save,
} from 'lucide-react';
import {
  Business,
  Customer,
  ScenarioParameters,
  SimulationResult,
  SavedScenarioRecord,
  CashRunwayEstimate,
} from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

interface SimulatorViewProps {
  business: Business;
  customers: Customer[];
  activeSimulation: SimulationResult | null;
  savedScenarios: SavedScenarioRecord[];
  resilienceIndex: {
    overallIndex: number;
    status: string;
    scenarioOutcomes: { title: string; survivesReserve: boolean; minCash: number; shortfall: number }[];
    primaryVulnerability: string;
  } | null;
  runway?: CashRunwayEstimate | null;
  onRunScenario: (params: ScenarioParameters) => Promise<void>;
  onSaveScenario: (title: string, params: ScenarioParameters, result: SimulationResult) => Promise<void>;
  onDeleteSavedScenario: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  business,
  customers,
  activeSimulation,
  savedScenarios,
  resilienceIndex,
  runway,
  onRunScenario,
  onSaveScenario,
  onDeleteSavedScenario,
  isLoading,
}) => {
  // Scenario Controls State
  const [scenarioType, setScenarioType] = useState<ScenarioParameters['type']>('CUSTOMER_PAYMENT_DELAY');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [delayDays, setDelayDays] = useState<number>(15);
  const [revenueDropPercent, setRevenueDropPercent] = useState<number>(20);
  const [expenseIncreasePercent, setExpenseIncreasePercent] = useState<number>(10);
  const [additionalRecurringCost, setAdditionalRecurringCost] = useState<number>(50000);
  const [simulationHorizon, setSimulationHorizon] = useState<30 | 60 | 90>(90);
  const [customTitle, setCustomTitle] = useState<string>('');

  // Tab & Save Modal State
  const [activeTab, setActiveTab] = useState<'simulator' | 'resilience' | 'saved'>('simulator');
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const presets = [
    {
      label: 'Apex Motors 15d Delay',
      params: {
        type: 'CUSTOMER_PAYMENT_DELAY' as const,
        title: 'Apex Motors 15-Day Payment Delay',
        customerId: customers[0]?.id,
        customerName: customers[0]?.name,
        delayDays: 15,
      },
    },
    {
      label: '20% Revenue Drop',
      params: {
        type: 'REVENUE_DROP' as const,
        title: '20% Next Quarter Sales Drop',
        dropPercentage: 20,
      },
    },
    {
      label: '₹50k/mo Equipment Lease',
      params: {
        type: 'EXPENSE_INCREASE' as const,
        title: '₹50k/mo Machine Lease Addition',
        increasePercentage: 15,
      },
    },
    {
      label: '10% Raw Material Surge',
      params: {
        type: 'EXPENSE_INCREASE' as const,
        title: '10% Raw Material Inflation',
        increasePercentage: 10,
      },
    },
    {
      label: 'Major Account Loss',
      params: {
        type: 'MAJOR_CUSTOMER_LOSS' as const,
        title: 'Loss of Apex Motors Account',
        lostCustomerId: customers[0]?.id,
        lostCustomerName: customers[0]?.name,
      },
    },
  ];

  const handleRun = async (paramsOverride?: ScenarioParameters) => {
    let params: ScenarioParameters;

    if (paramsOverride) {
      params = paramsOverride;
    } else {
      switch (scenarioType) {
        case 'CUSTOMER_PAYMENT_DELAY':
          params = {
            type: 'CUSTOMER_PAYMENT_DELAY',
            title: customTitle || `${selectedCustomer?.name || 'Top Customer'} ${delayDays}-Day Payment Delay`,
            customerId: selectedCustomerId,
            customerName: selectedCustomer?.name,
            delayDays,
          };
          break;
        case 'REVENUE_DROP':
          params = {
            type: 'REVENUE_DROP',
            title: customTitle || `${revenueDropPercent}% Revenue Reduction`,
            dropPercentage: revenueDropPercent,
          };
          break;
        case 'EXPENSE_INCREASE':
          params = {
            type: 'EXPENSE_INCREASE',
            title: customTitle || `+${expenseIncreasePercent}% Operating Cost Inflation`,
            increasePercentage: expenseIncreasePercent,
          };
          break;
        case 'MAJOR_CUSTOMER_LOSS':
          params = {
            type: 'MAJOR_CUSTOMER_LOSS',
            title: customTitle || `Loss of ${selectedCustomer?.name || 'Customer'} Account`,
            lostCustomerId: selectedCustomerId,
            lostCustomerName: selectedCustomer?.name,
          };
          break;
        case 'HIRING_DECISION':
          params = {
            type: 'HIRING_DECISION',
            title: customTitle || `Add ₹${additionalRecurringCost.toLocaleString()}/mo Recurring Cost`,
            hiringMonthlySalary: additionalRecurringCost,
            hiringCount: 1,
          };
          break;
        case 'CUSTOM_SCENARIO':
        default:
          params = {
            type: 'CUSTOM_SCENARIO',
            title: customTitle || 'Custom Financial Shock',
            customDelayDays: delayDays,
            customRevenueDropPct: revenueDropPercent,
            customExpenseIncreasePct: expenseIncreasePercent,
          };
          break;
      }
    }

    await onRunScenario(params);
  };

  const handleReset = () => {
    setScenarioType('CUSTOMER_PAYMENT_DELAY');
    setDelayDays(15);
    setRevenueDropPercent(20);
    setExpenseIncreasePercent(10);
    setAdditionalRecurringCost(50000);
    setSimulationHorizon(90);
    setCustomTitle('');
  };

  const handleSaveCurrent = async () => {
    if (!activeSimulation) return;
    const titleToUse = saveTitle.trim() || activeSimulation.scenarioName || 'Stress Test Scenario';
    await onSaveScenario(
      titleToUse,
      {
        type: scenarioType,
        title: titleToUse,
        delayDays,
        dropPercentage: revenueDropPercent,
      },
      activeSimulation
    );
    setIsSaving(false);
    setSaveTitle('');
  };

  // Chart data
  const chartData = activeSimulation?.points
    ? activeSimulation.points.map((pt) => ({
        date: pt.date.substring(5),
        baselineCash: pt.baselineCash,
        simulatedCash: pt.simulatedCash,
        minimumReserve: pt.minimumReserve,
      }))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dcd4f2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
            Interactive Crisis Simulator
          </h2>
          <p className="text-xs text-[#565d70] mt-0.5">
            Test custom financial shocks against your real receivables, vendor commitments, and safety buffers.
          </p>
        </div>

        {/* View Switcher: Simulator | Resilience Index | Saved */}
        <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex items-center text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                : 'text-[#483a7a] hover:text-[#212534]'
            }`}
          >
            Scenario Builder
          </button>
          <button
            onClick={() => setActiveTab('resilience')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'resilience'
                ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                : 'text-[#483a7a] hover:text-[#212534]'
            }`}
          >
            Resilience Index ({resilienceIndex?.overallIndex ?? 70}/100)
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                : 'text-[#483a7a] hover:text-[#212534]'
            }`}
          >
            Saved ({savedScenarios.length})
          </button>
        </div>
      </div>

      {activeTab === 'simulator' && (
        <>
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#7a6ab4] uppercase tracking-wider mr-1">
              Presets:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleRun(p.params)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534] flex items-center gap-1.5 transition-all bg-white/60 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#7a6ab4]" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* 2-Column Responsive Layout: Left Panel Controls + Right Panel Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel: Scenario Controls */}
            <div className="lg:col-span-5 space-y-5">
              <div className="neu-raised rounded-2xl p-5 sm:p-6 border border-[#d6d0e4] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#dcd4f2]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#7a6ab4]" />
                    <h3 className="text-sm font-extrabold text-[#212534] uppercase tracking-wider">
                      Scenario Controls
                    </h3>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-[#7a6ab4] hover:text-[#212534] flex items-center gap-1 cursor-pointer"
                    title="Reset to baseline values"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Scenario Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#483a7a] mb-1.5">
                    Shock Type
                  </label>
                  <select
                    value={scenarioType}
                    onChange={(e) => setScenarioType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-semibold text-[#212534]"
                  >
                    <option value="CUSTOMER_PAYMENT_DELAY">Customer Payment Delay</option>
                    <option value="REVENUE_DROP">Revenue / Sales Drop (%)</option>
                    <option value="EXPENSE_INCREASE">Expense / Cost Inflation (%)</option>
                    <option value="MAJOR_CUSTOMER_LOSS">Major Customer Account Loss</option>
                    <option value="HIRING_DECISION">Additional Recurring Cost (Lease/Hire)</option>
                    <option value="CUSTOM_SCENARIO">Combined Multi-Variable Shock</option>
                  </select>
                </div>

                {/* Dynamic Controls based on selected type */}
                {(scenarioType === 'CUSTOMER_PAYMENT_DELAY' || scenarioType === 'MAJOR_CUSTOMER_LOSS') && (
                  <div>
                    <label className="block text-xs font-bold text-[#483a7a] mb-1.5">
                      Target Customer
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-semibold text-[#212534]"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.revenueShare}% share • ₹{(c.outstandingAmount / 100000).toFixed(2)}L due)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scenarioType === 'CUSTOMER_PAYMENT_DELAY' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#483a7a]">
                        Payment Delay Duration
                      </label>
                      <span className="text-xs font-extrabold text-[#212534] px-2 py-0.5 rounded neu-inset-lavender">
                        {delayDays} Days
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={delayDays}
                      onChange={(e) => setDelayDays(Number(e.target.value))}
                      className="w-full h-2 bg-[#e4ddf4] rounded-lg appearance-none cursor-pointer accent-[#7a6ab4]"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-[#7a6ab4] font-semibold">Manual Days:</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={delayDays}
                        onChange={(e) => setDelayDays(Number(e.target.value))}
                        className="w-20 px-2.5 py-1 text-xs rounded-lg neu-input font-bold"
                      />
                    </div>
                  </div>
                )}

                {scenarioType === 'REVENUE_DROP' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#483a7a]">
                        Revenue Reduction
                      </label>
                      <span className="text-xs font-extrabold text-[#b95d77] px-2 py-0.5 rounded neu-inset-blush">
                        {revenueDropPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={revenueDropPercent}
                      onChange={(e) => setRevenueDropPercent(Number(e.target.value))}
                      className="w-full h-2 bg-[#f8eaef] rounded-lg appearance-none cursor-pointer accent-[#b95d77]"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-[#b95d77] font-semibold">Manual Drop %:</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={revenueDropPercent}
                        onChange={(e) => setRevenueDropPercent(Number(e.target.value))}
                        className="w-20 px-2.5 py-1 text-xs rounded-lg neu-input font-bold"
                      />
                    </div>
                  </div>
                )}

                {scenarioType === 'EXPENSE_INCREASE' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#483a7a]">
                        Operating Cost Inflation
                      </label>
                      <span className="text-xs font-extrabold text-[#b37346] px-2 py-0.5 rounded neu-inset-sm bg-[#faefe6]">
                        +{expenseIncreasePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={40}
                      step={5}
                      value={expenseIncreasePercent}
                      onChange={(e) => setExpenseIncreasePercent(Number(e.target.value))}
                      className="w-full h-2 bg-[#faefe6] rounded-lg appearance-none cursor-pointer accent-[#b37346]"
                    />
                  </div>
                )}

                {scenarioType === 'HIRING_DECISION' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#483a7a]">
                      Monthly Recurring Commitment (₹)
                    </label>
                    <input
                      type="number"
                      value={additionalRecurringCost}
                      onChange={(e) => setAdditionalRecurringCost(Number(e.target.value))}
                      step={5000}
                      className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-bold text-[#212534]"
                    />
                  </div>
                )}

                {scenarioType === 'CUSTOM_SCENARIO' && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-[#483a7a] block mb-1">Delay (d)</label>
                        <input
                          type="number"
                          value={delayDays}
                          onChange={(e) => setDelayDays(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg neu-input text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#483a7a] block mb-1">Drop %</label>
                        <input
                          type="number"
                          value={revenueDropPercent}
                          onChange={(e) => setRevenueDropPercent(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg neu-input text-xs font-bold text-[#b95d77]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#483a7a] block mb-1">Cost %</label>
                        <input
                          type="number"
                          value={expenseIncreasePercent}
                          onChange={(e) => setExpenseIncreasePercent(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg neu-input text-xs font-bold text-[#b37346]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulation Horizon */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#483a7a] mb-1.5">
                    Simulation Horizon
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[30, 60, 90].map((horizon) => (
                      <button
                        key={horizon}
                        type="button"
                        onClick={() => setSimulationHorizon(horizon as any)}
                        className={`py-2 rounded-xl text-center font-bold transition-all cursor-pointer ${
                          simulationHorizon === horizon
                            ? 'bg-white text-[#212534] neu-raised-sm'
                            : 'neu-btn text-[#483a7a] bg-white/40'
                        }`}
                      >
                        {horizon} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visible Assumptions Box */}
                <div className="p-3.5 rounded-xl bg-white/60 text-xs text-[#565d70] space-y-1.5 border border-[#dcd4f2]">
                  <div className="font-bold text-[#483a7a] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#7a6ab4]" />
                    Baseline Parameters
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#565d70]">Liquid Cash:</span>
                    <strong className="text-[#212534]">₹{(((business.liquidCash ?? business.currentCash ?? 540000) / 100000)).toFixed(2)}L</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#565d70]">Min Reserve Buffer:</span>
                    <strong className="text-[#212534]">₹{(((business.minimumReserve ?? business.minimumCashReserve ?? 300000) / 100000)).toFixed(2)}L</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#565d70]">Monthly Expenses:</span>
                    <strong className="text-[#212534]">
                      {typeof (business.monthlyExpenses ?? runway?.monthlyExpenses ?? runway?.averageMonthlyBurn) === 'number'
                        ? `₹${(((business.monthlyExpenses ?? runway?.monthlyExpenses ?? runway?.averageMonthlyBurn)! / 100000)).toFixed(2)}L`
                        : '—'}
                    </strong>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleRun()}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isLoading ? 'Simulating Impact...' : 'Run Stress Simulation'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Impact Results */}
            <div className="lg:col-span-7 space-y-5">
              {activeSimulation ? (
                <>
                  {/* Status Banner */}
                  {activeSimulation.reserveBreach ? (
                    <div className="neu-card-blush p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl neu-inset-blush flex items-center justify-center text-[#b95d77] shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-[#b95d77]">
                            Safety Buffer Breached (Shortfall: ₹{(((activeSimulation.breachAmount ?? 0) / 100000)).toFixed(2)}L)
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#f8eaef] text-[#733045] border border-[#edd4dc]">
                            Risk: {activeSimulation.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-[#733045] mt-1 leading-relaxed font-medium">
                          Under this scenario, liquid cash drops below your ₹{(((business.minimumReserve ?? business.minimumCashReserve ?? 300000) / 100000)).toFixed(1)}L minimum reserve on{' '}
                          <strong className="text-[#212534]">{activeSimulation.simulatedLowestDate}</strong> for approximately{' '}
                          <strong className="text-[#212534]">{activeSimulation.breachDurationDays} days</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="neu-card-sage p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl neu-inset-sage flex items-center justify-center text-[#3f7b58] shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-[#235237]">
                            Resilient Outcome: Minimum Reserve Maintained
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">
                            Resilience: {activeSimulation.resilienceScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-[#235237]/80 mt-1 leading-relaxed font-medium">
                          Cash reaches a low of ₹{(((activeSimulation.simulatedMinCash ?? 0) / 100000)).toFixed(2)}L on{' '}
                          <strong className="text-[#212534]">{activeSimulation.simulatedLowestDate}</strong>, preserving an estimated cushion of ₹
                          {((((activeSimulation.simulatedMinCash ?? 0) - (business.minimumReserve ?? business.minimumCashReserve ?? 300000)) / 100000)).toFixed(2)}L above reserve buffer.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Before / After Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="neu-card-lavender p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#483a7a] block mb-1">
                        Baseline Min Cash
                      </span>
                      <div className="text-lg font-extrabold text-[#212534]">
                        ₹{(((activeSimulation.baselineMinCash ?? 0) / 100000)).toFixed(2)}L
                      </div>
                      <span className="text-[10px] text-[#7a6ab4] font-medium mt-0.5 block">Standard runway</span>
                    </div>

                    <div className="neu-card-blue p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2c4d72] block mb-1">
                        Stressed Min Cash
                      </span>
                      <div className="text-lg font-extrabold text-[#212534]">
                        ₹{(((activeSimulation.simulatedMinCash ?? 0) / 100000)).toFixed(2)}L
                      </div>
                      <span className="text-[10px] text-[#4a75a5] font-medium mt-0.5 block">
                        Low: {activeSimulation.simulatedLowestDate}
                      </span>
                    </div>

                    <div className="neu-card-blush p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#733045] block mb-1">
                        Net Cash Drawdown
                      </span>
                      <div
                        className={`text-lg font-extrabold ${
                          (activeSimulation.cashDifference ?? 0) < 0 ? 'text-[#b95d77]' : 'text-[#3f7b58]'
                        }`}
                      >
                        {(activeSimulation.cashDifference ?? 0) < 0 ? '-' : '+'}₹
                        {((Math.abs(activeSimulation.cashDifference ?? 0)) / 100000).toFixed(2)}L
                      </div>
                      <span className="text-[10px] text-[#733045] font-medium mt-0.5 block">Drawdown vs base</span>
                    </div>

                    <div className="neu-card-sage p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#235237] block mb-1">
                        Reserve Buffer
                      </span>
                      <div
                        className={`text-lg font-extrabold ${
                          activeSimulation.reserveBreach ? 'text-[#b95d77]' : 'text-[#3f7b58]'
                        }`}
                      >
                        {activeSimulation.reserveBreach ? 'Breached' : 'Protected'}
                      </div>
                      <span className="text-[10px] text-[#235237]/80 font-medium mt-0.5 block">
                        {activeSimulation.reserveBreach ? `${activeSimulation.breachDurationDays} days` : 'Zero breach'}
                      </span>
                    </div>
                  </div>

                  {/* Cash-Flow Comparison Chart */}
                  <div className="neu-raised p-5 sm:p-6 rounded-2xl border border-[#d6d0e4] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#dcd4f2]">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#212534]">
                          Cash-Flow Trajectory Comparison
                        </h4>
                        <p className="text-xs text-[#565d70]">
                          Baseline forecast vs stressed crisis trajectory over 90 days
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4a75a5]" />
                          <span className="text-[#4a75a5] font-semibold">Baseline</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7a6ab4]" />
                          <span className="text-[#483a7a] font-bold">Stressed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#b37346]" />
                          <span className="text-[#b37346] font-bold">Reserve</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="neuSimGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7a6ab4" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#7a6ab4" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dcd4f2" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#7a6ab4', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={{ stroke: '#dcd4f2' }}
                          />
                          <YAxis
                            tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                            tick={{ fontSize: 10, fill: '#565d70' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            formatter={(value: any, name: string) => [
                              `₹${(Number(value) / 100000).toFixed(2)}L`,
                              name === 'simulatedCash'
                                ? 'Stressed Cash'
                                : name === 'baselineCash'
                                ? 'Baseline Cash'
                                : 'Target Reserve',
                            ]}
                            contentStyle={{
                              backgroundColor: '#ede9f7',
                              border: '1px solid #dcd4f2',
                              borderRadius: '12px',
                              boxShadow: '6px 6px 14px #d2cbe2, -6px -6px 14px #ffffff',
                              fontSize: '12px',
                              color: '#212534',
                            }}
                          />
                          <ReferenceLine
                            y={business.minimumReserve}
                            stroke="#b37346"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                          />
                          <Line
                            type="monotone"
                            dataKey="baselineCash"
                            stroke="#4a75a5"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="simulatedCash"
                            stroke="#7a6ab4"
                            strokeWidth={2.5}
                            fill="url(#neuSimGrad)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#7a6ab4', stroke: '#ffffff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#dcd4f2]">
                      <span className="text-xs text-[#565d70]">
                        Save this stress test for periodic tracking and management review.
                      </span>
                      <button
                        onClick={() => setIsSaving(true)}
                        className="px-3.5 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] flex items-center gap-1.5 cursor-pointer bg-white/60"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#7a6ab4]" />
                        <span>Save Scenario</span>
                      </button>
                    </div>
                  </div>

                  {/* Recommended Mitigations & Practical Actions */}
                  <div className="neu-raised p-5 sm:p-6 rounded-2xl border border-[#d6d0e4] space-y-3">
                    <h4 className="text-sm font-extrabold text-[#212534]">
                      Recommended Mitigations
                    </h4>
                    <div className="space-y-2.5">
                      {(activeSimulation.recommendedMitigations || []).map((mit, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-white/60 border border-[#dcd4f2] flex items-start gap-3"
                        >
                          <span className="font-mono text-xs font-bold text-[#7a6ab4] pt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-[#565d70] leading-relaxed font-medium">
                            {mit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="neu-raised p-12 rounded-2xl border border-[#d6d0e4] text-center space-y-3">
                  <SlidersHorizontal className="w-10 h-10 text-[#7a6ab4] mx-auto" />
                  <h3 className="text-base font-extrabold text-[#212534]">
                    No Simulation Currently Active
                  </h3>
                  <p className="text-xs text-[#565d70] max-w-md mx-auto font-medium">
                    Select a shock archetype or choose one of the instant presets above to compute working capital drawdown against verified invoice ledgers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resilience Index Tab */}
      {activeTab === 'resilience' && (
        <div className="space-y-6">
          <div className="neu-card-lavender p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl neu-inset-lavender flex items-center justify-center text-2xl font-extrabold text-[#483a7a]">
                {resilienceIndex?.overallIndex ?? 70}
              </div>
              <div>
                <span className="text-xs font-bold text-[#483a7a] uppercase tracking-wider">Enterprise Shock Tolerance</span>
                <h3 className="text-xl font-extrabold text-[#212534] mt-0.5">
                  {resilienceIndex?.status || 'MODERATE RESILIENCE'}
                </h3>
                <p className="text-xs text-[#7a6ab4] font-medium mt-1">
                  Primary Vulnerability: {resilienceIndex?.primaryVulnerability || 'Concentration on top corporate buyer'}
                </p>
              </div>
            </div>
          </div>

          <div className="neu-raised p-6 rounded-2xl border border-[#d6d0e4] space-y-4">
            <h3 className="text-base font-bold text-[#212534]">Automated Stress Battery Outcomes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(resilienceIndex?.scenarioOutcomes || []).map((sc, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/60 border border-[#dcd4f2] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#212534] block">{sc.title}</span>
                    <span className="text-[11px] text-[#565d70]">Min Cash: ₹{(sc.minCash / 100000).toFixed(2)}L</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    sc.survivesReserve ? 'bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]' : 'bg-[#f8eaef] text-[#733045] border border-[#edd4dc]'
                  }`}>
                    {sc.survivesReserve ? 'SURVIVED BUFFER' : `DEFICIT ₹${(sc.shortfall / 100000).toFixed(1)}L`}
                  </span>
                </div>
              ))}
              {(!resilienceIndex?.scenarioOutcomes || resilienceIndex.scenarioOutcomes.length === 0) && (
                <p className="text-xs text-[#565d70]">No stress batteries recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Scenarios Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {(savedScenarios || []).length === 0 ? (
            <div className="neu-raised p-12 rounded-2xl border border-[#d6d0e4] text-center space-y-2">
              <Bookmark className="w-8 h-8 text-[#7a6ab4] mx-auto" />
              <h3 className="font-bold text-sm text-[#212534]">No Saved Stress Tests</h3>
              <p className="text-xs text-[#565d70]">Run a simulation in the builder and click "Save Scenario" to track it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(savedScenarios || []).map((sc) => (
                <div key={sc.id} className="neu-raised p-5 rounded-2xl border border-[#d6d0e4] flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#7a6ab4] uppercase block">{sc.savedAt}</span>
                    <h4 className="font-extrabold text-sm text-[#212534] mt-0.5">{sc.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-[#565d70]">
                      <span>Lowest Cash: ₹{(sc.result.simulatedMinCash / 100000).toFixed(2)}L</span>
                      <span className={sc.result.reserveBreach ? 'text-[#b95d77]' : 'text-[#3f7b58]'}>
                        {sc.result.reserveBreach ? 'Breached' : 'Protected'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSavedScenario(sc.id)}
                    className="p-1.5 rounded-lg neu-btn text-[#733045] hover:text-[#b95d77] cursor-pointer"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Scenario Modal Dialog */}
      {isSaving && (
        <div className="fixed inset-0 bg-[#1c1829]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#ede9f7] rounded-2xl neu-raised p-6 max-w-md w-full border border-[#dcd4f2] space-y-4">
            <h3 className="text-base font-extrabold text-[#212534]">Save Stress Scenario</h3>
            <p className="text-xs text-[#565d70]">
              Provide a recognizable title to track this scenario outcome in your saved tests library.
            </p>
            <input
              type="text"
              placeholder="e.g. Apex Motors 30d Extended Lockdown"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl neu-input text-xs font-medium text-[#212534]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaving(false)}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#565d70]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrent}
                className="px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
