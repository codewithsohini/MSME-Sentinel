import React from 'react';
import {
  Wallet,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowDownRight,
  Users,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';
import {
  Business,
  BusinessHealthScore,
  DetectedRisk,
  ReceivablesAnalysis,
  ConcentrationMetric,
  CashFlowForecast,
  CashRunwayEstimate,
  ActionItem,
  Invoice,
} from '../types';
import { HealthScoreTrendChart } from './HealthScoreTrendChart';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface OverviewViewProps {
  business: Business;
  healthScore: BusinessHealthScore | null;
  risks: DetectedRisk[];
  receivables: ReceivablesAnalysis | null;
  concentration: ConcentrationMetric | null;
  forecast: CashFlowForecast | null;
  runway: CashRunwayEstimate | null;
  actions?: ActionItem[];
  invoices?: Invoice[];
  onOpenHealthModal: () => void;
  onOpenSimulator: () => void;
  onOpenReceivables: () => void;
  onOpenCustomers: () => void;
  onOpenActionPlan: () => void;
  onToggleAction?: (id: string) => void;
  onNavigateToSimulator?: (presetParams?: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  business,
  healthScore,
  risks,
  receivables,
  concentration,
  forecast,
  runway,
  actions = [],
  invoices,
  onOpenHealthModal,
  onOpenSimulator,
  onOpenReceivables,
  onOpenCustomers,
  onOpenActionPlan,
  onToggleAction,
  onNavigateToSimulator,
  onNavigateToTab,
}) => {
  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Format currency helpers (INR Lakhs)
  const formatLakhs = (val?: number | null) => (typeof val === 'number' ? `₹${(val / 100000).toFixed(2)}L` : '—');

  // Dynamic financial values from authoritative sources (no hardcoded fallbacks)
  const currentCash = business.liquidCash ?? business.currentCash;
  const totalReceivables = receivables?.totalReceivables;
  const overdueAmount = receivables?.overdueAmount;
  const monthlyRevenue = business.monthlyRevenue ?? runway?.monthlyRevenue;
  const monthlyExpenses = business.monthlyExpenses ?? runway?.monthlyExpenses ?? runway?.averageMonthlyBurn;
  const topCustomerShare = concentration?.top1CustomerShare;
  const topCustomerName = concentration?.top1CustomerName;

  const openInvoicesCount = invoices
    ? invoices.filter((i) => (i.outstandingAmount ?? 0) > 0).length
    : (receivables?.agingBuckets ? receivables.agingBuckets.reduce((sum, b) => sum + b.count, 0) : undefined);

  const over30dCount = invoices
    ? invoices.filter((i) => (i.daysOverdue ?? 0) > 30 && (i.outstandingAmount ?? 0) > 0).length
    : (receivables?.agingBuckets
        ? receivables.agingBuckets
            .filter((b) => b.name === '31-60 days' || b.name === '60+ days')
            .reduce((sum, b) => sum + b.count, 0)
        : undefined);

  const dsoValue = receivables?.dso ?? receivables?.dsoDays;
  const overdueRateValue = receivables?.overdueRate;

  // Recharts cashflow chart data
  const chartData = forecast?.points
    ? forecast.points.map((p) => ({
        date: p.date.substring(5), // MM-DD
        projectedCash: p.projectedCash,
        minimumReserve: p.minimumReserve,
        // Add baseline historical simulated point for comparison
        historicalCash: p.isHistorical ? p.projectedCash : undefined,
      }))
    : [];

  const handleSimulate = (params?: any) => {
    if (onNavigateToSimulator) {
      onNavigateToSimulator(params);
    } else {
      onOpenSimulator();
    }
  };

  const score = healthScore?.overallScore ?? 56;
  const statusLabel = healthScore?.label ?? (score >= 85 ? 'Resilient' : score >= 75 ? 'Stable' : score >= 60 ? 'Vulnerable' : score >= 45 ? 'High Risk' : 'Critical Alert');

  // Status color mapping for neumorphic theme
  const getStatusBadgeClass = () => {
    if (score >= 75) return 'bg-[#e2ede7] text-[#438466] border border-[#438466]/30';
    if (score >= 60) return 'bg-[#f8f1e5] text-[#b3853b] border border-[#b3853b]/30';
    return 'bg-[#faeaea] text-[#b35353] border border-[#b35353]/30';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Main Page Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#222634] tracking-tight">
          {greeting}, {business.name}
        </h2>
        <p className="text-sm text-[#6e7687] mt-1">
          Here is what is happening across your business today.
        </p>
      </div>

      {/* 2. Health Score Section (Visual Anchor Centerpiece - Soft Lavender Surface) */}
      <section className="neu-card-lavender p-6 sm:p-7 relative overflow-hidden">
        {/* Soft background radial shine */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/40 blur-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Score Dial & Numbers */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:pr-8 lg:border-r border-[#dcd4f2]">
            {/* Subtle Neumorphic Meter with soft lavender track & sage/lavender indicator */}
            <div className="relative w-28 h-28 rounded-full neu-inset-lavender flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="#ded7ef"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke={score >= 75 ? '#3f7b58' : score >= 60 ? '#b37346' : '#b95d77'}
                  strokeWidth="8"
                  strokeDasharray={238.7}
                  strokeDashoffset={238.7 - (238.7 * score) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-[#212534] tracking-tight">
                  {score}
                </span>
                <span className="text-[10px] font-bold text-[#7a6ab4] uppercase tracking-wider">
                  / 100
                </span>
              </div>
            </div>

            {/* Score Context & Title */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7a6ab4]">
                  Business Health
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  score >= 75
                    ? 'bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]'
                    : score >= 60
                    ? 'bg-[#faefe5] text-[#734220] border border-[#eddccf]'
                    : 'bg-[#f8eaef] text-[#733045] border border-[#edd4dc]'
                }`}>
                  {statusLabel}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#212534] tracking-tight">
                MSME Working Capital Resilience
              </h3>

              <div className="mt-1.5 flex items-center gap-3 text-xs text-[#565d70]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#235237]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3f7b58]" />
                  <span>
                    {healthScore?.scoreChange !== undefined
                      ? `${healthScore.scoreChange >= 0 ? `+${healthScore.scoreChange}` : healthScore.scoreChange} pts over 6 mo`
                      : 'Trajectory: Stable'}
                  </span>
                </span>
                <span>•</span>
                <span className="text-[11px] text-[#7a6ab4] font-medium">
                  Grade {healthScore?.grade ?? (score >= 85 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D')}
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right: Explanation & Action */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-[#7a6ab4] uppercase tracking-wider">
                  Deterministic Financial Diagnostic
                </span>
              </div>
              <p className="text-sm text-[#483a7a] leading-relaxed font-medium">
                {healthScore?.summary ||
                  'Business Health Score evaluation based on deterministic liquidity and invoice settlement drivers.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#dcd4f2]">
              <div className="text-xs text-[#565d70]">
                Synthesized across 6 deterministic liquidity, concentration, and invoice settlement drivers.
              </div>

              <button
                onClick={onOpenHealthModal}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534] flex items-center gap-1.5 cursor-pointer bg-white/50"
              >
                <span>View score breakdown</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#7a6ab4]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Six Visually Distinct Metric Cards (Assigned Color Personalities) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Current Cash -> Soft Sage Surface */}
        <div
          onClick={() => (onNavigateToTab ? onNavigateToTab('cashflow') : onOpenSimulator())}
          className="neu-card-sage p-4 sm:p-5 cursor-pointer hover:border-[#b4d5c2] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#235237]">Current Cash</span>
            <div className="w-8 h-8 rounded-lg neu-inset-sage flex items-center justify-center text-[#3f7b58]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#212534] tracking-tight">
            {formatLakhs(currentCash)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#3f7b58] font-semibold">
              {currentCash && (business.minimumReserve ?? business.minimumCashReserve)
                ? currentCash >= (business.minimumReserve ?? business.minimumCashReserve!)
                  ? `+₹${(((currentCash - (business.minimumReserve ?? business.minimumCashReserve!))) / 100000).toFixed(2)}L buffer`
                  : `-₹${((((business.minimumReserve ?? business.minimumCashReserve!) - currentCash)) / 100000).toFixed(2)}L deficit`
                : 'Current liquid'}
            </span>
            <span className="text-[#235237]/70 font-medium">
              {runway?.status === 'CASH_FLOW_POSITIVE'
                ? 'Cash Flow Positive'
                : (typeof runway?.months === 'number'
                    ? `${runway.months} mo runway`
                    : (runway?.label || '—'))}
            </span>
          </div>
        </div>

        {/* Metric 2: Outstanding Receivables -> Soft Lavender Surface */}
        <div
          onClick={onOpenReceivables}
          className="neu-card-lavender p-4 sm:p-5 cursor-pointer hover:border-[#c5bdd8] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#483a7a]">Receivables</span>
            <div className="w-8 h-8 rounded-lg neu-inset-lavender flex items-center justify-center text-[#7a6ab4]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#212534] tracking-tight">
            {formatLakhs(totalReceivables)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#7a6ab4] font-semibold">
              {typeof openInvoicesCount === 'number' ? `${openInvoicesCount} open ${openInvoicesCount === 1 ? 'invoice' : 'invoices'}` : '—'}
            </span>
            <span className="text-[#483a7a]/70 font-medium">
              DSO: {typeof dsoValue === 'number' ? `${dsoValue} days` : '—'}
            </span>
          </div>
        </div>

        {/* Metric 3: Overdue Amount -> Soft Blush / Rose Surface */}
        <div
          onClick={onOpenReceivables}
          className="neu-card-blush p-4 sm:p-5 cursor-pointer hover:border-[#dfcad3] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#733045]">Overdue Balance</span>
            <div className="w-8 h-8 rounded-lg neu-inset-blush flex items-center justify-center text-[#b95d77]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#b95d77] tracking-tight">
            {formatLakhs(overdueAmount)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#b95d77] font-semibold">
              {typeof over30dCount === 'number' ? `${over30dCount} ${over30dCount === 1 ? 'invoice' : 'invoices'} >30d` : '—'}
            </span>
            <span className="text-[#733045]/70 font-medium">
              {typeof overdueRateValue === 'number' ? `${overdueRateValue.toFixed(1)}% rate` : '—'}
            </span>
          </div>
        </div>

        {/* Metric 4: Monthly Revenue -> Soft Powder-Blue Surface */}
        <div className="neu-card-blue p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#2c4d72]">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-lg neu-inset-blue flex items-center justify-center text-[#4a75a5]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#212534] tracking-tight">
            {formatLakhs(monthlyRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#4a75a5] font-semibold">
              {invoices && invoices.length > 0 ? `${invoices.length} total invoices` : 'Monthly avg'}
            </span>
            <span className="text-[#2c4d72]/70 font-medium">
              {concentration?.totalCustomers ? `${concentration.totalCustomers} active clients` : '—'}
            </span>
          </div>
        </div>

        {/* Metric 5: Monthly Expenses -> Soft Peach Surface */}
        <div className="neu-card-peach p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#734220]">Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg neu-inset-peach flex items-center justify-center text-[#b37346]">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#212534] tracking-tight">
            {formatLakhs(monthlyExpenses)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#b37346] font-semibold">
              {runway?.averageMonthlyBurn ? `Burn: ₹${(runway.averageMonthlyBurn / 100000).toFixed(2)}L/mo` : 'Operating burn'}
            </span>
            <span className="text-[#734220]/70 font-medium">Monthly avg</span>
          </div>
        </div>

        {/* Metric 6: Largest Customer Share -> Soft Lavender Surface */}
        <div
          onClick={onOpenCustomers}
          className="neu-card-lavender p-4 sm:p-5 cursor-pointer hover:border-[#c5bdd8] transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#483a7a]">Top Customer</span>
            <div className="w-8 h-8 rounded-lg neu-inset-lavender flex items-center justify-center text-[#7a6ab4]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#212534] tracking-tight">
            {typeof topCustomerShare === 'number' ? `${topCustomerShare.toFixed(1)}%` : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#7a6ab4] font-semibold truncate max-w-[90px]">{topCustomerName || '—'}</span>
            <span className="text-[#483a7a]/70 font-medium">
              {concentration?.top3CustomerShare ? `Top 3: ${concentration.top3CustomerShare.toFixed(1)}%` : 'Revenue share'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Cash-Flow Outlook Chart (Soft Powder Blue Tinted Card) */}
      <section className="neu-card-blue p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d0e0f2]">
          <div>
            <h3 className="text-base font-bold text-[#212534]">
              Cash Flow Outlook & Liquidity Trajectory
            </h3>
            <p className="text-xs text-[#2c4d72]/80">
              Deterministic ledger cash projection against minimum reserve boundary
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4a75a5]" />
              <span className="text-[#2c4d72] font-semibold">Projected Cash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-[#b37346]" />
              <span className="text-[#734220] font-semibold">Min Reserve (₹3.0L)</span>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="neuCashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a75a5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4a75a5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4e1f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#4a75a5', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#d0e0f2' }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 10, fill: '#2c4d72' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(2)}L`, 'Cash Balance']}
                  contentStyle={{
                    backgroundColor: '#e8f0f8',
                    border: '1px solid #d0e0f2',
                    borderRadius: '12px',
                    boxShadow: '6px 6px 14px #c8d7e8, -6px -6px 14px #ffffff',
                    fontSize: '12px',
                    color: '#212534',
                  }}
                />
                <ReferenceLine
                  y={business.minimumReserve ?? business.minimumCashReserve ?? 300000}
                  stroke="#b37346"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Min Reserve: ₹${(((business.minimumReserve ?? business.minimumCashReserve ?? 300000) / 100000)).toFixed(1)}L`,
                    position: 'insideBottomRight',
                    fill: '#b37346',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="projectedCash"
                  stroke="#4a75a5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#neuCashFlowGrad)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#4a75a5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#d0e0f2] flex flex-wrap items-center justify-between text-xs text-[#2c4d72]">
          <span>
            {forecast ? (
              <>
                Lowest projected cash point:{' '}
                <strong className="text-[#212534]">
                  ₹{(forecast.lowestProjectedCash / 100000).toFixed(2)}L on{' '}
                  {new Date(forecast.lowestCashDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
                {forecast.lowestProjectedCash >= (business.minimumReserve ?? business.minimumCashReserve ?? 300000) ? (
                  ` (₹${(((forecast.lowestProjectedCash - (business.minimumReserve ?? business.minimumCashReserve ?? 300000)) / 1000)).toFixed(0)}K buffer above safety baseline).`
                ) : (
                  ` (₹${((((business.minimumReserve ?? business.minimumCashReserve ?? 300000) - forecast.lowestProjectedCash) / 1000)).toFixed(0)}K below safety baseline).`
                )}
              </>
            ) : (
              'Continuous balance projection factoring verified invoices and fixed expenses.'
            )}
          </span>
          <button
            onClick={() => (onNavigateToTab ? onNavigateToTab('cashflow') : onOpenSimulator())}
            className="text-[#4a75a5] hover:text-[#212534] font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Explore 90-Day Projections</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 5. Historical Health Score Trajectory Chart */}
      <HealthScoreTrendChart
        healthScore={healthScore}
        onOpenDetails={onOpenHealthModal}
      />

      {/* 6. Crisis Simulator Entry Card (Soft Lavender Accent Card) */}
      <section className="neu-card-lavender p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl neu-inset-lavender flex items-center justify-center text-[#7a6ab4] shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#212534]">
                Stress-test your next financial scenario
              </h3>
              <p className="text-xs sm:text-sm text-[#483a7a] mt-1 max-w-2xl leading-relaxed">
                Explore how client payment delays, revenue contractions, and capital expenses affect your cash buffer before committing.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSimulator}
            className="px-5 py-3 rounded-xl neu-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Open Crisis Simulator</span>
          </button>
        </div>
      </section>

      {/* 7. Risk Center: "Attention Required" (Subtly Tinted Semantic Cards) */}
      <section className="neu-raised p-6 sm:p-7 border border-[#d6d0e4]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#dcd4f2]">
          <div>
            <h3 className="text-base font-bold text-[#212534]">
              Attention Required
            </h3>
            <p className="text-xs text-[#565d70]">
              Deterministic vulnerabilities identified across invoices, counterparty delays, and liquidity reserves
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#eeeaf8] text-[#7a6ab4] border border-[#dcd4f2]">
            {(risks || []).length} Detected
          </span>
        </div>

        <div className="space-y-3">
          {(risks || []).slice(0, 3).map((risk, index) => {
            const isHigh = risk.severity === 'HIGH' || risk.severity === 'CRITICAL';
            const isMedium = risk.severity === 'MEDIUM';

            // Individual subtle tint depending on risk type
            const cardTintClass = index === 0
              ? 'bg-[#f8eaef]/80 border-[#edd4dc]' // Receivables risk -> soft blush
              : index === 1
              ? 'bg-[#eeeaf8]/80 border-[#dcd4f2]' // Concentration risk -> soft lavender
              : 'bg-[#faefe5]/80 border-[#eddccf]'; // Expense pressure -> soft peach

            return (
              <div
                key={risk.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${cardTintClass}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      isHigh ? 'bg-[#b95d77]' : isMedium ? 'bg-[#b37346]' : 'bg-[#3f7b58]'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[#212534]">
                        {risk.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isHigh
                            ? 'bg-[#f8eaef] text-[#733045] border border-[#edd4dc]'
                            : isMedium
                            ? 'bg-[#faefe5] text-[#734220] border border-[#eddccf]'
                            : 'bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]'
                        }`}
                      >
                        {risk.severity} Priority
                      </span>
                    </div>
                    <p className="text-xs text-[#565d70] mt-1 leading-relaxed">
                      {risk.explanation || (risk as any).description}
                    </p>
                    <div className="text-[11px] text-[#828a9c] mt-1">
                      Estimated Financial Exposure: <strong className="text-[#212534]">₹{((((risk as any).potentialExposure ?? 180000) / 100000)).toFixed(2)}L</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: risk.scenarioType || 'CUSTOMER_PAYMENT_DELAY',
                      title: `Stress Test: ${risk.title}`,
                    })
                  }
                  className="px-3.5 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534] shrink-0 self-start sm:self-center bg-white/70"
                >
                  Investigate
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Action Plan: "Recommended Actions" */}
      <section className="neu-raised p-6 sm:p-7 border border-[#d6d0e4]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#dcd4f2]">
          <div>
            <h3 className="text-base font-bold text-[#212534]">
              Recommended Actions
            </h3>
            <p className="text-xs text-[#565d70]">
              Prioritized operational steps to safeguard working capital and ensure statutory compliance
            </p>
          </div>
          <button
            onClick={onOpenActionPlan}
            className="text-xs font-bold text-[#7a6ab4] hover:text-[#483a7a] flex items-center gap-1 cursor-pointer"
          >
            <span>Full Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {actions.length > 0 ? (
            actions.slice(0, 4).map((action, idx) => {
              // Alternating subtle pastel tints for actions
              const rowTint = idx % 3 === 0
                ? 'bg-[#eeeaf8]/60 border-[#dcd4f2]'
                : idx % 3 === 1
                ? 'bg-[#e8f0f8]/60 border-[#d0e0f2]'
                : 'bg-[#e7f2ec]/60 border-[#cfe3d6]';

              return (
                <div
                  key={action.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${rowTint}`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-xs font-bold text-[#7a6ab4] pt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#212534]">
                          {action.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/70 text-[#483a7a] border border-[#dcd4f2]">
                          {action.timeframe}
                        </span>
                      </div>
                      <p className="text-xs text-[#565d70] mt-1">
                        {action.rationale}
                      </p>
                      <div className="text-[11px] text-[#828a9c] mt-1">
                        Impact: <span className="font-bold text-[#212534]">{action.estimatedImpact}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleAction && onToggleAction(action.id)}
                    className={`p-2 rounded-xl neu-btn text-xs cursor-pointer shrink-0 ${
                      action.status === 'COMPLETED' ? 'text-[#3f7b58] bg-[#e7f2ec]' : 'text-[#828a9c] bg-white/70'
                    }`}
                    title={action.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Complete'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-[#565d70]">
              No pending actions. Business liquidity is currently operating within safety parameters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
