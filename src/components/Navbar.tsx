import React, { useState } from 'react';
import {
  ShieldAlert,
  Bot,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Building2,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Business, BusinessHealthScore, DataConfidenceAssessment } from '../types';

export interface NavbarProps {
  business: Business;
  confidence?: DataConfidenceAssessment | null;
  healthScore?: BusinessHealthScore | null;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  onOpenHealthModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenChat?: () => void;
  onOpenChatDrawer?: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  confidence,
  healthScore,
  activeTab,
  setActiveTab,
  onSelectTab,
  onOpenHealthModal,
  onOpenSettingsModal,
  onOpenChat,
  onOpenChatDrawer,
  onResetDemo,
  isResetting = false,
}) => {
  const [showConfidencePopover, setShowConfidencePopover] = useState(false);
  const effectiveConfidence = confidence || healthScore?.dataConfidenceAssessment || null;

  const handleTabClick = (tabId: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    } else if (typeof onSelectTab === 'function') {
      onSelectTab(tabId);
    }
  };

  const handleChatClick = () => {
    if (typeof onOpenChat === 'function') {
      onOpenChat();
    } else if (typeof onOpenChatDrawer === 'function') {
      onOpenChatDrawer();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Health Radar' },
    { id: 'simulator', label: 'Crisis Simulator', badge: 'Signature' },
    { id: 'cashflow', label: 'Cash Flow & Forecast' },
    { id: 'receivables', label: 'Receivables & Aging' },
    { id: 'customers', label: 'Customer Risk' },
    { id: 'ingestion', label: 'Upload & Reconcile' },
    { id: 'actions', label: 'Action Plan' },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Banner with Decision Support Notice */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
            INTERNAL DECISION SUPPORT
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Deterministic financial simulation for MSMEs. Not a credit score or regulated rating.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400">
            Reference As of: <strong className="text-slate-200">14 Sep 2026</strong>
          </span>
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset data back to standard demo state"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-tight">MSME Sentinel</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Crisis Intel
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {business.name}
                </span>
                <span className="text-slate-600">•</span>
                <span>{business.industry}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex items-center gap-3">
            {/* Liquid Cash Widget */}
            <div
              onClick={onOpenSettingsModal}
              className="hidden md:flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg px-3 py-1.5 cursor-pointer transition-all"
              title="Click to adjust Cash Balance and Minimum Reserve Buffer"
            >
              <div className="p-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">Liquid Cash</div>
                <div className="text-sm font-display font-semibold text-white">
                  ₹{(business.currentCash / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div className="border-l border-slate-700 pl-3 text-left">
                <div className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">Min Buffer</div>
                <div className="text-xs font-display font-medium text-slate-300">
                  ₹{(business.minimumCashReserve / 100000).toFixed(2)}L
                </div>
              </div>
            </div>

            {/* Data Confidence Pill */}
            {effectiveConfidence && (
              <div className="relative">
                <button
                  onClick={() => setShowConfidencePopover(!showConfidencePopover)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">Confidence:</span>
                  <span className="text-emerald-300 font-semibold">{effectiveConfidence.score}%</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </button>

                {showConfidencePopover && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 text-xs text-slate-300 z-50">
                    <div className="flex items-center justify-between font-semibold text-white mb-2 pb-1.5 border-b border-slate-800">
                      <span>Data Confidence Quality</span>
                      <span className="text-emerald-400">{effectiveConfidence.score}/100</span>
                    </div>
                    <p className="text-slate-400 mb-3">{effectiveConfidence.summaryExplanation}</p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Historical Span:</span>
                        <span className="text-slate-200">{effectiveConfidence.historicalTimeSpanDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Invoices Tracked:</span>
                        <span className="text-slate-200">{effectiveConfidence.invoiceCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reconciliation Match:</span>
                        <span className="text-slate-200">{effectiveConfidence.reconciliationQualityScore}%</span>
                      </div>
                    </div>
                    {effectiveConfidence.missingDataWarnings.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-amber-300 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{effectiveConfidence.missingDataWarnings[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile / Buffer Settings */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Edit Business Profile & Reserve Policy"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Sentinel AI Drawer Button */}
            <button
              onClick={handleChatClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 cursor-pointer transition-all"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Sentinel AI</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
