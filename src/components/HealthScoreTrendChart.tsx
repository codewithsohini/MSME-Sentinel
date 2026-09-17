import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { BusinessHealthScore, HealthScoreHistoryPoint } from '../types';

interface HealthScoreTrendChartProps {
  healthScore: BusinessHealthScore | null;
  onOpenDetails?: () => void;
  compact?: boolean;
}

export const HealthScoreTrendChart: React.FC<HealthScoreTrendChartProps> = ({
  healthScore,
  onOpenDetails,
}) => {
  const [viewMode, setViewMode] = useState<'overall' | 'components'>('overall');
  const [selectedPoint, setSelectedPoint] = useState<HealthScoreHistoryPoint | null>(null);

  const history = healthScore?.history || [];
  if (history.length === 0) {
    return null;
  }

  const currentPoint = history[history.length - 1];
  const activeInspection = selectedPoint || currentPoint;
  const scoreChange = healthScore?.scoreChange ?? (currentPoint.overallScore - history[0].overallScore);
  const trend = healthScore?.trend ?? (scoreChange > 3 ? 'IMPROVING' : scoreChange < -3 ? 'DECLINING' : 'STABLE');

  const getTrendBadge = () => {
    if (trend === 'IMPROVING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">
          <TrendingUp className="w-3.5 h-3.5 text-[#3f7b58]" />
          <span>Improving (+{scoreChange} pts)</span>
        </span>
      );
    } else if (trend === 'DECLINING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f8eaef] text-[#733045] border border-[#edd4dc]">
          <TrendingDown className="w-3.5 h-3.5 text-[#b95d77]" />
          <span>Declining ({scoreChange} pts)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#faefe5] text-[#734220] border border-[#eddccf]">
        <Minus className="w-3.5 h-3.5 text-[#b37346]" />
        <span>Stable ({scoreChange >= 0 ? `+${scoreChange}` : scoreChange} pts)</span>
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#3f7b58';
    if (score >= 60) return '#b37346';
    return '#b95d77';
  };

  return (
    <div className="bg-[#ede9f7]/70 rounded-2xl neu-raised p-5 md:p-6 border border-[#dcd4f2]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dcd4f2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg neu-inset-lavender text-[#7a6ab4]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#212534]">
              Historical Health Score Trajectory
            </h3>
            {getTrendBadge()}
          </div>
          <p className="text-xs text-[#565d70]">
            6-month trajectory evaluating operational resilience, liquidity buffers, and overdue settlement behavior
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex items-center text-xs font-medium">
            <button
              onClick={() => setViewMode('overall')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'overall'
                  ? 'bg-[#ffffff] text-[#212534] neu-raised-sm font-bold'
                  : 'text-[#483a7a] hover:text-[#212534]'
              }`}
            >
              Overall Score
            </button>
            <button
              onClick={() => setViewMode('components')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'components'
                  ? 'bg-[#ffffff] text-[#212534] neu-raised-sm font-bold'
                  : 'text-[#483a7a] hover:text-[#212534]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Core Drivers</span>
            </button>
          </div>

          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534] cursor-pointer ml-1 bg-white/70"
            >
              Score Breakdown
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="pt-4">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'overall' ? (
              <AreaChart
                data={history}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload as HealthScoreHistoryPoint);
                  }
                }}
              >
                <defs>
                  <linearGradient id="neuHealthScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7a6ab4" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#7a6ab4" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ded7ef" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#7a6ab4', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ded7ef' }}
                />
                <YAxis
                  domain={[30, 100]}
                  ticks={[30, 45, 60, 75, 90, 100]}
                  tick={{ fontSize: 10, fill: '#565d70' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Benchmark Zones */}
                <ReferenceLine
                  y={75}
                  stroke="#3f7b58"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Resilient Threshold (75+)',
                    position: 'insideTopRight',
                    fill: '#3f7b58',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#b37346"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Vulnerable Threshold (60)',
                    position: 'insideBottomRight',
                    fill: '#b37346',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#7a6ab4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#neuHealthScoreGrad)"
                  dot={(props: any) => {
                    const isSelected = activeInspection.label === props.payload.label;
                    const score = props.payload.overallScore;
                    return (
                      <circle
                        key={`dot-${props.index}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={isSelected ? 6 : 4}
                        fill="#ede9f7"
                        stroke={getScoreColor(score)}
                        strokeWidth={isSelected ? 3 : 2}
                        className="cursor-pointer transition-all"
                      />
                    );
                  }}
                  activeDot={{
                    r: 6.5,
                    fill: '#7a6ab4',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : (
              <LineChart data={history} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ded7ef" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#7a6ab4', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ded7ef' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                  tick={{ fontSize: 10, fill: '#565d70' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomComponentsTooltip />} />
                <ReferenceLine y={60} stroke="#ded7ef" strokeDasharray="3 3" />

                <Line
                  type="monotone"
                  dataKey="cashStabilityScore"
                  name="Cash Buffer"
                  stroke="#3f7b58"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="receivablesScore"
                  name="Receivables"
                  stroke="#7a6ab4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="paymentDelaysScore"
                  name="Payment Delays"
                  stroke="#b37346"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="concentrationScore"
                  name="Concentration"
                  stroke="#b95d77"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="costPressureScore"
                  name="Cost Control"
                  stroke="#4a75a5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend for Core Drivers Breakdown */}
      {viewMode === 'components' && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 pb-2 text-xs font-semibold text-[#565d70] border-t border-[#dcd4f2]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3f7b58]" />
            <span>Cash Buffer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7a6ab4]" />
            <span>Receivables</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b37346]" />
            <span>Payment Delays</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b95d77]" />
            <span>Customer Concentration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a75a5]" />
            <span>Operating Cost Control</span>
          </div>
        </div>
      )}

      {/* Selected Month Narrative Box */}
      <div className="mt-4 bg-[#f2effb] rounded-xl p-4 neu-inset-lavender border border-[#dcd4f2]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[#212534] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7a6ab4]" />
              {activeInspection.label} Analysis:
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-[#212534] border border-[#dcd4f2]">
              Score: {activeInspection.overallScore}/100 • Grade {activeInspection.grade} ({activeInspection.status})
            </span>
            {activeInspection.changeFromPrevious !== undefined && activeInspection.changeFromPrevious !== 0 && (
              <span
                className={`text-[11px] font-bold ${
                  activeInspection.changeFromPrevious > 0 ? 'text-[#3f7b58]' : 'text-[#b95d77]'
                }`}
              >
                {activeInspection.changeFromPrevious > 0
                  ? `+${activeInspection.changeFromPrevious} pts`
                  : `${activeInspection.changeFromPrevious} pts`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#7a6ab4] font-medium">Click any point to inspect monthly driver</span>
        </div>

        <p className="text-xs text-[#483a7a] leading-relaxed font-medium">
          {activeInspection.operationalMilestone || healthScore?.trendDescription}
        </p>

        {/* 6 Sub-driver mini metrics for selected month */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-2.5 border-t border-[#dcd4f2] text-[11px]">
          <div className="bg-[#e7f2ec] p-2 rounded-lg border border-[#cfe3d6]">
            <span className="text-[#235237] block text-[10px] font-semibold">Cash Buffer</span>
            <span className="font-bold text-[#212534]">{activeInspection.cashStabilityScore}/100</span>
          </div>
          <div className="bg-[#eeeaf8] p-2 rounded-lg border border-[#dcd4f2]">
            <span className="text-[#483a7a] block text-[10px] font-semibold">Receivables</span>
            <span className="font-bold text-[#212534]">{activeInspection.receivablesScore}/100</span>
          </div>
          <div className="bg-[#faefe5] p-2 rounded-lg border border-[#eddccf]">
            <span className="text-[#734220] block text-[10px] font-semibold">Delays</span>
            <span className="font-bold text-[#212534]">{activeInspection.paymentDelaysScore}/100</span>
          </div>
          <div className="bg-[#f8eaef] p-2 rounded-lg border border-[#edd4dc]">
            <span className="text-[#733045] block text-[10px] font-semibold">Concentration</span>
            <span className="font-bold text-[#212534]">{activeInspection.concentrationScore}/100</span>
          </div>
          <div className="bg-[#e8f0f8] p-2 rounded-lg border border-[#d0e0f2]">
            <span className="text-[#2c4d72] block text-[10px] font-semibold">Consistency</span>
            <span className="font-bold text-[#212534]">{activeInspection.revenueConsistencyScore}/100</span>
          </div>
          <div className="bg-[#ede9f7] p-2 rounded-lg border border-[#dcd4f2]">
            <span className="text-[#483a7a] block text-[10px] font-semibold">Cost Control</span>
            <span className="font-bold text-[#212534]">{activeInspection.costPressureScore}/100</span>
          </div>
        </div>
      </div>

      {/* Trajectory Summary Sentence */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#6e7687] pt-1">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#586980] shrink-0" />
          <span>
            {healthScore?.trendDescription ||
              `Net trajectory shows health is ${trend.toLowerCase()} over 6 months.`}
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Overall Score view
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: HealthScoreHistoryPoint = payload[0].payload;
    const change = data.changeFromPrevious;

    return (
      <div className="bg-[#e8eaf0] text-[#222634] p-3.5 rounded-xl neu-raised border border-[#d8dce6] text-xs max-w-xs z-50">
        <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-[#d4d8e2]">
          <span className="font-bold text-[#222634]">{data.label}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#dfe2e9] text-[#384454]">
            Grade {data.grade}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-[#222634]">{data.overallScore}/100</span>
          <span className="text-[#6e7687] text-[11px]">({data.status})</span>
          {change !== undefined && change !== 0 && (
            <span className={`text-[11px] font-semibold ml-auto ${change > 0 ? 'text-[#438466]' : 'text-[#b35353]'}`}>
              {change > 0 ? `+${change}` : change} pts
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#5e6677] mb-2 leading-relaxed">{data.operationalMilestone}</p>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-[#6e7687] border-t border-[#d4d8e2] pt-1.5">
          <div>Buffer: <strong className="text-[#222634]">{data.cashStabilityScore}/100</strong></div>
          <div>Receivables: <strong className="text-[#222634]">{data.receivablesScore}/100</strong></div>
          <div>Delays: <strong className="text-[#222634]">{data.paymentDelaysScore}/100</strong></div>
          <div>Concentration: <strong className="text-[#222634]">{data.concentrationScore}/100</strong></div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Sub-Components Breakdown view
const CustomComponentsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#e8eaf0] text-[#222634] p-3.5 rounded-xl neu-raised border border-[#d8dce6] text-xs min-w-[200px] z-50">
        <div className="font-bold text-[#222634] mb-2 pb-1 border-b border-[#d4d8e2]">{label} Driver Scores</div>
        <div className="space-y-1.5 text-[11px]">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#5e6677]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <strong className="text-[#222634]">{entry.value}/100</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
