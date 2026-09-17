import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Business, CashFlowForecast, CashRunwayEstimate } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface CashFlowViewProps {
  business: Business;
  forecast: CashFlowForecast | null;
  runway: CashRunwayEstimate | null;
  onSelectHorizon: (days: 30 | 60 | 90) => void;
  selectedHorizon: 30 | 60 | 90;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  business,
  forecast,
  runway,
  onSelectHorizon,
  selectedHorizon,
}) => {
  const [chartMode, setChartMode] = useState<'balance' | 'inflows_outflows'>('balance');

  const chartData = forecast?.points
    ? forecast.points.map((p) => ({
        date: p.date.substring(5), // MM-DD
        projectedCash: p.projectedCash,
        expectedInflows: p.expectedInflows,
        expectedOutflows: p.expectedOutflows,
        minimumReserve: p.minimumReserve,
      }))
    : [];

  const isCashFlowPositive = runway?.status === 'CASH_FLOW_POSITIVE';
  const standaloneMonths = runway?.standaloneMonths ?? ((business.liquidCash ?? business.currentCash ?? 540000) / (runway?.monthlyExpenses ?? business.monthlyExpenses ?? 453000));

  return (
    <div className="space-y-6 pb-12">
      {/* View Header & Horizon Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dcd4f2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
            Deterministic Cash Flow Engine
          </h2>
          <p className="text-xs text-[#565d70] mt-0.5">
            Forward-looking cash projections incorporating customer-specific collection delays and scheduled recurring liabilities.
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex items-center text-xs font-medium self-start sm:self-auto">
          {[30, 60, 90].map((h) => (
            <button
              key={h}
              onClick={() => onSelectHorizon(h as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedHorizon === h
                  ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                  : 'text-[#483a7a] hover:text-[#212534]'
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Runway Banner (Soft Sage Surface) */}
      <div className="neu-card-sage p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl neu-inset-sage flex items-center justify-center text-[#3f7b58] shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#235237] uppercase tracking-wider">
                  Operational Cash Runway & Liquidity
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">
                  {isCashFlowPositive ? 'Cash Flow Positive' : runway?.status || 'HEALTHY BUFFER'}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#212534] tracking-tight mt-1">
                {isCashFlowPositive
                  ? `${standaloneMonths.toFixed(1)} Months Liquid Standalone Buffer`
                  : typeof runway?.months === 'number'
                  ? `${runway.months.toFixed(1)} Months Runway`
                  : '3.4 Months Buffer'}
              </div>
              <p className="text-xs text-[#235237]/80 mt-1 font-medium max-w-2xl">
                {isCashFlowPositive
                  ? `Historically, operational revenue (₹${(((runway?.monthlyRevenue ?? business.monthlyRevenue ?? 786000) / 100000)).toFixed(2)}L/mo) exceeds monthly expenses (₹${(((runway?.monthlyExpenses ?? business.monthlyExpenses ?? 453000) / 100000)).toFixed(2)}L/mo). Current liquid cash (₹${(((business.liquidCash ?? business.currentCash ?? 540000) / 100000)).toFixed(2)}L) provides ${standaloneMonths.toFixed(1)} months of emergency expense coverage if all receivables freeze.`
                  : `Based on current liquid cash of ₹${(((business.liquidCash ?? business.currentCash ?? 540000) / 100000)).toFixed(2)}L against average monthly burn of ₹${(((runway?.monthlyBurnRate ?? 380000) / 100000)).toFixed(2)}L.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#cfe3d6] text-xs">
            <div className="p-3 rounded-xl bg-white/70 border border-[#cfe3d6] text-center min-w-[120px]">
              <span className="text-[10px] text-[#235237]/70 uppercase font-semibold block">Liquidity Risk Profile</span>
              <span className="font-bold text-[#212534]">
                {forecast?.reserveBreachExpected ? 'Reserve Vulnerable' : 'Buffer Protected'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-[#cfe3d6] text-center min-w-[110px]">
              <span className="text-[10px] text-[#235237]/70 uppercase font-semibold block">Min Reserve Cushion</span>
              <span className="font-bold text-[#3f7b58]">
                ₹{((((business.liquidCash ?? business.currentCash ?? 540000) - (business.minimumReserve ?? business.minimumCashReserve ?? 300000)) / 100000)).toFixed(2)}L
              </span>
            </div>
          </div>
        </div>

        {/* Narrative distinction between historical flow vs future liquidity */}
        <div className="mt-4 pt-3.5 border-t border-[#cfe3d6] flex items-start gap-2.5 text-xs text-[#235237]">
          <Info className="w-4 h-4 shrink-0 text-[#3f7b58] mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">Historical Flow vs. Near-Term Liquidity: </strong>
            While the business is structurally profitable on a 90-day cycle, future liquidity is governed by invoice collection timing. Delayed debtor realizations (DSO ~24 days) combined with fixed calendar outflows (rent, payroll, power) create interim cash drawdowns that can challenge the ₹{(((business.minimumReserve ?? business.minimumCashReserve ?? 300000) / 100000)).toFixed(2)}L safety floor.
          </div>
        </div>
      </div>

      {/* Main Projection Chart Card (Soft Powder-Blue Surface) */}
      <div className="neu-card-blue p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d0e0f2]">
          <div>
            <h3 className="text-base font-bold text-[#212534]">
              {chartMode === 'balance' ? 'Projected Daily Liquid Cash Trajectory' : 'Daily Inflows vs Scheduled Outflows'}
            </h3>
            <p className="text-xs text-[#2c4d72]/80">
              Continuous balance projection factoring verified invoices and fixed expenses
            </p>
          </div>

          {/* Chart Mode Toggle */}
          <div className="bg-[#dbe6f4] p-1 rounded-xl neu-inset-blue flex items-center text-xs font-medium">
            <button
              onClick={() => setChartMode('balance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'balance'
                  ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                  : 'text-[#2c4d72]'
              }`}
            >
              Net Balance
            </button>
            <button
              onClick={() => setChartMode('inflows_outflows')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'inflows_outflows'
                  ? 'bg-white text-[#212534] neu-raised-sm font-bold'
                  : 'text-[#2c4d72]'
              }`}
            >
              Inflows & Outflows
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'balance' ? (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="neuCashFlowBalanceGrad" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(2)}L`, 'Projected Cash']}
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
                  fill="url(#neuCashFlowBalanceGrad)"
                  activeDot={{ r: 6, fill: '#4a75a5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4e1f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4a75a5', fontWeight: 600 }} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 10, fill: '#2c4d72' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `₹${Number(val).toLocaleString()}`,
                    name === 'expectedInflows' ? 'Expected Collections' : 'Scheduled Outflows',
                  ]}
                  contentStyle={{
                    backgroundColor: '#e8f0f8',
                    border: '1px solid #d0e0f2',
                    borderRadius: '12px',
                    boxShadow: '6px 6px 14px #c8d7e8, -6px -6px 14px #ffffff',
                    fontSize: '12px',
                    color: '#212534',
                  }}
                />
                <Bar dataKey="expectedInflows" fill="#3f7b58" radius={[4, 4, 0, 0]} name="expectedInflows" />
                <Bar dataKey="expectedOutflows" fill="#b95d77" radius={[4, 4, 0, 0]} name="expectedOutflows" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
