import React, { useState } from 'react';
import { X, Building2, Wallet, ShieldAlert, Save } from 'lucide-react';
import { Business } from '../types';

interface SettingsModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<Business>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  business,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(business.name);
  const [industry, setIndustry] = useState(business.industry);
  const [currentCash, setCurrentCash] = useState(business.currentCash ?? business.liquidCash ?? 1350000);
  const [minimumCashReserve, setMinimumCashReserve] = useState(business.minimumCashReserve ?? business.minimumReserve ?? 500000);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        industry,
        currentCash: Number(currentCash),
        minimumCashReserve: Number(minimumCashReserve),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#212534]/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#ede9f7] rounded-3xl max-w-lg w-full neu-raised border border-[#d6d0e4] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#dcd4f2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neu-card-lavender flex items-center justify-center text-[#483a7a]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#212534]">Business Profile & Buffer Policy</h3>
              <p className="text-xs text-[#565d70]">Parameters used across financial forecasts and stress tests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg neu-btn text-[#7a6ab4] hover:text-[#212534] bg-white/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#483a7a] mb-1">
              Enterprise Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl neu-input font-semibold text-[#212534]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#483a7a] mb-1">
              Industry / Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl neu-input font-semibold text-[#212534]"
            />
          </div>

          <div className="pt-2 border-t border-[#dcd4f2]">
            <label className="block font-bold text-[#483a7a] mb-1 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#3f7b58]" />
              Current Liquid Cash Balance (₹)
            </label>
            <input
              type="number"
              value={currentCash}
              onChange={(e) => setCurrentCash(Number(e.target.value))}
              required
              min={0}
              step={10000}
              className="w-full px-3.5 py-2 rounded-xl neu-input font-extrabold text-[#212534]"
            />
            <span className="text-[11px] text-[#7a6ab4] mt-1 block font-medium">
              Current: ₹{(Number(currentCash) / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          <div>
            <label className="block font-bold text-[#483a7a] mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#b37346]" />
              Minimum Safety Cash Reserve (₹)
            </label>
            <input
              type="number"
              value={minimumCashReserve}
              onChange={(e) => setMinimumCashReserve(Number(e.target.value))}
              required
              min={0}
              step={10000}
              className="w-full px-3.5 py-2 rounded-xl neu-input font-extrabold text-[#212534]"
            />
            <span className="text-[11px] text-[#7a6ab4] mt-1 block font-medium">
              Safety Buffer: ₹{(Number(minimumCashReserve) / 100000).toFixed(2)} Lakhs (The simulator flags any drop below this line)
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#dcd4f2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#483a7a] bg-white/70 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
