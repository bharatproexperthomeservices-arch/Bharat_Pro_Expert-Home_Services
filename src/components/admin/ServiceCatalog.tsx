import React, { useState } from 'react';
import { CleaningService } from '../../types';
import { Layers, Plus, Edit2, ShieldAlert, Tag, Percent, DollarSign, Image as ImageIcon, Save, RefreshCw } from 'lucide-react';

interface ServiceCatalogProps {
  services: CleaningService[];
  onRefresh: () => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  services,
  onRefresh,
  onAuditLog
}) => {
  const [selectedService, setSelectedService] = useState<CleaningService | null>(services[0] || null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable Form State
  const [editPrice, setEditPrice] = useState<number>(selectedService?.basePrice || 0);
  const [editOriginalPrice, setEditOriginalPrice] = useState<number>(selectedService?.referencePrice || 0);
  const [editTitle, setEditTitle] = useState<string>(selectedService?.name || '');
  const [editDescription, setEditDescription] = useState<string>(selectedService?.shortDesc || '');

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    selectedService.basePrice = editPrice;
    selectedService.referencePrice = editOriginalPrice;
    selectedService.name = editTitle;
    selectedService.shortDesc = editDescription;

    setIsEditing(false);
    onAuditLog?.('UPDATE_SERVICE', selectedService.id, `Updated pricing to ₹${editPrice} (Original ₹${editOriginalPrice})`);
    alert(`Service "${selectedService.name}" updated successfully! Price snapshot preserved for active bookings.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 bg-[#0B1220] rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wide mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Master Service Catalog &amp; Pricing Engine</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Services, Packages &amp; Add-ons Control</h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative service catalog. Existing prices preserved for active bookings with server-side validation.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Services ({services.length})</h3>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {services.map(s => {
              const isSelected = selectedService?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setEditPrice(s.basePrice);
                    setEditOriginalPrice(s.referencePrice || s.basePrice);
                    setEditTitle(s.name);
                    setEditDescription(s.shortDesc || '');
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.categoryName || 'Home Service'}</p>
                    </div>
                    <span className="font-mono text-xs font-black text-blue-700">
                      &#8377;{s.basePrice}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Service Editor */}
        <div className="lg:col-span-7 space-y-6">
          {selectedService ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedService.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">ID: {selectedService.id}</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Service / Price</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveService} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (&#8377;)</label>
                      <input
                        type="number"
                        required
                        value={editPrice}
                        onChange={e => setEditPrice(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Original MRP (&#8377;)</label>
                      <input
                        type="number"
                        value={editOriginalPrice}
                        onChange={e => setEditOriginalPrice(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">Base Selling Price</span>
                      <span className="text-base font-extrabold text-blue-700 font-mono">&#8377;{selectedService.basePrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">Reference Benchmark</span>
                      <span className="text-sm font-bold text-slate-500 font-mono line-through">&#8377;{selectedService.referencePrice || selectedService.basePrice}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold mb-1">Description</span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedService.shortDesc || selectedService.detailedDesc || 'No detailed description provided.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a service from the catalog to configure details and prices.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalog;
