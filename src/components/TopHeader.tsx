import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Settings,
  MessageSquare,
  Menu,
  ChevronDown,
  Info,
  Calendar,
} from 'lucide-react';
import { Business, DataConfidenceAssessment } from '../types';

interface TopHeaderProps {
  pageTitle: string;
  pageSubtitle: string;
  business: Business | null;
  confidence?: DataConfidenceAssessment | null;
  onOpenSettingsModal: () => void;
  onOpenChat: () => void;
  onToggleMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  pageTitle,
  pageSubtitle,
  business,
  confidence,
  onOpenSettingsModal,
  onOpenChat,
  onToggleMobileSidebar,
}) => {
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const confidenceScore = confidence?.score ?? confidence?.overallScore ?? 100;
  const sampleInvoicesCount = confidence?.invoiceCount ?? confidence?.reconciledInvoicesCount ?? 0;
  const reconciliationQuality = confidence?.reconciliationQualityScore ?? 92;
  const explanation = confidence?.summaryExplanation || 'All metrics, health scores, and stress models are deterministically grounded on verified invoice ledgers and bank reserve buffers.';

  return (
    <header className="sticky top-0 z-30 bg-[#eae7f2]/92 backdrop-blur-md border-b border-[#d8d0e6] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Title / Subtitle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl neu-btn text-[#565d70] hover:text-[#212534]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7a6ab4] hidden sm:inline-block" />
              <h1 className="text-lg sm:text-xl font-bold text-[#212534] tracking-tight leading-tight">
                {pageTitle}
              </h1>
            </div>
            <p className="text-xs text-[#565d70] hidden sm:block mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {/* Right Controls: Data Confidence, Selected Business, Notification, Assistant, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Data Confidence Indicator with Soft Sage Tint */}
          <div className="relative">
            <button
              onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#e7f2ec] border border-[#cfe3d6] text-xs text-[#235237] font-semibold neu-raised-sm hover:bg-[#deece3] transition-all cursor-pointer"
              title="Verified deterministic ledger confidence"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3f7b58]" />
              <span className="hidden md:inline">{confidenceScore}% Data Confidence</span>
              <span className="md:hidden">{confidenceScore}%</span>
              <ChevronDown className="w-3 h-3 text-[#3f7b58]/70" />
            </button>

            {/* Confidence Popover */}
            {showConfidenceDetails && (
              <div className="absolute right-0 mt-2 w-72 bg-[#f4f2fa] rounded-2xl neu-raised p-4 z-50 text-xs text-[#212534] border border-[#dcd4f2]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#d8d0e6]">
                  <span className="font-bold text-xs text-[#212534] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3f7b58]" />
                    Ledger Integrity Reconciled
                  </span>
                  <span className="font-bold text-[#3f7b58]">{confidenceScore}/100</span>
                </div>
                <p className="text-[#565d70] leading-relaxed text-[11px] mb-2.5">
                  {explanation}
                </p>
                <div className="space-y-1.5 text-[11px] bg-[#eae5f5] p-2.5 rounded-xl border border-[#ded7ef]">
                  <div className="flex justify-between">
                    <span className="text-[#565d70]">Reconciled Invoices:</span>
                    <strong className="text-[#212534]">{sampleInvoicesCount} Verified</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565d70]">Ledger Reconciliation:</span>
                    <strong className="text-[#3f7b58]">{reconciliationQuality}% Accuracy</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565d70]">Statutory Framework:</span>
                    <strong className="text-[#7a6ab4]">MSMED Act 2006</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Business Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eeeaf8] border border-[#dcd4f2] text-xs text-[#483a7a]">
            <Building2 className="w-3.5 h-3.5 text-[#7a6ab4]" />
            <span className="font-bold truncate max-w-[140px]">
              {business?.name || 'Apex Forgings'}
            </span>
          </div>

          {/* Notification Icon with Soft Blush Alert Accent */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl neu-btn text-[#565d70] hover:text-[#212534] relative"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#b95d77] ring-2 ring-[#eae7f2]" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#f4f2fa] rounded-2xl neu-raised p-4 z-50 text-xs text-[#212534] border border-[#dcd4f2]">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#d8d0e6]">
                  <span className="font-bold text-xs text-[#212534]">Operational Alerts</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f8eaef] text-[#b95d77] border border-[#edd4dc]">
                    2 Pending
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#f8eaef]/70 border border-[#edd4dc] text-[11px]">
                    <div className="font-bold text-[#733045] mb-0.5">Apex Motors 15-Day Delay</div>
                    <p className="text-[#565d70]">Overdue balance of ₹2.2L crossing Net 45 statutory buffer.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#e7f2ec]/70 border border-[#cfe3d6] text-[11px]">
                    <div className="font-bold text-[#235237] mb-0.5">Statutory Minimum Reserve</div>
                    <p className="text-[#565d70]">Current liquid cash maintains 3.4 months runway buffer.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sentinel Assistant Secondary Trigger with Soft Lavender Tint */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534]"
            title="Ask Sentinel financial questions"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#7a6ab4]" />
            <span className="hidden sm:inline">Ask Sentinel</span>
          </button>

          {/* Settings / Profile Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl neu-btn text-[#565d70] hover:text-[#212534]"
            title="Settings & Financial Reserves"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
