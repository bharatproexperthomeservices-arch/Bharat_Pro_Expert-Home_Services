import React, { useState, useEffect } from 'react';
import { CleaningService } from '../../types';
import { 
  getAllServices, 
  addNewService, 
  updateServicePricing, 
  deleteService 
} from '../../services/dbService';
import { INITIAL_SERVICES } from '../../data';

interface AdminCatalogueTabProps {
  services?: CleaningService[];
  onRefresh?: () => void;
}

export const AdminCatalogueTab: React.FC<AdminCatalogueTabProps> = ({ 
  services: propServices, 
  onRefresh 
}) => {
  const [services, setServices] = useState<CleaningService[]>(() => {
    return propServices && propServices.length > 0 ? propServices : INITIAL_SERVICES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<CleaningService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state if propServices updates
  useEffect(() => {
    if (propServices && propServices.length > 0) {
      setServices(propServices);
    }
  }, [propServices]);

  // Load from dbService on mount if propServices was empty
  useEffect(() => {
    if (!propServices || propServices.length === 0) {
      getAllServices().then((srvs) => {
        if (srvs && srvs.length > 0) {
          setServices(srvs);
        }
      });
    }
  }, [propServices]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    categoryId: string;
    categoryName: string;
    subCategory: string;
    basePrice: number;
    referencePrice: number;
    gstPercent: number;
    estimatedMinutes: number;
    requiredPartners: number;
    imageUrl: string;
    bannerUrl: string;
    videoUrl: string;
    shortDesc: string;
    detailedDesc: string;
    scopeOfWork: string;
    equipmentRequired: string;
    active: boolean;
  }>({
    name: '',
    sku: '',
    categoryId: 'bathroom-cleaning',
    categoryName: 'Bathroom Deep Cleaning',
    subCategory: 'Standard',
    basePrice: 999,
    referencePrice: 1499,
    gstPercent: 5,
    estimatedMinutes: 60,
    requiredPartners: 1,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    bannerUrl: '',
    videoUrl: '',
    shortDesc: '',
    detailedDesc: '',
    scopeOfWork: 'Deep scrubbing, Descaling, Stain removal, Chemical wash',
    equipmentRequired: 'Single disc machine, Industrial vacuum, Safe chemical kit',
    active: true,
  });

  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.categoryName || s.categoryId)))];

  const filteredServices = services.filter((srv) => {
    const matchesCategory = selectedCategory === 'ALL' || 
      srv.categoryName === selectedCategory || 
      srv.categoryId === selectedCategory;
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.sku && srv.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.shortDesc && srv.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenModal = (service?: CleaningService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        sku: service.sku || `BPE-${service.id.slice(-6).toUpperCase()}`,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        subCategory: service.subCategory || service.categoryName,
        basePrice: service.basePrice,
        referencePrice: service.referencePrice || Math.round(service.basePrice / 0.85),
        gstPercent: service.gstPercent ?? 5,
        estimatedMinutes: service.estimatedMinutes || 60,
        requiredPartners: service.requiredPartners ?? 1,
        imageUrl: service.imageUrl || '',
        bannerUrl: service.bannerUrl || service.imageUrl || '',
        videoUrl: service.videoUrl || '',
        shortDesc: service.shortDesc || '',
        detailedDesc: service.detailedDesc || '',
        scopeOfWork: Array.isArray(service.scopeOfWork) 
          ? service.scopeOfWork.join(', ') 
          : Array.isArray(service.inclusions) 
          ? service.inclusions.join(', ') 
          : '',
        equipmentRequired: Array.isArray(service.equipmentRequired) 
          ? service.equipmentRequired.join(', ') 
          : 'Standard Professional Cleaning Equipment',
        active: service.active ?? true,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        sku: `BPE-SRV-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home / By Room Deep Cleaning',
        subCategory: 'Deep Clean',
        basePrice: 1499,
        referencePrice: 1999,
        gstPercent: 5,
        estimatedMinutes: 90,
        requiredPartners: 2,
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        bannerUrl: '',
        videoUrl: '',
        shortDesc: 'Complete professional deep sanitization and scrubbing service.',
        detailedDesc: 'Includes full high-grade mechanical scrubbing, stain treatment, eco-friendly chemicals, and verified finish check.',
        scopeOfWork: 'Floor scrubbing, Dust extraction, Surface sanitizing, Mirror & tile buffing',
        equipmentRequired: 'Floor buffing machine, Industrial vacuum, Degreasing agent, Microfiber tools',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const scopeList = formData.scopeOfWork.split(',').map((s) => s.trim()).filter(Boolean);
      const equipList = formData.equipmentRequired.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingService) {
        const updatedFields: Partial<CleaningService> = {
          name: formData.name,
          sku: formData.sku,
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          subCategory: formData.subCategory,
          basePrice: Number(formData.basePrice),
          referencePrice: Number(formData.referencePrice),
          competitorPrice: Number(formData.referencePrice),
          gstPercent: Number(formData.gstPercent),
          estimatedMinutes: Number(formData.estimatedMinutes),
          requiredPartners: Number(formData.requiredPartners),
          imageUrl: formData.imageUrl,
          bannerUrl: formData.bannerUrl,
          videoUrl: formData.videoUrl,
          shortDesc: formData.shortDesc,
          detailedDesc: formData.detailedDesc,
          scopeOfWork: scopeList,
          equipmentRequired: equipList,
          inclusions: scopeList.length > 0 ? scopeList : (editingService.inclusions || []),
          active: formData.active,
        };

        await updateServicePricing(editingService.id, updatedFields);

        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...updatedFields } : s))
        );
        showToast(`Service "${formData.name}" successfully updated.`);
      } else {
        const newId = `srv-${Date.now()}`;
        const newService: CleaningService = {
          id: newId,
          name: formData.name,
          sku: formData.sku,
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          subCategory: formData.subCategory,
          basePrice: Number(formData.basePrice),
          referencePrice: Number(formData.referencePrice),
          competitorPrice: Number(formData.referencePrice),
          discountPct: Math.round(((formData.referencePrice - formData.basePrice) / formData.referencePrice) * 100) || 15,
          pricingMode: 'MANUAL',
          priceVersion: 'v1.0.0',
          active: formData.active,
          estimatedMinutes: Number(formData.estimatedMinutes),
          rating: 4.9,
          reviewCount: 1,
          imageUrl: formData.imageUrl,
          beforeAfterImage: formData.imageUrl,
          demoVideoBadge: 'Verified Pro Clean',
          steps: [
            { order: 1, title: 'Inspection & Setup', description: 'Technician inspects work area and prepares specialized chemicals.', estimatedMinutes: 15 },
            { order: 2, title: 'Deep Treatment', description: 'Multi-stage machine scrubbing and sanitization process.', estimatedMinutes: 45 },
            { order: 3, title: 'Quality Check & OTP', description: 'Customer reviews final result and shares Completion OTP.', estimatedMinutes: 10 }
          ],
          inclusions: scopeList,
          exclusions: ['Damage repair', 'Repainting', 'Plumbing alterations'],
          addons: [],
          gstPercent: Number(formData.gstPercent),
          requiredPartners: Number(formData.requiredPartners),
          bannerUrl: formData.bannerUrl,
          videoUrl: formData.videoUrl,
          shortDesc: formData.shortDesc,
          detailedDesc: formData.detailedDesc,
          scopeOfWork: scopeList,
          equipmentRequired: equipList
        };

        await addNewService(newService);
        setServices((prev) => [newService, ...prev]);
        showToast(`New service "${formData.name}" added to live catalogue.`);
      }

      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving catalogue item:', err);
      showToast('Error saving service. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the live catalogue?`)) {
      try {
        await deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
        showToast(`Service "${name}" removed from catalogue.`);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Failed to delete service:', err);
        showToast('Failed to delete service.');
      }
    }
  };

  const handleToggleStatus = async (service: CleaningService) => {
    const nextStatus = !service.active;
    try {
      await updateServicePricing(service.id, { active: nextStatus });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, active: nextStatus } : s))
      );
      showToast(`Service marked as ${nextStatus ? 'LIVE' : 'DISABLED'}.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast('Failed to update status.');
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl border border-amber-400 transition transform duration-300">
          ✓ {notification}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-amber-400">Master Service Catalogue</h1>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold">
              {services.length} Total Services (Live Synced)
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time synchronization between Admin Catalogue, Customer Website & Mobile View.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add New Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <input
          type="text"
          placeholder="Search by Title, SKU or Description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 flex-1 min-w-[200px] focus:outline-none focus:border-amber-500 text-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          Showing {filteredServices.length} of {services.length}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-slate-800 rounded-xl overflow-hidden border ${
              service.active ? 'border-slate-700' : 'border-red-900/50 opacity-60'
            } flex flex-col justify-between shadow-lg hover:border-slate-600 transition`}
          >
            <div>
              <div className="relative h-48 bg-slate-950">
                <img
                  src={service.imageUrl || 'https://via.placeholder.com/400x300?text=Bharat+Pro+Expert'}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 font-medium">
                  {service.categoryName || service.categoryId}
                </span>
                <span
                  className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-bold shadow ${
                    service.active ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                  }`}
                >
                  {service.active ? 'LIVE' : 'DISABLED'}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-white leading-snug">{service.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      SKU: {service.sku || `BPE-${service.id.slice(-6).toUpperCase()}`}
                      {service.subCategory && ` • ${service.subCategory}`}
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-xs line-clamp-2">
                  {service.shortDesc || service.detailedDesc}
                </p>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-bold text-amber-400">₹{service.basePrice}</span>
                  {service.referencePrice > service.basePrice && (
                    <span className="text-sm text-slate-500 line-through">₹{service.referencePrice}</span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">+ {service.gstPercent ?? 5}% GST</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                  <span>⏱ {service.estimatedMinutes || 60} Mins</span>
                  <span>👤 {service.requiredPartners || 1} Pro(s)</span>
                  <span>★ {service.rating || '4.9'}</span>
                  {service.videoUrl && <span className="text-amber-400">🎥 Video</span>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-850 border-t border-slate-700/60 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(service)}
                className={`text-xs px-3 py-1.5 rounded font-medium transition cursor-pointer ${
                  service.active
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {service.active ? 'Disable' : 'Enable'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(service)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded transition cursor-pointer font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id, service.name)}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs px-3 py-1.5 rounded transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-400">
                  {editingService ? `Edit: ${editingService.name}` : 'Add New Cleaning Service'}
                </h2>
                <p className="text-xs text-slate-400">
                  Changes sync across the public booking site, customer app, and admin system.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 3 BHK Deep Cleaning"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const id = e.target.value;
                      let name = 'Cleaning';
                      if (id === 'full-home-cleaning') name = 'Full Home / By Room Deep Cleaning';
                      else if (id === 'bathroom-cleaning') name = 'Bathroom Deep Cleaning';
                      else if (id === 'kitchen-cleaning') name = 'Kitchen Deep Cleaning';
                      else if (id === 'sofa-carpet-living') name = 'Sofa, Carpet & Living/Bedroom Furniture';
                      else if (id === 'balcony-floor-scrubbing') name = 'Balcony & Floor Scrubbing';
                      else if (id === 'mini-services') name = 'Mini Services / Add-ons';
                      setFormData({ ...formData, categoryId: id, categoryName: name });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="full-home-cleaning">Full Home / By Room Deep Cleaning</option>
                    <option value="bathroom-cleaning">Bathroom Deep Cleaning</option>
                    <option value="kitchen-cleaning">Kitchen Deep Cleaning</option>
                    <option value="sofa-carpet-living">Sofa, Carpet & Living/Bedroom Furniture</option>
                    <option value="balcony-floor-scrubbing">Balcony & Floor Scrubbing</option>
                    <option value="mini-services">Mini Services / Add-ons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Sub-Category / Variant</label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Fabric / L-Shape / Furnished"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Bharat Pro Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Market Benchmark / Strike Price (₹)</label>
                  <input
                    type="number"
                    value={formData.referencePrice}
                    onChange={(e) => setFormData({ ...formData, referencePrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Estimated Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Required Technicians / Partners</label>
                  <input
                    type="number"
                    value={formData.requiredPartners}
                    onChange={(e) => setFormData({ ...formData, requiredPartners: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Thumbnail Image URL *</label>
                <input
                  type="text"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Video Explainer URL (Optional)</label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="https://youtube.com/... or MP4"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Short Summary (1-2 sentences) *</label>
                <input
                  type="text"
                  required
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Brief highlights visible on service cards"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  value={formData.detailedDesc}
                  onChange={(e) => setFormData({ ...formData, detailedDesc: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="In-depth explanation of service protocol"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Scope of Work (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.scopeOfWork}
                    onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="Floor scrubbing, Balcony wash, Tile descaling"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Equipment Required (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.equipmentRequired}
                    onChange={(e) => setFormData({ ...formData, equipmentRequired: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="Single Disc Scrubber, Industrial Vacuum"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheckbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-amber-500 bg-slate-900 border-slate-700 rounded focus:ring-amber-400"
                />
                <label htmlFor="activeCheckbox" className="text-sm font-medium text-slate-200 cursor-pointer">
                  Service is active and available for customer booking
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-bold shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
