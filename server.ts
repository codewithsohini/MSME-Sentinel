import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { store } from './server/database/store.js';
import {
  calculateReceivablesAnalysis,
  calculateConcentration,
  calculateRevenueStability,
  calculateExpensePressure,
  calculateCashRunway,
  forecastCashFlow,
  evaluateDataConfidence,
} from './server/financial/cashFlowEngine.js';
import { calculateBusinessHealth } from './server/financial/healthScore.js';
import { detectRisks } from './server/financial/riskEngine.js';
import { runScenario, compareScenarios, calculateResilienceIndex } from './server/financial/scenarioEngine.js';
import { validateInvoiceData, reconcilePayment } from './server/financial/reconciliationEngine.js';
import { extractInvoiceData } from './server/ai/extraction.js';
import { processSentinelChat } from './server/ai/sentinelAgent.js';
import { generateActionPlan } from './server/ai/actionAdvisor.js';
import { searchKnowledgeBase } from './server/ai/knowledgeAssistant.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 25MB for document/image base64 payloads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'MSME Sentinel' });
  });

  // Business Profile
  app.get('/api/business', (req, res) => {
    const business = store.getBusiness();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const runway = calculateCashRunway(business, invoices, expenses);
    if (runway.monthlyRevenue !== undefined) {
      business.monthlyRevenue = runway.monthlyRevenue;
    }
    if (runway.monthlyExpenses !== undefined) {
      business.monthlyExpenses = runway.monthlyExpenses;
    }
    res.json(business);
  });

  app.put('/api/business', (req, res) => {
    const updated = store.updateBusiness(req.body);
    res.json(updated);
  });

  app.patch('/api/business', (req, res) => {
    const updated = store.updateBusiness(req.body);
    res.json(updated);
  });

  // Consolidated Dashboard State Endpoint
  app.get('/api/dashboard', async (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const payments = store.getPayments();
    const expenses = store.getExpenses();

    const healthScore = calculateBusinessHealth(business, customers, invoices, expenses);
    const dataConfidence = evaluateDataConfidence(invoices, payments, expenses);
    healthScore.dataConfidenceAssessment = dataConfidence;

    const risks = detectRisks(business, customers, invoices, expenses);
    const forecast = forecastCashFlow(business, invoices, customers, expenses, 60);
    const runway = calculateCashRunway(business, invoices, expenses);
    const receivables = calculateReceivablesAnalysis(invoices);
    const concentration = calculateConcentration(customers);
    const resilienceIndex = calculateResilienceIndex(business, customers, invoices, expenses);
    const savedScenarios = store.getSavedScenarios();
    const actions = await generateActionPlan(risks);

    if (runway.monthlyRevenue !== undefined) {
      business.monthlyRevenue = runway.monthlyRevenue;
    }
    if (runway.monthlyExpenses !== undefined) {
      business.monthlyExpenses = runway.monthlyExpenses;
    }

    // Baseline default shock for immediate interactive exploration
    const activeSimulation = runScenario(
      business,
      customers,
      invoices,
      expenses,
      {
        type: 'CUSTOMER_PAYMENT_DELAY',
        title: `${customers[0]?.name || 'Apex Motors'} 15-Day Delay Shock`,
        customerId: customers[0]?.id,
        customerName: customers[0]?.name,
        delayDays: 15,
      },
      60
    );

    res.json({
      business,
      healthScore,
      dataConfidence,
      risks,
      forecast,
      runway,
      receivables,
      customers,
      concentration,
      actions,
      activeSimulation,
      savedScenarios,
      resilienceIndex,
      invoices,
      payments,
      expenses,
    });
  });

  app.post('/api/business/reset-demo', (req, res) => {
    store.resetToDemo();
    res.json({ message: 'Reset to synthetic demo data successfully.', business: store.getBusiness() });
  });

  // Financial Health Score & Assessment
  app.get('/api/health-score', (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const payments = store.getPayments();
    const expenses = store.getExpenses();
    const score = calculateBusinessHealth(business, customers, invoices, expenses);
    score.dataConfidenceAssessment = evaluateDataConfidence(invoices, payments, expenses);
    res.json(score);
  });

  // Risk Detection Engine
  app.get('/api/risks', (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const risks = detectRisks(business, customers, invoices, expenses);
    res.json(risks);
  });

  // Cash Flow Forecast
  app.get('/api/forecast', (req, res) => {
    const horizon = Number(req.query.horizon) || 30;
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const forecast = forecastCashFlow(business, invoices, customers, expenses, horizon as any);
    res.json(forecast);
  });

  app.get('/api/cashflow', (req, res) => {
    const days = (Number(req.query.days) || 60) as 30 | 60 | 90;
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const forecast = forecastCashFlow(business, invoices, customers, expenses, days);
    const runway = calculateCashRunway(business, invoices, expenses);
    res.json({ forecast, runway });
  });

  // Health Score History
  app.get('/api/health-score/history', (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const health = calculateBusinessHealth(business, customers, invoices, expenses);
    res.json({
      history: health.history,
      trend: health.trend,
      scoreChange: health.scoreChange,
      trendDescription: health.trendDescription,
      currentScore: health.overallScore,
      grade: health.grade,
      label: health.label,
    });
  });

  // Receivables Analysis
  app.get('/api/receivables', (req, res) => {
    const invoices = store.getInvoices();
    const analysis = calculateReceivablesAnalysis(invoices);
    res.json(analysis);
  });

  // Customer Concentration
  app.get('/api/concentration', (req, res) => {
    const customers = store.getCustomers();
    const concentration = calculateConcentration(customers);
    res.json(concentration);
  });

  // Customers
  app.get('/api/customers', (req, res) => {
    res.json(store.getCustomers());
  });

  app.post('/api/customers', (req, res) => {
    const customer = store.addCustomer({
      id: `cust_${Date.now()}`,
      businessId: store.getBusiness().id,
      name: req.body.name || 'New Customer',
      totalRevenue: Number(req.body.totalRevenue) || 0,
      invoiceCount: 0,
      outstandingAmount: 0,
      averagePaymentDelay: Number(req.body.averagePaymentDelay) || 0,
      paymentReliability: req.body.paymentReliability || 'MEDIUM',
      revenueShare: 0,
      contactPerson: req.body.contactPerson,
      email: req.body.email,
    });
    res.status(201).json(customer);
  });

  // Invoices
  app.get('/api/invoices', (req, res) => {
    res.json(store.getInvoices());
  });

  app.post('/api/invoices', (req, res) => {
    const existing = store.getInvoices();
    const validation = validateInvoiceData(req.body, existing);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors, warnings: validation.warnings });
    }

    const business = store.getBusiness();
    const newInv = store.addInvoice({
      id: req.body.id || `inv_${Date.now()}`,
      businessId: business.id,
      customerId: req.body.customerId || `cust_${Date.now()}`,
      customerName: req.body.customerName || 'Client',
      invoiceNumber: req.body.invoiceNumber,
      issueDate: req.body.issueDate,
      dueDate: req.body.dueDate,
      amount: Number(req.body.amount),
      taxAmount: req.body.taxAmount ? Number(req.body.taxAmount) : undefined,
      outstandingAmount: req.body.outstandingAmount !== undefined ? Number(req.body.outstandingAmount) : Number(req.body.amount),
      status: req.body.status || 'UNPAID',
      extractionConfidence: req.body.extractionConfidence || 1.0,
      lineItems: req.body.lineItems,
    });

    res.status(201).json({ invoice: newInv, warnings: validation.warnings });
  });

  app.put('/api/invoices/:id', (req, res) => {
    const updated = store.updateInvoice(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    res.json(updated);
  });

  app.delete('/api/invoices/:id', (req, res) => {
    const ok = store.deleteInvoice(req.params.id);
    res.json({ success: ok });
  });

  // Payments
  app.get('/api/payments', (req, res) => {
    res.json(store.getPayments());
  });

  app.post('/api/payments', (req, res) => {
    const invoices = store.getInvoices();
    const recon = reconcilePayment(req.body, invoices);

    const newPayment = store.addPayment({
      id: req.body.id || `pay_${Date.now()}`,
      businessId: store.getBusiness().id,
      customerId: req.body.customerId,
      customerName: req.body.customerName,
      invoiceId: req.body.invoiceId || recon.matchedInvoiceId,
      invoiceNumber: req.body.invoiceNumber,
      amount: Number(req.body.amount),
      paymentDate: req.body.paymentDate || new Date().toISOString().substring(0, 10),
      reference: req.body.reference || `REF-${Date.now().toString().slice(-6)}`,
      paymentType: req.body.paymentType || 'BANK_TRANSFER',
      description: req.body.description,
      reconciliationConfidence: recon.reconciliationConfidence,
      reconciliationStatus: recon.reconciliationStatus,
      possibleMatches: recon.possibleMatches,
    });

    res.status(201).json(newPayment);
  });

  app.delete('/api/payments/:id', (req, res) => {
    const ok = store.deletePayment(req.params.id);
    res.json({ success: ok });
  });

  // Expenses
  app.get('/api/expenses', (req, res) => {
    res.json(store.getExpenses());
  });

  app.post('/api/expenses', (req, res) => {
    const newExpense = store.addExpense({
      id: req.body.id || `exp_${Date.now()}`,
      businessId: store.getBusiness().id,
      category: req.body.category || 'OTHER',
      amount: Number(req.body.amount),
      date: req.body.date || new Date().toISOString().substring(0, 10),
      dueDate: req.body.dueDate,
      recurring: Boolean(req.body.recurring),
      frequency: req.body.frequency || 'MONTHLY',
      critical: Boolean(req.body.critical),
      description: req.body.description,
    });
    res.status(201).json(newExpense);
  });

  app.delete('/api/expenses/:id', (req, res) => {
    const ok = store.deleteExpense(req.params.id);
    res.json({ success: ok });
  });

  // Crisis Simulator
  app.post('/api/simulate', (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const params = req.body;
    const horizon = Number(req.query.horizon) || 60;

    const result = runScenario(business, customers, invoices, expenses, params, horizon);
    res.json(result);
  });

  app.post('/api/simulate/compare', (req, res) => {
    const { baselineResult, stressResult } = req.body;
    if (!baselineResult || !stressResult) {
      return res.status(400).json({ error: 'baselineResult and stressResult are required' });
    }
    const comparison = compareScenarios(baselineResult, stressResult);
    res.json(comparison);
  });

  // Cash-Flow Resilience Index
  app.get('/api/resilience', (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const index = calculateResilienceIndex(business, customers, invoices, expenses);
    res.json(index);
  });

  // Saved Scenarios
  app.get('/api/scenarios/saved', (req, res) => {
    res.json(store.getSavedScenarios());
  });

  app.post('/api/scenarios/save', (req, res) => {
    const record = store.saveScenario({
      id: `saved_scen_${Date.now()}`,
      title: req.body.title || 'Saved Stress Test',
      parameters: req.body.parameters,
      result: req.body.result,
      savedAt: new Date().toISOString(),
    });
    res.status(201).json(record);
  });

  app.delete('/api/scenarios/saved/:id', (req, res) => {
    const ok = store.deleteSavedScenario(req.params.id);
    res.json({ success: ok });
  });

  // Multimodal Invoice Extraction
  app.post('/api/extract-invoice', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'fileBase64 data is required' });
      }
      const extracted = await extractInvoiceData(fileBase64, mimeType || 'image/png', fileName);
      res.json(extracted);
    } catch (err: any) {
      console.error('Extraction route error:', err);
      res.status(500).json({ error: err.message || 'Invoice extraction failed' });
    }
  });

  // Validation Check
  app.post('/api/validate-invoice', (req, res) => {
    const existing = store.getInvoices();
    const result = validateInvoiceData(req.body, existing);
    res.json(result);
  });

  // Sentinel AI Conversational Assistant
  app.post('/api/sentinel/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const response = await processSentinelChat(message, history || []);
      res.json(response);
    } catch (err: any) {
      console.error('Sentinel chat route error:', err);
      res.status(500).json({ error: err.message || 'Chat processing error' });
    }
  });

  // Action Advisor
  app.get('/api/actions', async (req, res) => {
    const business = store.getBusiness();
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const expenses = store.getExpenses();
    const risks = detectRisks(business, customers, invoices, expenses);
    const actions = await generateActionPlan(risks);
    res.json(actions);
  });

  // Data Confidence Rating
  app.get('/api/data-confidence', (req, res) => {
    const invoices = store.getInvoices();
    const payments = store.getPayments();
    const expenses = store.getExpenses();
    const assessment = evaluateDataConfidence(invoices, payments, expenses);
    res.json(assessment);
  });

  // Knowledge Base Search
  app.get('/api/knowledge', (req, res) => {
    const query = String(req.query.q || '');
    const results = searchKnowledgeBase(query);
    res.json(results);
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MSME Sentinel Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
