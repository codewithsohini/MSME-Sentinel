import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { ExtractedInvoicePayload, Invoice, Payment } from '../types';

interface IngestionViewProps {
  onAcceptInvoice: (inv: Partial<Invoice>) => Promise<void>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
}

export const IngestionView: React.FC<IngestionViewProps> = ({
  onAcceptInvoice,
  onRecordPayment,
}) => {
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoicePayload | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Payment Reconciliation Playground State
  const [payAmount, setPayAmount] = useState<number>(220000);
  const [payRef, setPayRef] = useState('CMS-APEX-RTGS-9821');
  const [payDesc, setPayDesc] = useState('RTGS Inward from Apex Motors Ltd for INV-2026-089');
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      setFileBase64(base64);
      runExtraction(base64, file.type || 'image/png', file.name);
    };
    reader.readAsDataURL(file);
  };

  const runExtraction = async (b64: string, mime: string, name: string) => {
    setIsExtracting(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: b64, mimeType: mime, fileName: name }),
      });
      const data = await res.json();
      setExtractedData(data);
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample Invoices for instant testing
  const loadSampleDoc = (sampleType: 'apex' | 'bharat') => {
    if (sampleType === 'apex') {
      setFileName('Apex_Motors_PO_INV_2026_112.png');
      setMimeType('image/png');
      setExtractedData({
        invoiceId: 'INV-2026-112',
        customerName: 'Apex Motors Ltd.',
        invoiceDate: '2026-09-10',
        dueDate: '2026-10-10',
        totalAmount: 340000,
        taxAmount: 61200,
        outstandingAmount: 340000,
        paymentStatus: 'UNPAID',
        lineItems: [
          { description: 'CNC Machined Transmission Hubs Grade 8', quantity: 200, unitPrice: 1200, amount: 240000 },
          { description: 'Precision Alloy Flanges Sub-Assembly', quantity: 100, unitPrice: 1000, amount: 100000 },
        ],
        extractionConfidence: 0.94,
        warnings: ['Payment terms Net 30 confirmed on purchase order.'],
      });
    } else {
      setFileName('Kavita_Engineering_Supplies_INV_2026_118.pdf');
      setMimeType('application/pdf');
      setExtractedData({
        invoiceId: 'INV-2026-118',
        customerName: 'Kavita Heavy Engineering',
        invoiceDate: '2026-09-12',
        dueDate: '2026-10-12',
        totalAmount: 165000,
        taxAmount: 29700,
        outstandingAmount: 165000,
        paymentStatus: 'UNPAID',
        lineItems: [
          { description: 'High-Tensile Die Casting Mold Inserts', quantity: 15, unitPrice: 11000, amount: 165000 },
        ],
        extractionConfidence: 0.91,
        warnings: [],
      });
    }
  };

  const handleAccept = async () => {
    if (!extractedData) return;
    await onAcceptInvoice({
      invoiceNumber: extractedData.invoiceId,
      customerName: extractedData.customerName,
      amount: extractedData.totalAmount || 0,
      outstandingAmount: extractedData.outstandingAmount || extractedData.totalAmount || 0,
      issueDate: extractedData.invoiceDate,
      dueDate: extractedData.dueDate,
      status: (extractedData.paymentStatus as any) || 'UNPAID',
      lineItems: extractedData.lineItems,
      extractionConfidence: extractedData.extractionConfidence,
    });
    setSaveSuccessMessage(`Successfully recorded Invoice #${extractedData.invoiceId} into ledger.`);
  };

  const handleTestReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          reference: payRef,
          description: payDesc,
          paymentDate: '2026-09-14',
        }),
      });
      const data = await res.json();
      setReconcileResult(data);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="pb-2 border-b border-[#dcd4f2]">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#212534] tracking-tight">
          Document Data Center & Payment Reconciliation
        </h2>
        <p className="text-xs text-[#565d70] mt-0.5">
          Process purchase orders, dispatch bills, and automatically reconcile bank inward credits.
        </p>
      </div>

      {/* Two Column Layout: Document Ingestion & Payment Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Extraction */}
        <div className="lg:col-span-6 space-y-4">
          <div className="neu-raised rounded-2xl p-6 border border-[#d6d0e4]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[#212534]">
                1. Invoice & Statement Processing
              </h3>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ede9f7] text-[#483a7a] border border-[#dcd4f2]">
                Data Extraction
              </span>
            </div>
            <p className="text-xs text-[#565d70] mb-4">
              Upload invoice photos, dispatch scans, or vendor PDFs. The system extracts structured fields without manual entry.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-xl neu-inset-lavender text-center cursor-pointer transition-all border border-[#dcd4f2] bg-white/40 hover:bg-white/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
              <UploadCloud className="w-7 h-7 text-[#7a6ab4] mx-auto mb-2" />
              <div className="text-xs font-bold text-[#212534]">
                {fileName ? fileName : 'Click to select or drag & drop document'}
              </div>
              <p className="text-[11px] text-[#7a6ab4] mt-1 font-medium">PNG, JPG, or PDF up to 25MB</p>
            </div>

            {/* Instant Sample Invoices */}
            <div className="mt-4 pt-3 border-t border-[#dcd4f2]">
              <span className="text-xs font-bold text-[#483a7a] block mb-2">
                Or test instantly with sample enterprise documents:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleDoc('apex')}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] flex items-center gap-1.5 bg-white/70 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#7a6ab4]" />
                  <span>Apex Motors Dispatch Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleDoc('bharat')}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#483a7a] flex items-center gap-1.5 bg-white/70 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#3f7b58]" />
                  <span>Kavita Engineering PO</span>
                </button>
              </div>
            </div>
          </div>

          {/* Extracted Data Review Card */}
          {isExtracting ? (
            <div className="neu-raised rounded-2xl border border-[#d6d0e4] p-8 text-center">
              <RefreshCw className="w-6 h-6 text-[#7a6ab4] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-[#212534]">Extracting document metadata...</p>
            </div>
          ) : extractedData ? (
            <div className="neu-raised rounded-2xl border border-[#d6d0e4] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-[#212534]">
                  Extracted Document Review
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#7a6ab4] font-semibold">Accuracy:</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]">
                    {Math.round((extractedData.extractionConfidence || 0.9) * 100)}%
                  </span>
                </div>
              </div>

              {saveSuccessMessage ? (
                <div className="p-3 rounded-xl bg-[#e7f2ec] border border-[#cfe3d6] text-[#235237] text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-[#3f7b58]" />
                  <span>{saveSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-white/60 border border-[#dcd4f2]">
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Invoice #</span>
                      <span className="font-extrabold text-[#212534]">{extractedData.invoiceId}</span>
                    </div>
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Client Name</span>
                      <span className="font-extrabold text-[#212534]">{extractedData.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Issue Date</span>
                      <span className="font-semibold text-[#565d70]">{extractedData.invoiceDate}</span>
                    </div>
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Due Date</span>
                      <span className="font-semibold text-[#565d70]">{extractedData.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Total Amount</span>
                      <span className="font-extrabold text-[#212534] text-sm">
                        ₹{extractedData.totalAmount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7a6ab4] block text-[10px] font-bold">Status</span>
                      <span className="font-bold text-[#b37346]">{extractedData.paymentStatus}</span>
                    </div>
                  </div>

                  {extractedData.lineItems && extractedData.lineItems.length > 0 && (
                    <div className="border border-[#dcd4f2] rounded-xl overflow-hidden text-xs">
                      <div className="bg-[#ede9f7] p-2.5 font-bold text-[#483a7a]">Line Items</div>
                      <div className="p-2.5 space-y-1.5 bg-white/40">
                        {extractedData.lineItems.map((li, i) => (
                          <div key={i} className="flex justify-between text-[#565d70]">
                            <span className="font-medium">
                              {li.description} (x{li.quantity})
                            </span>
                            <span className="font-bold text-[#212534]">₹{li.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAccept}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 neu-btn-primary text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Append to Financial Ledger</span>
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: Payment Reconciliation Engine */}
        <div className="lg:col-span-6 space-y-4">
          <div className="neu-raised rounded-2xl border border-[#d6d0e4] p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[#212534]">
                2. Bank Payment Reconciliation
              </h3>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ede9f7] text-[#483a7a] border border-[#dcd4f2]">
                Ledger Matcher
              </span>
            </div>
            <p className="text-xs text-[#565d70] mb-4">
              Match incoming bank credits to open invoices based on reference IDs, amounts, and customer names with confidence scoring.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#483a7a] block mb-1">Payment Inward Amount (₹)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl neu-input font-bold text-[#212534]"
                />
              </div>

              <div>
                <label className="font-bold text-[#483a7a] block mb-1">Bank Reference Code</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-input font-semibold text-[#212534]"
                />
              </div>

              <div>
                <label className="font-bold text-[#483a7a] block mb-1">Narration / Description</label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-input font-medium text-[#212534]"
                />
              </div>

              <button
                onClick={handleTestReconciliation}
                disabled={isReconciling}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 neu-btn text-xs font-bold text-[#483a7a] rounded-xl cursor-pointer bg-white/70"
              >
                <span>{isReconciling ? 'Matching...' : 'Reconcile Against Open Ledger'}</span>
              </button>
            </div>

            {/* Reconciliation Output Result */}
            {reconcileResult && (
              <div className="mt-5 p-4 rounded-xl bg-white/60 border border-[#dcd4f2] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#212534]">Matching Result:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      reconcileResult.reconciliationStatus === 'MATCHED'
                        ? 'bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]'
                        : reconcileResult.reconciliationStatus === 'PARTIAL'
                        ? 'bg-[#faefe6] text-[#6b4226] border border-[#f0dcd0]'
                        : 'bg-[#f8eaef] text-[#733045] border border-[#edd4dc]'
                    }`}
                  >
                    {reconcileResult.reconciliationStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7a6ab4] font-semibold">Match Confidence:</span>
                  <span className="font-extrabold text-[#212534]">
                    {Math.round((reconcileResult.reconciliationConfidence || 0) * 100)}%
                  </span>
                </div>

                {reconcileResult.invoiceId && (
                  <div className="p-3 neu-card-sage rounded-xl text-[#235237]">
                    <span className="font-extrabold block text-[#212534]">
                      Matched to Invoice {reconcileResult.invoiceId}
                    </span>
                    <span className="text-[11px] text-[#235237]/80 font-medium">
                      Amount of ₹{reconcileResult.amount.toLocaleString()} credited. Outstanding balance updated.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
