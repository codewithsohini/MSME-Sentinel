import { Invoice, Payment } from '../../src/types.js';

export interface ValidationIssue {
  field?: string;
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateInvoiceData(
  invoice: Partial<Invoice>,
  existingInvoices: Invoice[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
    errors.push('Missing required field: Invoice Number.');
  } else {
    // Check duplicates
    const duplicate = existingInvoices.find(
      (inv) => inv.id !== invoice.id && inv.invoiceNumber.toLowerCase() === invoice.invoiceNumber?.toLowerCase()
    );
    if (duplicate) {
      errors.push(`Duplicate invoice detected: #${invoice.invoiceNumber} already exists in records.`);
    }
  }

  if (!invoice.customerName || invoice.customerName.trim() === '') {
    errors.push('Invoice lacks a customer / client designation.');
  }

  if (invoice.amount === undefined || invoice.amount === null || isNaN(invoice.amount)) {
    errors.push('Invoice total amount is missing.');
  } else if (invoice.amount <= 0) {
    errors.push('Invoice total amount must be a positive number.');
  }

  if (invoice.outstandingAmount !== undefined && invoice.amount !== undefined) {
    if (invoice.outstandingAmount > invoice.amount) {
      warnings.push('Outstanding amount cannot exceed total invoice amount. Defaulted to total amount.');
    }
  }

  // Date validation
  if (!invoice.issueDate) {
    errors.push('Missing issue date.');
  } else if (isNaN(new Date(invoice.issueDate).getTime())) {
    errors.push(`Invalid issue date format: ${invoice.issueDate}`);
  }

  if (!invoice.dueDate) {
    errors.push('Missing due date.');
  } else if (isNaN(new Date(invoice.dueDate).getTime())) {
    errors.push(`Invalid due date format: ${invoice.dueDate}`);
  } else if (invoice.issueDate && new Date(invoice.dueDate) < new Date(invoice.issueDate)) {
    warnings.push('Due date precedes invoice issue date. Please verify payment terms.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function reconcilePayment(
  payment: Partial<Payment>,
  invoices: Invoice[]
): {
  reconciliationStatus: 'MATCHED' | 'PARTIAL' | 'UNMATCHED' | 'NEEDS_REVIEW';
  matchedInvoiceId?: string;
  reconciliationConfidence: number;
  possibleMatches: { invoiceId: string; invoiceNumber: string; customerName: string; confidence: number; reason: string }[];
} {
  const matches: { invoiceId: string; invoiceNumber: string; customerName: string; confidence: number; reason: string }[] = [];
  const pAmount = payment.amount || 0;
  const pDesc = (payment.description || '').toLowerCase();
  const pRef = (payment.reference || '').toLowerCase();
  const pCust = (payment.customerName || '').toLowerCase();

  for (const inv of invoices) {
    let score = 0;
    const reasons: string[] = [];

    // Exact invoice number match in reference or description
    const invNumClean = inv.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    const refClean = pRef.replace(/[^a-z0-9]/g, '');
    const descClean = pDesc.replace(/[^a-z0-9]/g, '');

    if (refClean.includes(invNumClean) || descClean.includes(invNumClean)) {
      score += 0.55;
      reasons.push('Invoice number found in payment reference/description');
    }

    // Customer match
    const custClean = inv.customerName.toLowerCase();
    if (pCust && (custClean.includes(pCust) || pCust.includes(custClean))) {
      score += 0.25;
      reasons.push('Customer identity match');
    } else if (pDesc && custClean.split(' ').some((word) => word.length > 3 && pDesc.includes(word))) {
      score += 0.20;
      reasons.push('Customer name mentioned in bank narration');
    }

    // Amount match
    if (inv.outstandingAmount > 0 && Math.abs(inv.outstandingAmount - pAmount) < 1) {
      score += 0.35;
      reasons.push('Exact outstanding amount match');
    } else if (inv.amount > 0 && Math.abs(inv.amount - pAmount) < 1) {
      score += 0.30;
      reasons.push('Exact total invoice amount match');
    } else if (inv.outstandingAmount > 0 && pAmount < inv.outstandingAmount) {
      score += 0.15;
      reasons.push('Possible partial payment against outstanding balance');
    }

    score = Math.min(1.0, score);

    if (score >= 0.40) {
      matches.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        confidence: Number(score.toFixed(2)),
        reason: reasons.join('; '),
      });
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);

  if (matches.length === 1 && matches[0].confidence >= 0.85) {
    const top = matches[0];
    const targetInv = invoices.find((i) => i.id === top.invoiceId);
    const isPartial = targetInv && pAmount < targetInv.outstandingAmount;
    return {
      reconciliationStatus: isPartial ? 'PARTIAL' : 'MATCHED',
      matchedInvoiceId: top.invoiceId,
      reconciliationConfidence: top.confidence,
      possibleMatches: matches,
    };
  } else if (matches.length > 0) {
    // Multiple matches or confidence < 0.85
    return {
      reconciliationStatus: 'NEEDS_REVIEW',
      reconciliationConfidence: matches[0].confidence,
      possibleMatches: matches,
    };
  } else {
    return {
      reconciliationStatus: 'UNMATCHED',
      reconciliationConfidence: 0.1,
      possibleMatches: [],
    };
  }
}
