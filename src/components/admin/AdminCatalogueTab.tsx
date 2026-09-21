import React, { useState } from 'react';
import { CleaningService, ServiceAddon } from '../../types';
import { updateServicePricing, addNewService, toggleServiceActive } from '../../services/dbService';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Copy, 
  Eye, 
  Check, 
  X, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Tag,
  Percent,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';

interface AdminCatalogueTabProps {
  services: CleaningService[];
  onRefresh: () => void;
}

export const AdminCatalogueTab: React.FC<AdminCatalogueTabProps> = ({
  services,
  onRefresh
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [editingService, setEditingService] = useState<CleaningService | null>(null);
  const [previewService, setPreviewService] = useState<CleaningService | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New service form state
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('bathroom-cleaning');
  const [newRefPrice, setNewRefPrice] = useState(699);
  const [newDiscountPct, setNewDiscountPct] = useState(15);
  const [newDuration, setNewDuration] = useState(60);
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState('Tile scrubbing with Taski R2\nWater stain removal from chrome taps\nToilet bowl disinfection with Taski R6\nMirror streak-free wipe');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Cleaning (47)' },
    { id: 'bathroom-cleaning', label: 'Bathroom Cleaning (10)' },
    { id: 'kitchen-cleaning', label: 'Kitchen Cleaning (9)' },
    { id: 'full-home-cleaning', label: 'Full Home Deep Cleaning (15)' },
    { id: 'sofa-carpet-cleaning', label: 'Living, Sofa & Carpet (13)' }
  ];

  // Filtering
  const filteredServices = services.filter(s => {
    const matchesCat = activeCategory === 'ALL' || s.categoryId === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Toggle active
  const handleToggleActive = async (srv: CleaningService) => {
    const newActive = srv.active === false ? true : false;
    await toggleServiceActive(srv.id, newActive);
    onRefresh();
  };

  // Duplicate service
  const handleDuplicate = async (srv: CleaningService) => {
    const dup: CleaningService = {
      ...srv,
      id: `${srv.id}-copy-${Date.now()}`,
      name: `${srv.name} (Copy)`
    };
    await addNewService(dup);
    onRefresh();
  };

  // Create new service submit
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const bpePrice = Math.round(newRefPrice * (1 - newDiscountPct / 100));
      const categoryNames: Record<string, string> = {
        'bathroom-cleaning': 'Bathroom Cleaning',
        'kitchen-cleaning': 'Kitchen Cleaning',
        'full-home-cleaning': 'Full Home Cleaning',
        'sofa-carpet-cleaning': 'Living Room, Sofa & Carpet'
      };

      const stepLines = newSteps.split('\n').filter(s => s.trim().length > 0);
      const parsedSteps = stepLines.map((line, idx) => ({
        order: idx + 1,
        title: line.trim(),
        description: `Step ${idx + 1}: ${line.trim()}`,
        estimatedMinutes: Math.round(newDuration / Math.max(1, stepLines.length))
      }));

      const newSrv: CleaningService = {
        id: `srv-${newCategoryId}-${Date.now().toString(36)}`,
        name: newName,
        categoryId: newCategoryId,
        categoryName: categoryNames[newCategoryId] || 'Cleaning',
        shortDesc: newDesc || `${newName} professional deep cleaning service with certified chemicals.`,
        detailedDesc: newDesc || `${newName} professional deep cleaning service with certified chemicals.`,
        referencePrice: newRefPrice,
        discountPct: newDiscountPct,
        basePrice: bpePrice,
        competitorPrice: newRefPrice,
        pricingMode: 'REFERENCE_PERCENT',
        priceVersion: 'v1.0.0',
        estimatedMinutes: newDuration,
        rating: 4.85,
        reviewCount: 120,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        beforeAfterImage: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
        demoVideoBadge: 'HD Video Guide',
        inclusions: ['Pre-treatment inspection', 'Single-disc scrubbing', 'Vacuuming & wiping'],
        exclusions: ['Structural repairs', 'Deep rust removal from exterior walls'],
        steps: parsedSteps.length > 0 ? parsedSteps : [
          { order: 1, title: 'Deep inspection & dry dusting', description: 'Inspect surfaces and dry dust', estimatedMinutes: 15 },
          { order: 2, title: 'Chemical application & scrubbing', description: 'Apply non-hazardous chemicals', estimatedMinutes: 30 },
          { order: 3, title: 'Sanitization & mop wipe', description: 'Sanitize surfaces', estimatedMinutes: 15 }
        ],
        addons: [
          { id: 'addon-1', name: 'Anti-Bacterial Spray Coat', price: 149, description: 'Medical-grade antibacterial surface protection' },
          { id: 'addon-2', name: 'Exhaust Fan Deep Degreasing', price: 199, description: 'Chemical soak and rotary blade scrubbing' }
        ],
        active: true
      };

      await addNewService(newSrv);
      setIsCreatingNew(false);
      setNewName('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create service', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick edit save
  const handleSaveEdit = async () => {
    if (!editingService) return;
    setIsSubmitting(true);
    try {
      const ref = editingService.referencePrice || Math.round(editingService.basePrice / 0.85);
      const discount = editingService.discountPct || 15;
      const bpePrice = editingService.pricingMode === 'MANUAL' 
        ? editingService.basePrice 
        : Math.round(ref * (1 - discount / 100));

      await updateServicePricing(editingService.id, {
        ...editingService,
        basePrice: bpePrice,
        competitorPrice: ref
      });
      setEditingService(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update service', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-catalogue-tab">
      {/* Top Controls Bar */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase">
              Master Catalogue
            </span>
            <span className="text-xs text-[#8E8E93]">Cleaning Marketplace Only</span>
          </div>
          <h2 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
            Services &amp; Standard Operating Procedures (SOP)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2.5 rounded-xl bg-[#E07B1A] hover:bg-[#c96c14] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Cleaning Service</span>
          </button>
        </div>
      </div>

      {/* Categories & Search Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white border border-[#E5E5EA] text-[#48484A] hover:bg-[#F2F2F7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by cleaning service title, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D1D1D6] bg-white text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const refPrice = srv.referencePrice || Math.round(srv.basePrice / 0.85);
          const savings = refPrice - srv.basePrice;
          const isActive = srv.active !== false;

          return (
            <div 
              key={srv.id} 
              className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                isActive ? 'border-[#E5E5EA]' : 'border-neutral-300 opacity-60 bg-neutral-50'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[#D4A24E]/10 text-[#B8892E] font-bold text-[10px] uppercase tracking-wider">
                    {srv.categoryName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {srv.popular && (
                      <span className="px-2 py-0.5 rounded bg-[#E07B1A]/10 text-[#E07B1A] font-bold text-[10px]">
                        Popular Choice
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E] line-clamp-1">{srv.name}</h3>
                  <p className="text-xs text-[#8E8E93] line-clamp-2 mt-1">{srv.shortDesc}</p>
                </div>

                {/* Pricing Block */}
                <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block font-medium">Bharat Pro Price</span>
                    <span className="text-base font-black text-[#1C1C1E]">₹{srv.basePrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E8E93] line-through block">₹{refPrice} (Benchmark)</span>
                    <span className="text-xs font-bold text-emerald-600">Save ₹{savings} ({srv.discountPct || 15}% off)</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8E8E93]" /> {srv.estimatedMinutes} mins
                  </span>
                  <span>{srv.steps.length} SOP checklist steps</span>
                  <span>{srv.addons?.length || 0} add-ons</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E5E5EA] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewService(srv)}
                    title="Customer Card Preview"
                    className="p-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-[#48484A]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(srv)}
                    title="Duplicate Service"
                    className="p-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all"
                  >
                    <Copy className="w-4 h-4 text-[#48484A]" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(srv)}
                    className="px-2.5 py-1.5 rounded-xl border border-[#D1D1D6] text-[11px] font-bold text-[#48484A] hover:bg-neutral-100 transition-all"
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingService({ ...srv })}
                    className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Customer Card Preview Modal */}
      {previewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#F8F9FB] border border-[#E5E5EA] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#E07B1A]" />
                <span className="text-xs font-bold text-[#1C1C1E]">Customer Card Live Preview</span>
              </div>
              <button
                onClick={() => setPreviewService(null)}
                className="p-1.5 rounded-full hover:bg-[#E5E5EA]"
              >
                <X className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>

            {/* Mock Customer Card */}
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  15% Transparent Savings
                </span>
                <span className="text-[11px] text-[#8E8E93] flex items-center gap-1">
                  ★ {previewService.rating} ({previewService.reviewCount})
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1C1C1E]">{previewService.name}</h4>
                <p className="text-xs text-[#8E8E93] line-clamp-2 mt-1">{previewService.shortDesc}</p>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-[#F2F2F7]">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-[#1C1C1E]">₹{previewService.basePrice}</span>
                  <span className="text-xs text-[#8E8E93] line-through">
                    ₹{previewService.referencePrice || Math.round(previewService.basePrice / 0.85)}
                  </span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-[#E07B1A] text-white text-xs font-bold">
                  Book Now
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-[#8E8E93]">
              Rendered according to Bharat Pro Expert transparent pricing standard.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Service & Pricing Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1C1C1E]">Edit Cleaning Service</h3>
              <button onClick={() => setEditingService(null)} className="p-1 rounded-full hover:bg-[#F2F2F7]">
                <X className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Service Title</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#1C1C1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.shortDesc}
                  onChange={(e) => setEditingService({ ...editingService, shortDesc: e.target.value, detailedDesc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs text-[#1C1C1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Market Benchmark (₹)</label>
                  <input
                    type="number"
                    value={editingService.referencePrice || Math.round(editingService.basePrice / 0.85)}
                    onChange={(e) => {
                      const ref = Number(e.target.value);
                      const disc = editingService.discountPct || 15;
                      setEditingService({
                        ...editingService,
                        referencePrice: ref,
                        basePrice: Math.round(ref * (1 - disc / 100))
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={editingService.discountPct || 15}
                    onChange={(e) => {
                      const disc = Number(e.target.value);
                      const ref = editingService.referencePrice || Math.round(editingService.basePrice / 0.85);
                      setEditingService({
                        ...editingService,
                        discountPct: disc,
                        basePrice: Math.round(ref * (1 - disc / 100))
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#E0B050] text-xs flex justify-between items-center">
                <span className="font-bold text-[#1C1C1E]">Calculated Bharat Pro Price:</span>
                <span className="text-base font-black text-[#E07B1A]">₹{editingService.basePrice}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.estimatedMinutes}
                    onChange={(e) => setEditingService({ ...editingService, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Pricing Mode</label>
                  <select
                    value={editingService.pricingMode || 'REFERENCE_PERCENT'}
                    onChange={(e) => setEditingService({ ...editingService, pricingMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  >
                    <option value="REFERENCE_PERCENT">Formula (Reference × 0.85)</option>
                    <option value="MANUAL">Manual Override</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#48484A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#E07B1A] text-white text-xs font-bold hover:bg-[#c96c14]"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New Cleaning Service Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={handleCreateService} className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1C1C1E]">Add New Cleaning Service</h3>
              <button type="button" onClick={() => setIsCreatingNew(false)} className="p-1 rounded-full hover:bg-[#F2F2F7]">
                <X className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Department</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                >
                  <option value="bathroom-cleaning">Bathroom Cleaning</option>
                  <option value="kitchen-cleaning">Kitchen Cleaning</option>
                  <option value="full-home-cleaning">Full Home Cleaning</option>
                  <option value="sofa-carpet-cleaning">Living Room, Sofa &amp; Carpet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 3BHK Full Home Deep Scrubbing"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Market Benchmark (₹)</label>
                  <input
                    type="number"
                    value={newRefPrice}
                    onChange={(e) => setNewRefPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#48484A] block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={newDiscountPct}
                    onChange={(e) => setNewDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#E0B050] text-xs flex justify-between items-center">
                <span className="font-bold text-[#1C1C1E]">Calculated Bharat Pro Price:</span>
                <span className="text-base font-black text-[#E07B1A]">
                  ₹{Math.round(newRefPrice * (1 - newDiscountPct / 100))}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Estimated Duration (Mins)</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#48484A] block mb-1">Standard Operating Procedure (SOP Steps)</label>
                <textarea
                  rows={3}
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="One step per line..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold text-[#48484A]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#E07B1A] text-white text-xs font-bold hover:bg-[#c96c14]"
              >
                {isSubmitting ? 'Creating...' : 'Create & Publish'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
