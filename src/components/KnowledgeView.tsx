import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Calculator,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';

export const KnowledgeView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'statutory' | 'formulas' | 'benchmarks' | 'playbook'>('statutory');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-[#dcd4f2]">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
          MSME Financial & Statutory Knowledge Base
        </h2>
        <p className="text-xs text-[#565d70] mt-0.5">
          Deterministic reference guide covering statutory payment protections under Indian law, working capital mechanics, and cash buffer formulas.
        </p>
      </div>

      {/* Topic Switcher Tabs */}
      <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex flex-wrap items-center gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('statutory')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'statutory'
              ? 'bg-white text-[#212534] neu-raised-sm font-bold'
              : 'text-[#483a7a] hover:text-[#212534]'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-[#7a6ab4]" />
          <span>MSMED Act 2006 (Net 45)</span>
        </button>

        <button
          onClick={() => setActiveSection('formulas')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'formulas'
              ? 'bg-white text-[#212534] neu-raised-sm font-bold'
              : 'text-[#483a7a] hover:text-[#212534]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-[#7a6ab4]" />
          <span>Working Capital Formulas</span>
        </button>

        <button
          onClick={() => setActiveSection('benchmarks')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'benchmarks'
              ? 'bg-white text-[#212534] neu-raised-sm font-bold'
              : 'text-[#483a7a] hover:text-[#212534]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#7a6ab4]" />
          <span>Safety Thresholds & DSO</span>
        </button>

        <button
          onClick={() => setActiveSection('playbook')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'playbook'
              ? 'bg-white text-[#212534] neu-raised-sm font-bold'
              : 'text-[#483a7a] hover:text-[#212534]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#7a6ab4]" />
          <span>Crisis Mitigation Playbook</span>
        </button>
      </div>

      {/* Section 1: Statutory Framework */}
      {activeSection === 'statutory' && (
        <div className="space-y-5">
          <div className="neu-raised rounded-2xl p-6 border border-[#d6d0e4] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#dcd4f2]">
              <div className="w-10 h-10 rounded-xl neu-card-lavender flex items-center justify-center text-[#483a7a]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#212534]">
                  Section 15 & 16: Mandatory Net 45-Day Statutory Payment Rule
                </h3>
                <p className="text-xs text-[#565d70]">
                  Micro, Small and Medium Enterprises Development (MSMED) Act, 2006
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl neu-card-blue space-y-2">
                <span className="text-xs font-bold text-[#1e3a5f] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2c4d72]" />
                  Maximum Permissible Credit Period
                </span>
                <p className="text-xs text-[#2c4d72] leading-relaxed">
                  Under Section 15, where any supplier supplies goods or renders services to any buyer, the buyer shall make payment on or before the agreed date. In no case shall the period agreed upon between the buyer and supplier exceed <strong>45 days</strong> from the day of acceptance.
                </p>
              </div>

              <div className="p-4 rounded-xl neu-card-peach space-y-2">
                <span className="text-xs font-bold text-[#4d2814] flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#6b4226]" />
                  Section 16: Mandatory 3x Bank Rate Penal Interest
                </span>
                <p className="text-xs text-[#6b4226] leading-relaxed">
                  Where any buyer fails to make payment within 45 days, the buyer is liable by law to pay compound interest with monthly rests at <strong>three times the RBI Bank Rate</strong> from the date immediately following the date agreed upon.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-[#dcd4f2] space-y-2">
              <h4 className="text-xs font-extrabold text-[#483a7a] uppercase tracking-wider">
                Enforcement via MSEFC (MSME Samadhaan Portal)
              </h4>
              <p className="text-xs text-[#565d70] leading-relaxed font-medium">
                If payment is delayed beyond 45 days, suppliers registered under Udyam can lodge an online claim before the Micro & Small Enterprises Facilitation Council (MSEFC). By statutory mandate, the council must conduct conciliation and arbitration within 90 days. Buyers cannot deduct penal interest from income tax.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Formulas */}
      {activeSection === 'formulas' && (
        <div className="space-y-5">
          <div className="neu-raised rounded-2xl p-6 border border-[#d6d0e4] space-y-4">
            <h3 className="text-base font-extrabold text-[#212534]">
              Core Financial & Liquidity Formulas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl neu-card-blue space-y-2">
                <div className="text-xs font-extrabold text-[#1e3a5f]">1. Days Sales Outstanding (DSO)</div>
                <div className="p-2 rounded-lg bg-white/70 border border-[#d2e0ee] font-mono text-xs font-bold text-[#1e3a5f]">
                  DSO = (Total Outstanding Receivables / Gross Credit Sales) × 365
                </div>
                <p className="text-[11px] text-[#2c4d72]">
                  Measures the average number of days required to collect customer receivables. Apex Forgings current: 48 days.
                </p>
              </div>

              <div className="p-4 rounded-xl neu-card-sage space-y-2">
                <div className="text-xs font-extrabold text-[#193a27]">2. Cash Runway Buffer</div>
                <div className="p-2 rounded-lg bg-white/70 border border-[#cfe3d6] font-mono text-xs font-bold text-[#193a27]">
                  Runway Months = Current Liquid Cash / Net Monthly Operating Burn
                </div>
                <p className="text-[11px] text-[#235237]">
                  Evaluates how many months of fixed obligations the business can sustain if cash inflow temporarily halts. Target: &gt;3.0 months.
                </p>
              </div>

              <div className="p-4 rounded-xl neu-card-peach space-y-2">
                <div className="text-xs font-extrabold text-[#4d2814]">3. Single-Customer Concentration Ratio</div>
                <div className="p-2 rounded-lg bg-white/70 border border-[#f0dcd0] font-mono text-xs font-bold text-[#4d2814]">
                  Concentration % = (Turnover from Top 1 Client / Total Turnover) × 100
                </div>
                <p className="text-[11px] text-[#6b4226]">
                  A concentration above 35% introduces severe systemic risk. If that account defaults or delays, liquidity reserves are jeopardized.
                </p>
              </div>

              <div className="p-4 rounded-xl neu-card-rose space-y-2">
                <div className="text-xs font-extrabold text-[#521c2d]">4. Overdue Delinquency Rate</div>
                <div className="p-2 rounded-lg bg-white/70 border border-[#edd4dc] font-mono text-xs font-bold text-[#521c2d]">
                  Overdue Rate = (Overdue Amount &gt; 30d / Total Open Receivables) × 100
                </div>
                <p className="text-[11px] text-[#733045]">
                  Healthy industrial benchmark: &lt; 15%. Delinquency above 20% signals elevated risk of bad debts and working capital shrinkage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Benchmarks */}
      {activeSection === 'benchmarks' && (
        <div className="neu-raised rounded-2xl p-6 border border-[#d6d0e4] space-y-4">
          <h3 className="text-base font-extrabold text-[#212534]">
            Industrial Health Benchmarks for MSME Engineering & Manufacturing
          </h3>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl neu-card-sage flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#193a27]">Cash Runway Buffer</span>
                <p className="text-[11px] text-[#235237]/80">Minimum liquid cash to safeguard payroll, vendor GST, and lease rentals.</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-xs text-[#235237]">3.0 – 4.5 Months</span>
                <span className="block text-[10px] text-[#235237]/70 font-semibold">Target range</span>
              </div>
            </div>

            <div className="p-4 rounded-xl neu-card-blue flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#1e3a5f]">Days Sales Outstanding (DSO)</span>
                <p className="text-[11px] text-[#2c4d72]/80">Average time to collect receivables across tier-1 automotive suppliers.</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-xs text-[#1e3a5f]">35 – 45 Days</span>
                <span className="block text-[10px] text-[#2c4d72]/70 font-semibold">Regulatory ceiling: 45d</span>
              </div>
            </div>

            <div className="p-4 rounded-xl neu-card-peach flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#4d2814]">Max Single-Buyer Share</span>
                <p className="text-[11px] text-[#6b4226]/80">Recommended ceiling to prevent customer-driven insolvency.</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-xs text-[#6b4226]">&lt; 30.0%</span>
                <span className="block text-[10px] text-[#6b4226]/70 font-semibold">Current: 44.5% (Watch)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Playbook */}
      {activeSection === 'playbook' && (
        <div className="neu-raised rounded-2xl p-6 border border-[#d6d0e4] space-y-4">
          <h3 className="text-base font-extrabold text-[#212534]">
            Crisis Mitigation Playbook: 3-Tier Liquidity Defense
          </h3>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl neu-card-sage border border-[#cfe3d6]">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/80 text-[#235237] border border-[#cfe3d6]">
                  Tier 1: Preventive (Days 1–15)
                </span>
                <strong className="text-xs text-[#193a27]">Automated Invoice Dispatch & Verification</strong>
              </div>
              <p className="text-xs text-[#235237]">
                Issue GST e-invoices simultaneously with delivery challans. Verify acceptance within 15 days to start the statutory 45-day Net clock without dispute.
              </p>
            </div>

            <div className="p-4 rounded-xl neu-card-peach border border-[#f0dcd0]">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/80 text-[#6b4226] border border-[#f0dcd0]">
                  Tier 2: Active Recovery (Days 16–45)
                </span>
                <strong className="text-xs text-[#4d2814]">Invoice Discounting on TReDS & Milestone Releases</strong>
              </div>
              <p className="text-xs text-[#6b4226]">
                Discount verified tier-1 receivables on RBI-regulated TReDS platforms (RXIL, M1xchange) to unlock instant liquid cash at competitive interest rates without collateral.
              </p>
            </div>

            <div className="p-4 rounded-xl neu-card-rose border border-[#edd4dc]">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/80 text-[#733045] border border-[#edd4dc]">
                  Tier 3: Statutory Escalation (Days 45+)
                </span>
                <strong className="text-xs text-[#521c2d]">Section 15 Notice & MSEFC Filing</strong>
              </div>
              <p className="text-xs text-[#733045]">
                Issue formal reminder citing Section 16 compound penal interest. Lodge dispute on MSME Samadhaan for mandatory conciliation within 90 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
