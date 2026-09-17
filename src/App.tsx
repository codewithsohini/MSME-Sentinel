import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/OverviewView';
import { SimulatorView } from './components/SimulatorView';
import { CashFlowView } from './components/CashFlowView';
import { ReceivablesView } from './components/ReceivablesView';
import { CustomersView } from './components/CustomersView';
import { IngestionView } from './components/IngestionView';
import { ActionPlanView } from './components/ActionPlanView';
import { KnowledgeView } from './components/KnowledgeView';
import { HealthScoreModal } from './components/HealthScoreModal';
import { SettingsModal } from './components/SettingsModal';
import { SentinelChatDrawer } from './components/SentinelChatDrawer';
import {
  Business,
  BusinessHealthScore,
  CashFlowForecast,
  CashRunwayEstimate,
  ConcentrationMetric,
  Customer,
  DataConfidenceAssessment,
  DetectedRisk,
  Invoice,
  Payment,
  ReceivablesAnalysis,
  ScenarioParameters,
  SimulationResult,
  SavedScenarioRecord,
  ActionItem,
} from './types';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data State
  const [business, setBusiness] = useState<Business | null>(null);
  const [healthScore, setHealthScore] = useState<BusinessHealthScore | null>(null);
  const [dataConfidence, setDataConfidence] = useState<DataConfidenceAssessment | null>(null);
  const [risks, setRisks] = useState<DetectedRisk[]>([]);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [runway, setRunway] = useState<CashRunwayEstimate | null>(null);
  const [receivables, setReceivables] = useState<ReceivablesAnalysis | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [concentration, setConcentration] = useState<ConcentrationMetric | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioRecord[]>([]);
  const [resilienceIndex, setResilienceIndex] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Controls & Modals State
  const [selectedHorizon, setSelectedHorizon] = useState<30 | 60 | 90>(60);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Fetch full unified state
  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setBusiness(data.business);
      setHealthScore(data.healthScore);
      setDataConfidence(data.dataConfidence || data.healthScore?.dataConfidenceAssessment || null);
      setRisks(data.risks || []);
      setForecast(data.forecast);
      setRunway(data.runway);
      setReceivables(data.receivables);
      setCustomers(data.customers || []);
      setConcentration(data.concentration);
      setActions(data.actions || []);
      setActiveSimulation(data.activeSimulation);
      setSavedScenarios(data.savedScenarios || []);
      setResilienceIndex(data.resilienceIndex);
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load dashboard state:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Handlers
  const handleSelectHorizon = async (days: 30 | 60 | 90) => {
    setSelectedHorizon(days);
    try {
      const res = await fetch(`/api/cashflow?days=${days}`);
      const data = await res.json();
      setForecast(data.forecast);
      setRunway(data.runway);
    } catch (err) {
      console.error('Failed to change horizon:', err);
    }
  };

  const handleRunScenario = async (params: ScenarioParameters) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result: SimulationResult = await res.json();
      setActiveSimulation(result);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveScenario = async (title: string, params: ScenarioParameters, result: SimulationResult) => {
    try {
      const res = await fetch('/api/scenarios/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, parameters: params, result }),
      });
      const saved = await res.json();
      setSavedScenarios((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Failed to save scenario:', err);
    }
  };

  const handleDeleteSavedScenario = async (id: string) => {
    try {
      await fetch(`/api/scenarios/saved/${id}`, { method: 'DELETE' });
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete saved scenario:', err);
    }
  };

  const handleUpdateBusiness = async (updates: Partial<Business>) => {
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedBiz = await res.json();
      setBusiness(updatedBiz);
      loadDashboard();
    } catch (err) {
      console.error('Failed to update business:', err);
    }
  };

  const handleAddInvoice = async (inv: Partial<Invoice>) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv),
      });
      const newInv = await res.json();
      setInvoices((prev) => [newInv, ...prev]);
      loadDashboard();
    } catch (err) {
      console.error('Failed to add invoice:', err);
    }
  };

  const handleRecordPayment = async (payment: Partial<Payment>) => {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      loadDashboard();
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  const handleToggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : a))
    );
  };

  const handleSimulateCustomerDelay = (customer: Customer, delayDays: number) => {
    const params: ScenarioParameters = {
      type: 'CUSTOMER_PAYMENT_DELAY',
      title: `${customer.name} ${delayDays}-Day Payment Delay`,
      customerId: customer.id,
      customerName: customer.name,
      delayDays,
    };
    setActiveTab('simulator');
    handleRunScenario(params);
  };

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      await fetch('/api/business/reset-demo', { method: 'POST' });
      await loadDashboard();
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResettingDemo(false);
    }
  };

  // Header Titles
  const getHeaderInfo = (): { title: string; subtitle: string } => {
    switch (activeTab) {
      case 'overview':
      case 'health':
        return {
          title: 'Financial Health & Liquidity Overview',
          subtitle: 'Real-time operational solvency, working capital burn, and risk exposure',
        };
      case 'simulator':
        return {
          title: 'Crisis & Stress-Testing Simulator',
          subtitle: 'Simulate customer payment defaults, revenue drops, and emergency capex',
        };
      case 'cashflow':
        return {
          title: 'Cash Flow Trajectory Engine',
          subtitle: 'Forward-looking cash projections incorporating customer-specific payment behavior',
        };
      case 'customers':
        return {
          title: 'Customer Concentration & Exposure',
          subtitle: 'Assess corporate buyer concentration and simulate accounts receivable delays',
        };
      case 'receivables':
        return {
          title: 'Invoices & Receivables Aging',
          subtitle: 'Track outstanding customer bills, aging brackets, and Days Sales Outstanding',
        };
      case 'risks':
        return {
          title: 'Operational Risk Center',
          subtitle: 'Identified vulnerabilities, severity indicators, and mitigations',
        };
      case 'actions':
        return {
          title: 'Corrective Action Plan',
          subtitle: 'Prioritized operational interventions tied directly to detected bottlenecks',
        };
      case 'ingestion':
        return {
          title: 'Data Center & Document Processing',
          subtitle: 'Extract invoices and dispatch scans and reconcile inward bank remittances',
        };
      case 'knowledge':
        return {
          title: 'Financial & Statutory Knowledge Base',
          subtitle: 'MSMED Act Section 15 Net 45 rules, liquidity formulas, and recovery playbooks',
        };
      default:
        return {
          title: 'Financial Intelligence Platform',
          subtitle: 'Deterministic operational cash runway and statutory compliance',
        };
    }
  };

  if (isLoadingDashboard && !business) {
    return (
      <div className="min-h-screen bg-[#e8eaf0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl neu-raised flex items-center justify-center text-[#586980] mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-[#222634]">
          Loading MSME Sentinel...
        </h2>
        <p className="text-xs text-[#6e7687] mt-1 max-w-sm">
          Computing deterministic liquidity scores, scanning receivables, and configuring simulation engines.
        </p>
      </div>
    );
  }

  if (!business || !healthScore) {
    return (
      <div className="min-h-screen bg-[#e8eaf0] flex items-center justify-center p-6">
        <div className="neu-raised bg-[#e8eaf0] p-6 rounded-2xl border border-[#d8dce6] text-center max-w-sm">
          <p className="text-sm font-semibold text-[#222634]">Error loading business state.</p>
          <button
            onClick={loadDashboard}
            className="mt-4 px-4 py-2 neu-btn-primary rounded-xl text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { title: pageTitle, subtitle: pageSubtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-[#eae7f2] text-[#212534] flex font-sans antialiased relative selection:bg-[#dcd4f2] selection:text-[#483a7a]">
      {/* Soft Ambient Organic Atmospheric Aura Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ded6f5] blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[480px] h-[480px] rounded-full bg-[#fae3ec] blur-3xl opacity-70" />
        <div className="absolute top-2/3 left-1/3 w-[500px] h-[500px] rounded-full bg-[#dbe8f8] blur-3xl opacity-60" />
        <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] rounded-full bg-[#daf0e3] blur-3xl opacity-60" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        business={business}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResettingDemo}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden relative z-10">
        {/* Top Header */}
        <TopHeader
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          business={business}
          confidence={dataConfidence || healthScore?.dataConfidenceAssessment || null}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenChat={() => setIsChatDrawerOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {(activeTab === 'overview' || activeTab === 'health' || activeTab === 'risks') && (
            <OverviewView
              business={business}
              healthScore={healthScore}
              risks={risks}
              forecast={forecast}
              runway={runway}
              receivables={receivables}
              concentration={concentration}
              actions={actions}
              invoices={invoices}
              onOpenHealthModal={() => setIsHealthModalOpen(true)}
              onOpenSimulator={() => setActiveTab('simulator')}
              onOpenReceivables={() => setActiveTab('receivables')}
              onOpenCustomers={() => setActiveTab('customers')}
              onOpenActionPlan={() => setActiveTab('actions')}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              business={business}
              customers={customers}
              activeSimulation={activeSimulation}
              savedScenarios={savedScenarios}
              resilienceIndex={resilienceIndex}
              runway={runway}
              onRunScenario={handleRunScenario}
              onSaveScenario={handleSaveScenario}
              onDeleteSavedScenario={handleDeleteSavedScenario}
              isLoading={isSimulating}
            />
          )}

          {activeTab === 'cashflow' && (
            <CashFlowView
              business={business}
              forecast={forecast}
              runway={runway}
              onSelectHorizon={handleSelectHorizon}
              selectedHorizon={selectedHorizon}
            />
          )}

          {activeTab === 'receivables' && (
            <ReceivablesView
              receivables={receivables}
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              concentration={concentration}
              customers={customers}
              onSimulateCustomerDelay={handleSimulateCustomerDelay}
            />
          )}

          {activeTab === 'ingestion' && (
            <IngestionView
              onAcceptInvoice={handleAddInvoice}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activeTab === 'actions' && (
            <ActionPlanView
              actions={actions}
              onToggleActionStatus={handleToggleAction}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView />
          )}
        </main>

        {/* Soft Neumorphic Footer */}
        <footer className="border-t border-[#d8d0e6] py-5 text-center text-xs text-[#565d70]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#212534]">MSME Sentinel</span>
              <span>•</span>
              <span className="text-[#7a6ab4] font-medium">Financial Intelligence & Resilience Platform</span>
            </div>
            <div className="text-[11px] text-[#828a9c] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3f7b58]" />
              <span>Statutory Compliance: MSMED Act 2006 (Net 45-day vendor settlement)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Health Score Methodology Modal */}
      <HealthScoreModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthScore={healthScore}
      />

      {/* Settings & Minimum Reserve Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        business={business}
        onSave={handleUpdateBusiness}
      />

      {/* Sentinel Financial Copilot Drawer */}
      <SentinelChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        healthScore={healthScore}
        onLoadScenarioIntoSimulator={(sim) => {
          setActiveSimulation(sim);
          setActiveTab('simulator');
        }}
      />
    </div>
  );
}
