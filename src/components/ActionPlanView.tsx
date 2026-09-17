import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Tag,
  Filter,
  Check,
} from 'lucide-react';
import { ActionItem, ActionItemCategory } from '../types';

interface ActionPlanViewProps {
  actions: ActionItem[];
  onToggleActionStatus: (id: string) => void;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  actions,
  onToggleActionStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = actions.filter((act) => {
    if (selectedCategory === 'ALL') return true;
    return act.category === selectedCategory;
  });

  const getPriorityBadge = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f8eaef] text-[#733045] border border-[#edd4dc]">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#faefe6] text-[#6b4226] border border-[#f0dcd0]">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#edf2f8] text-[#2c4d72] border border-[#d2e0ee]">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dcd4f2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
            Financial & Operational Action Plan
          </h2>
          <p className="text-xs text-[#565d70] mt-0.5">
            Prioritized corrective measures tied directly to detected cash bottlenecks and customer payment delays.
          </p>
        </div>

        {/* Category Filters */}
        <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex flex-wrap items-center text-xs font-semibold self-start sm:self-auto gap-1">
          {['ALL', 'RECEIVABLES', 'CASH_BUFFER', 'CUSTOMER_DIVERSIFICATION', 'COST_CONTROL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat ? 'bg-white text-[#212534] neu-raised-sm font-bold' : 'text-[#483a7a] hover:text-[#212534]'
              }`}
            >
              {cat === 'ALL'
                ? 'All Actions'
                : cat === 'CASH_BUFFER'
                ? 'Cash Buffer'
                : cat === 'CUSTOMER_DIVERSIFICATION'
                ? 'Diversification'
                : cat === 'COST_CONTROL'
                ? 'Cost Control'
                : 'Receivables'}
            </button>
          ))}
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isDone = item.status === 'COMPLETED';
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl transition-all border flex flex-col sm:flex-row items-start justify-between gap-4 ${
                isDone
                  ? 'neu-inset-sm bg-white/30 border-[#dcd4f2] opacity-75'
                  : 'neu-raised bg-white/40 hover:bg-white/60 border-[#d6d0e4]'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <button
                  onClick={() => onToggleActionStatus(item.id)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isDone
                      ? 'neu-inset-sage bg-[#3f7b58] text-white'
                      : 'neu-btn text-[#7a6ab4] hover:text-[#212534] bg-white/80'
                  }`}
                  title={isDone ? 'Mark as pending' : 'Mark as completed'}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : null}
                </button>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={`font-extrabold text-sm text-[#212534] ${
                        isDone ? 'line-through text-[#8874aa]' : ''
                      }`}
                    >
                      {item.title}
                    </h4>
                    {getPriorityBadge(item.priority)}
                    <span className="text-[10px] font-bold text-[#483a7a] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ede9f7] border border-[#dcd4f2]">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-[#565d70] leading-relaxed font-medium">{item.description}</p>

                  <div className="text-xs text-[#212534] p-3 rounded-xl bg-white/70 border border-[#dcd4f2] flex items-start gap-2">
                    <strong className="shrink-0 text-[#7a6ab4] font-bold">Quantitative Evidence:</strong>
                    <span className="font-medium text-[#565d70]">{item.evidence}</span>
                  </div>
                </div>
              </div>

              {/* Impact & Effort Badges */}
              <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0 text-xs text-[#565d70] w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#dcd4f2]">
                <div className="text-right">
                  <span className="text-[10px] text-[#7a6ab4] block uppercase font-bold">Impact Score</span>
                  <span className="font-extrabold text-[#3f7b58] text-sm">{item.impactScore} / 10</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#7a6ab4] block uppercase font-bold">Effort</span>
                  <span className="font-bold text-[#212534]">{item.implementationEffort}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
