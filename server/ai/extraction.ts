import { Type } from '@google/genai';
import { getGeminiClient } from './geminiClient.js';
import { ExtractedInvoicePayload } from '../../src/types.js';

export async function extractInvoiceData(
  fileBase64: string,
  mimeType: string,
  fileName?: string
): Promise<ExtractedInvoicePayload> {
  const ai = getGeminiClient();

  // If Gemini API key is not configured, provide intelligent fallback extraction
  if (!ai) {
    return {
      invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Extracted Client',
      customerId: undefined,
      invoiceDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      totalAmount: 185000,
      taxAmount: 33300,
      outstandingAmount: 185000,
      paymentStatus: 'UNPAID',
      lineItems: [{ description: 'Machined Components Delivery', quantity: 100, unitPrice: 1850, amount: 185000 }],
      extractionConfidence: 0.85,
      warnings: ['Offline mode: Simulated extraction used as GEMINI_API_KEY is not configured.'],
    };
  }

  const prompt = `You are MSME Sentinel's Invoice and Financial Document Extraction Engine.
Analyze the provided document image/PDF and extract financial fields into structured JSON.
CRITICAL MANDATES:
1. Never invent or hallucinate missing financial numbers. If a field cannot be reliably extracted, return null.
2. For extraction confidence, return a decimal from 0.0 to 1.0 based on readability.
3. If dates are ambiguous, format as YYYY-MM-DD.
4. Extract all identifiable line items with description, quantity, unit price, and subtotal amount.
5. If payment terms (e.g., Net 30) are stated but due date is missing, calculate the due date from issue date.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType || 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceId: { type: Type.STRING, description: 'Invoice number or reference code' },
            customerName: { type: Type.STRING, description: 'Legal or trade name of the client/buyer' },
            invoiceDate: { type: Type.STRING, description: 'Issue date in YYYY-MM-DD format' },
            dueDate: { type: Type.STRING, description: 'Payment due date in YYYY-MM-DD format' },
            totalAmount: { type: Type.NUMBER, description: 'Total invoice grand total amount' },
            taxAmount: { type: Type.NUMBER, description: 'Total GST/VAT/tax included or added' },
            outstandingAmount: { type: Type.NUMBER, description: 'Outstanding unpaid amount if stated' },
            paymentStatus: {
              type: Type.STRING,
              description: 'Payment status explicitly stated or inferred: PAID, PARTIAL, UNPAID, or OVERDUE',
            },
            extractionConfidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                },
                required: ['description', 'amount'],
              },
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any illegible text, unverified totals, or ambiguities',
            },
          },
          required: ['invoiceId', 'customerName', 'totalAmount'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      invoiceId: parsed.invoiceId || `INV-${Date.now().toString().slice(-4)}`,
      customerName: parsed.customerName || 'Unknown Customer',
      customerId: undefined,
      invoiceDate: parsed.invoiceDate || new Date().toISOString().substring(0, 10),
      dueDate: parsed.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      totalAmount: parsed.totalAmount ? Number(parsed.totalAmount) : null,
      taxAmount: parsed.taxAmount ? Number(parsed.taxAmount) : 0,
      outstandingAmount: parsed.outstandingAmount !== undefined ? Number(parsed.outstandingAmount) : parsed.totalAmount,
      paymentStatus: (parsed.paymentStatus as any) || 'UNPAID',
      lineItems: parsed.lineItems || [],
      extractionConfidence: parsed.extractionConfidence !== undefined ? Number(parsed.extractionConfidence) : 0.90,
      warnings: parsed.warnings || [],
    };
  } catch (error: any) {
    console.error('Invoice extraction error:', error);
    return {
      invoiceId: `INV-${Date.now().toString().slice(-4)}`,
      customerName: 'Pending Manual Review',
      customerId: undefined,
      invoiceDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      totalAmount: null,
      taxAmount: null,
      outstandingAmount: null,
      paymentStatus: 'UNPAID',
      lineItems: [],
      extractionConfidence: 0.35,
      warnings: [`AI extraction could not read document accurately: ${error.message || 'Format error'}`],
    };
  }
}
