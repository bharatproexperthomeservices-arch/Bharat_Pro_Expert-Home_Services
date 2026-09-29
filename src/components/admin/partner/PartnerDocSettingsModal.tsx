import React, { useState } from 'react';
import { RequiredDocumentConfig } from '../../../types';
import { 
  getDocumentRequirements, 
  saveDocumentRequirements,
  DEFAULT_REQUIRED_DOCUMENTS 
} from '../../../services/partnerAuthService';
import { Sliders, X, CheckCircle2, RotateCcw } from 'lucide-react';

interface PartnerDocSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerDocSettingsModal: React.FC<PartnerDocSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [configs, setConfigs] = useState<RequiredDocumentConfig[]>(getDocumentRequirements());

  if (!isOpen) return null;

  const handleToggleMandatory = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, isMandatory: !c.isMandatory } : c));
  };

  const handleToggleActive = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleSave = () => {
    saveDocumentRequirements(configs);
    alert('Onboarding document requirements updated successfully!');
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset document requirements to default compliance rules?')) {
      setConfigs(DEFAULT_REQUIRED_DOCUMENTS);
      saveDocumentRequirements(DEFAULT_REQUIRED_DOCUMENTS);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="font-bold text-sm text-[#1C1C1E]">Configure Partner Onboarding Documents</h4>
              <p className="text-[11px] text-slate-500">Toggle mandatory compliance vs optional document uploads</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
          {configs.map((c) => (
            <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">{c.documentName}</span>
                <span className="text-[11px] text-slate-500">{c.description}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMandatory(c.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                    c.isMandatory 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.isMandatory ? 'MANDATORY' : 'OPTIONAL'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(c.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                    c.isActive 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {c.isActive ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Save Requirements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
