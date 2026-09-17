import React from 'react';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Users,
  Receipt,
  ShieldAlert,
  SlidersHorizontal,
  CheckSquare,
  Database,
  BookOpen,
  Settings,
  Building2,
  RefreshCw,
  X,
  Compass,
} from 'lucide-react';
import { Business } from '../types';

export type NavTabId =
  | 'overview'
  | 'health'
  | 'cashflow'
  | 'customers'
  | 'receivables'
  | 'risks'
  | 'simulator'
  | 'actions'
  | 'ingestion'
  | 'knowledge'
  | 'settings';

interface SidebarProps {
  business: Business | null;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenSettingsModal: () => void;
  onOpenHealthModal: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  business,
  activeTab,
  onSelectTab,
  onOpenSettingsModal,
  onOpenHealthModal,
  onResetDemo,
  isResetting = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'overview' as NavTabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'health' as NavTabId, label: 'Business Health', icon: Activity },
    { id: 'cashflow' as NavTabId, label: 'Cash Flow', icon: TrendingUp },
    { id: 'customers' as NavTabId, label: 'Customers', icon: Users },
    { id: 'receivables' as NavTabId, label: 'Invoices', icon: Receipt },
    { id: 'risks' as NavTabId, label: 'Risk Center', icon: ShieldAlert },
    { id: 'simulator' as NavTabId, label: 'Crisis Simulator', icon: SlidersHorizontal },
    { id: 'actions' as NavTabId, label: 'Action Plan', icon: CheckSquare },
    { id: 'ingestion' as NavTabId, label: 'Data Center', icon: Database },
    { id: 'knowledge' as NavTabId, label: 'Knowledge', icon: BookOpen },
    { id: 'settings' as NavTabId, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: NavTabId) => {
    if (id === 'settings') {
      onOpenSettingsModal();
    } else if (id === 'health') {
      onOpenHealthModal();
    } else {
      onSelectTab(id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#252936]/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 xl:w-72 bg-[#dedae9] z-50 flex flex-col justify-between p-4 border-r border-[#cfc7dd] transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Wordmark & Logo */}
        <div>
          <div className="flex items-center justify-between px-2 pt-2 pb-5 border-b border-[#cfc7dd]">
            <div className="flex items-center gap-3">
              {/* Minimalist physical emblem with lavender depth & subtle blush micro-accent */}
              <div className="relative w-10 h-10 rounded-xl neu-card-lavender flex items-center justify-center text-[#7a6ab4]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                {/* Subtle blush accent pip on the emblem */}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#b95d77] border-2 border-[#dedae9]" />
              </div>
              <div>
                <div className="font-bold text-base tracking-tight text-[#212534] leading-tight">
                  MSME Sentinel
                </div>
                <div className="text-[10px] font-semibold text-[#7a6ab4] tracking-wider uppercase">
                  Financial Resilience
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg neu-btn text-[#565d70] hover:text-[#212534]"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                    isActive
                      ? 'neu-card-lavender text-[#483a7a] font-bold shadow-sm'
                      : 'text-[#565d70] hover:text-[#212534] hover:bg-[#e7e3f2] neu-nav-item'
                  }`}
                >
                  {/* Active Indicator Bar / Dot */}
                  <span
                    className={`w-1.5 h-4 rounded-full transition-all ${
                      isActive ? 'bg-[#7a6ab4]' : 'bg-transparent'
                    }`}
                  />
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#7a6ab4]' : 'text-[#7e8598]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.id === 'simulator' && (
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f8eaef] text-[#b95d77] border border-[#edd4dc]">
                      Stress
                    </span>
                  )}
                  {item.id === 'overview' && !isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3f7b58]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Business Profile Card */}
        <div className="pt-3 border-t border-[#cfc7dd]">
          <div className="neu-card-lavender p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg neu-inset-lavender flex items-center justify-center text-[#7a6ab4] shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#212534] truncate">
                    {business?.name || 'Apex Forgings'}
                  </div>
                  <div className="text-[10px] text-[#7a6ab4] truncate font-medium">
                    {business?.industry || 'Precision Forgings'}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenSettingsModal}
                className="p-1.5 rounded-lg neu-btn text-[#565d70] hover:text-[#212534]"
                title="Business Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#dcd4f2] text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-[#235237] font-semibold text-[10px]">
                <span className="w-2 h-2 rounded-full bg-[#3f7b58] animate-pulse" />
                Active Ledger Sync
              </span>

              {onResetDemo && (
                <button
                  onClick={onResetDemo}
                  disabled={isResetting}
                  className="text-[10px] font-semibold text-[#b95d77] hover:text-[#733045] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset demo data"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Resetting' : 'Reset Demo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
