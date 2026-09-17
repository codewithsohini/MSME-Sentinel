import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Building2,
  Calendar,
  X,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { Invoice, ReceivablesAnalysis } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ReceivablesViewProps {
  receivables: ReceivablesAnalysis | null;
  invoices: Invoice[];
  onAddInvoice: (inv: Partial<Invoice>) => Promise<void>;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  receivables,
  invoices = [],
  onAddInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'UNPAID' | 'PAID'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Form State
  const [invNumber, setInvNumber] = useState('');
  const [custName, setCustName] = useState('');
  const [amount, setAmount] = useState<number>(100000);
  const [issueDate, setIssueDate] = useState('2026-09-01');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered invoices
  const filteredInvoices = (invoices || []).filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') return inv.status === 'OVERDUE' || (inv.daysOverdue && inv.daysOverdue > 0 && inv.outstandingAmount > 0);
    if (statusFilter === 'PAID') return inv.status === 'PAID' || inv.outstandingAmount === 0;
    if (statusFilter === 'UNPAID') return inv.status === 'UNPAID' || (inv.outstandingAmount > 0 && (!inv.daysOverdue || inv.daysOverdue <= 0));
    return true;
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddInvoice({
        invoiceNumber: invNumber,
        customerName: custName,
        amount: Number(amount),
        outstandingAmount: Number(amount),
        issueDate,
        dueDate,
        status: 'UNPAID',
        lineItems: [{ description: 'Machined Components Batch', quantity: 1, unitPrice: Number(amount), amount: Number(amount) }],
      });
      setIsAddModalOpen(false);
      setInvNumber('');
      setCustName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const agingColors: Record<string, string> = {
    Current: '#3f7b58',
    '1-7 days': '#7a6ab4',
    '8-30 days': '#b37346',
    '31-60 days': '#c4697e',
    '60+ days': '#b95d77',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dcd4f2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
            Receivables & Aging Analysis
          </h2>
          <p className="text-xs text-[#565d70] mt-0.5">
            Breakdown of customer invoices, aging delinquency brackets, and Days Sales Outstanding (DSO).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Invoice</span>
        </button>
      </div>

      {/* 4 Semantic Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Receivables -> Soft Lavender Surface */}
        <div className="neu-card-lavender p-5">
          <span className="text-xs font-bold text-[#483a7a] block mb-1">
            Total Receivables
          </span>
          <div className="text-2xl font-extrabold text-[#212534] tracking-tight">
            ₹{((receivables?.totalReceivables ?? 485000) / 100000).toFixed(2)}L
          </div>
          <span className="text-[11px] text-[#7a6ab4] font-medium mt-1 block">
            Across {invoices.length} total customer bills
          </span>
        </div>

        {/* Stat 2: Overdue Amount -> Soft Blush / Rose Surface */}
        <div className="neu-card-blush p-5">
          <span className="text-xs font-bold text-[#733045] block mb-1">
            Overdue Amount
          </span>
          <div className="text-2xl font-extrabold text-[#b95d77] tracking-tight">
            ₹{((receivables?.overdueAmount ?? 110000) / 100000).toFixed(2)}L
          </div>
          <span className="text-[11px] text-[#733045] font-semibold mt-1 block">
            {(() => {
              const rate = (receivables as any)?.overdueRate ?? (receivables && receivables.totalReceivables > 0 ? (receivables.overdueAmount / receivables.totalReceivables) * 100 : 22.7);
              return typeof rate === 'number' ? rate.toFixed(1) : rate;
            })()}% Delinquency rate
          </span>
        </div>

        {/* Stat 3: Days Sales Outstanding -> Soft Powder-Blue Surface */}
        <div className="neu-card-blue p-5">
          <span className="text-xs font-bold text-[#2c4d72] block mb-1">
            Days Sales Outstanding (DSO)
          </span>
          <div className="text-2xl font-extrabold text-[#212534] tracking-tight">
            {receivables?.dso ?? (receivables as any)?.dsoDays ?? 48} Days
          </div>
          <span className="text-[11px] text-[#4a75a5] font-medium mt-1 block">
            Benchmark target: 35–45 Days
          </span>
        </div>

        {/* Stat 4: Statutory Net 45 Status -> Soft Sage Surface */}
        <div className="neu-card-sage p-5">
          <span className="text-xs font-bold text-[#235237] block mb-1">
            Statutory Net 45 Status
          </span>
          <div className="text-2xl font-extrabold text-[#3f7b58] tracking-tight">
            Compliant
          </div>
          <span className="text-[11px] text-[#235237]/80 font-medium mt-1 block">
            MSMED Section 15 Protection Active
          </span>
        </div>
      </div>

      {/* Aging Distribution Chart Card */}
      <div className="neu-raised p-6 rounded-2xl border border-[#d6d0e4]">
        <div className="pb-4 mb-4 border-b border-[#dcd4f2]">
          <h3 className="text-base font-bold text-[#212534]">
            Receivables Aging Distribution
          </h3>
          <p className="text-xs text-[#565d70]">
            Delinquency aging brackets from current terms to 60+ days overdue
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receivables?.agingBuckets || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a6ab4', fontWeight: 600 }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#565d70' }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `₹${Number(val).toLocaleString()} (${item.payload.count} invoices)`,
                    'Balance',
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
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {(receivables?.agingBuckets || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={agingColors[entry.name] || '#7a6ab4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            {(receivables?.agingBuckets || []).map((b) => (
              <div
                key={b.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-[#dcd4f2] text-xs transition-all hover:bg-white/90"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: agingColors[b.name] || '#7a6ab4' }}
                  />
                  <span className="font-bold text-[#212534]">{b.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#565d70]">({b.count} bills)</span>
                  <span className="font-bold text-[#212534]">
                    ₹{(b.amount / 100000).toFixed(2)}L
                  </span>
                  <span className="text-[10px] font-bold text-[#7a6ab4] w-9 text-right">
                    {b.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="neu-raised rounded-2xl border border-[#d6d0e4] overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-[#dcd4f2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7a6ab4] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice number or buyer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl neu-input font-medium"
              />
            </div>
          </div>

          <div className="bg-[#e4ddf4] p-1 rounded-xl neu-inset-lavender flex items-center text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-[#212534] neu-raised-sm font-bold' : 'text-[#483a7a]'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'OVERDUE' ? 'bg-white text-[#b95d77] neu-raised-sm font-bold' : 'text-[#483a7a]'
              }`}
            >
              Overdue ({invoices.filter((i) => (i.daysOverdue && i.daysOverdue > 0 && i.outstandingAmount > 0)).length})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'UNPAID' ? 'bg-white text-[#4a75a5] neu-raised-sm font-bold' : 'text-[#483a7a]'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PAID' ? 'bg-white text-[#3f7b58] neu-raised-sm font-bold' : 'text-[#483a7a]'
              }`}
            >
              Settled
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#212534]">
            <thead className="bg-[#ede9f7]/70 text-[#483a7a] uppercase tracking-wider font-bold border-b border-[#dcd4f2]">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dcd4f2]/70">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#212534]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-semibold text-[#483a7a]">{inv.customerName}</td>
                  <td className="px-4 py-3 text-[#565d70]">{inv.issueDate}</td>
                  <td className="px-4 py-3 text-[#565d70]">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    ₹{inv.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span
                      className={
                        inv.outstandingAmount > 0 && inv.daysOverdue && inv.daysOverdue > 0
                          ? 'text-[#b95d77] font-extrabold'
                          : inv.outstandingAmount === 0
                          ? 'text-[#828a9c] line-through'
                          : 'text-[#212534]'
                      }
                    >
                      ₹{inv.outstandingAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.outstandingAmount === 0 || inv.status === 'PAID' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">
                        PAID
                      </span>
                    ) : inv.daysOverdue && inv.daysOverdue > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f8eaef] text-[#733045] border border-[#edd4dc]">
                        {inv.daysOverdue}D OVERDUE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f0f8] text-[#2c4d72] border border-[#d0e0f2]">
                        CURRENT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 rounded-lg neu-btn text-xs font-bold text-[#483a7a] hover:text-[#212534] cursor-pointer bg-white/60"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1c1829]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ede9f7] rounded-2xl max-w-lg w-full neu-raised border border-[#dcd4f2] overflow-hidden">
            <div className="p-5 border-b border-[#dcd4f2] flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7a6ab4]" />
                <h3 className="font-extrabold text-base text-[#212534]">
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg neu-btn text-[#565d70] hover:text-[#212534] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/60 border border-[#dcd4f2]">
                <div>
                  <span className="text-[#7a6ab4] font-semibold block text-[11px]">Client / Buyer</span>
                  <span className="font-extrabold text-[#212534] text-sm">{selectedInvoice.customerName}</span>
                </div>
                <div>
                  <span className="text-[#7a6ab4] font-semibold block text-[11px]">Due Date</span>
                  <span className="font-bold text-[#212534]">{selectedInvoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-[#7a6ab4] font-semibold block text-[11px]">Total Invoiced</span>
                  <span className="font-extrabold text-[#212534] text-sm">₹{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#7a6ab4] font-semibold block text-[11px]">Outstanding Due</span>
                  <span className="font-extrabold text-[#b95d77] text-sm">
                    ₹{selectedInvoice.outstandingAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#212534] block mb-2">Line Items</span>
                <div className="border border-[#dcd4f2] rounded-xl overflow-hidden bg-white/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#e4ddf4]/60 text-[#483a7a] font-bold">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dcd4f2]/70">
                      {selectedInvoice.lineItems?.map((li, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-[#212534]">{li.description}</td>
                          <td className="p-2.5 text-right text-[#565d70]">{li.quantity}</td>
                          <td className="p-2.5 text-right text-[#565d70]">₹{li.unitPrice.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-[#212534]">₹{li.amount.toLocaleString()}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="p-2.5 text-[#828a9c] text-center">
                            Batch goods dispatch
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#dcd4f2] flex justify-end bg-white/20">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#212534] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1c1829]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ede9f7] rounded-2xl max-w-md w-full neu-raised border border-[#dcd4f2] overflow-hidden">
            <div className="p-5 border-b border-[#dcd4f2] flex items-center justify-between bg-white/40">
              <h3 className="font-extrabold text-base text-[#212534]">Record New Customer Invoice</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg neu-btn text-[#565d70] hover:text-[#212534] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#483a7a] mb-1">Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-089"
                  required
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#483a7a] mb-1">Customer / Buyer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Motors Ltd"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#483a7a] mb-1">Gross Invoiced Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#483a7a] mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#483a7a] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#565d70]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold"
                >
                  {isSubmitting ? 'Recording...' : 'Add to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
