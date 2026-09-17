import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, Activity, Layers } from 'lucide-react';
import { BusinessHealthScore, HealthScoreComponent } from '../types';
import { HealthScoreTrendChart } from './HealthScoreTrendChart';

interface HealthScoreModalProps {
  healthScore: BusinessHealthScore | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HealthScoreModal: React.FC<HealthScoreModalProps> = ({
  healthScore,
  isOpen,
  onClose,
}) => {
  const [modalTab, setModalTab] = useState<'components' | 'trend'>('components');

  if (!isOpen || !healthScore) return null;

  const getStatusBadge = (status: HealthScoreComponent['status']) => {
    switch (status) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e2ede7] text-[#438466]">
            <CheckCircle2 className="w-3 h-3" /> Excellent
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#dfe2e9] text-[#586980]">
            <CheckCircle2 className="w-3 h-3" /> Good
          </span>
        );
      case 'FAIR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f8f1e5] text-[#b3853b]">
            <AlertTriangle className="w-3 h-3" /> Fair
          </span>
        );
      case 'POOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#faeaea] text-[#b35353]">
            <AlertTriangle className="w-3 h-3" /> Vulnerable
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#faeaea] text-[#b35353]">
            <AlertOctagon className="w-3 h-3" /> Critical
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#252936]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#e8eaf0] rounded-2xl max-w-2xl w-full neu-raised border border-[#d8dce6] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#d8dce6] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl neu-inset flex flex-col items-center justify-center text-[#222634]">
              <span className="text-2xl font-bold">{healthScore.overallScore}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8890a0]">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#222634]">
                  Health Score Decomposition
                </h3>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                  healthScore.overallScore >= 75
                    ? 'bg-[#e2ede7] text-[#438466]'
                    : healthScore.overallScore >= 60
                    ? 'bg-[#f8f1e5] text-[#b3853b]'
                    : 'bg-[#faeaea] text-[#b35353]'
                }`}>
                  Grade {healthScore.grade} • {healthScore.label}
                </span>
              </div>
              <p className="text-xs text-[#6e7687] mt-1">
                Deterministic mathematical scoring across 6 liquidity and counterparty drivers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[#6e7687] hover:text-[#222634] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div className="bg-[#dfe2e9]/50 px-6 py-2 border-b border-[#d8dce6] flex items-center justify-between">
          <div className="bg-[#dfe2e9] p-1 rounded-xl neu-inset-sm flex items-center gap-1">
            <button
              onClick={() => setModalTab('components')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                modalTab === 'components'
                  ? 'bg-[#e8eaf0] text-[#222634] neu-raised-sm'
                  : 'text-[#6e7687] hover:text-[#222634]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Current Drivers (6 Weights)</span>
            </button>
            <button
              onClick={() => setModalTab('trend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                modalTab === 'trend'
                  ? 'bg-[#e8eaf0] text-[#222634] neu-raised-sm'
                  : 'text-[#6e7687] hover:text-[#222634]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Historical Trend (6 Months)</span>
            </button>
          </div>

          <span className="text-[11px] text-[#8890a0] font-medium hidden sm:inline">
            {modalTab === 'components' ? 'Deterministic Decomposition' : 'Trajectory Analysis'}
          </span>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-[#f8f1e5]/60 border-b border-[#d8dce6] px-6 py-2.5 flex items-start gap-2.5 text-xs text-[#8a682c]">
          <ShieldCheck className="w-4 h-4 text-[#b3853b] shrink-0 mt-0.5" />
          <div>
            <strong>Internal Decision-Support Indicator:</strong>{' '}
            {healthScore.disclaimer}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {modalTab === 'trend' ? (
            <div className="space-y-4">
              <HealthScoreTrendChart healthScore={healthScore} compact={true} />
            </div>
          ) : (
            <>
              <div className="text-xs text-[#6e7687] font-semibold uppercase tracking-wider mb-2">
                6 Contributing Drivers (Deterministic Weights)
              </div>

              {(healthScore.components || []).map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl neu-inset-sm bg-[#e8eaf0] border border-[#d4d8e2] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#222634] text-xs sm:text-sm">{c.name}</span>
                      <span className="text-xs text-[#6e7687] font-medium">({(c.weight * 100).toFixed(0)}% weight)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#222634] text-xs sm:text-sm">{c.score}/100</span>
                      {getStatusBadge(c.status)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#d4d8e2] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.score >= 80 ? 'bg-[#438466]' : c.score >= 60 ? 'bg-[#b3853b]' : 'bg-[#b35353]'
                      }`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg neu-raised-sm bg-[#e8eaf0] border border-[#d8dce6]">
                      <span className="text-[#8890a0] block text-[10px]">Current Measurement</span>
                      <span className="font-semibold text-[#222634]">{c.currentMetricValue}</span>
                    </div>
                    <div className="p-2.5 rounded-lg neu-raised-sm bg-[#e8eaf0] border border-[#d8dce6]">
                      <span className="text-[#8890a0] block text-[10px]">Target Benchmark</span>
                      <span className="font-semibold text-[#222634]">{c.idealBenchmark}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#5e6677] leading-relaxed">{c.impactExplanation}</p>

                  {c.suggestedImprovement && (
                    <div className="text-xs text-[#384454] p-2.5 rounded-lg neu-raised-sm bg-[#e8eaf0] border border-[#d8dce6] flex items-start gap-1.5">
                      <span className="font-semibold text-[#586980] shrink-0">Recommendation:</span>
                      <span>{c.suggestedImprovement}</span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#d8dce6] p-4 flex items-center justify-between text-xs text-[#6e7687]">
          <span>Formula: Σ (Component Score × Component Weight)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl neu-btn text-xs font-semibold text-[#222634] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
