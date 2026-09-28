import React, { useState, useEffect } from 'react';

export interface ServiceItem {
  id: string;
  category: string;
  subCategory: string;
  title: string;
  sku: string;
  price: number;
  strikePrice: number;
  gstPercent: number;
  durationMinutes: number;
  requiredPartners: number;
  thumbnailUrl: string;
  bannerUrl: string;
  videoUrl: string;
  description: string;
  scopeOfWork: string[];
  equipmentRequired: string[];
  isActive: boolean;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    category: 'Sofa Cleaning',
    subCategory: 'Fabric Sofa',
    title: '3-Seater Fabric Sofa Deep Cleaning',
    sku: 'SOFA-3S-FAB',
    price: 1499,
    strikePrice: 1999,
    gstPercent: 5,
    durationMinutes: 90,
    requiredPartners: 1,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Deep extraction vacuuming and injection scrubbing for 3 seater fabric sofa.',
    scopeOfWork: ['Dry vacuuming', 'Stain treatment', 'Shampooing', 'Extraction drying'],
    equipmentRequired: ['Extraction Vacuum', 'Foam Scrubbing Machine', 'Chemical Spray Kit'],
    isActive: true,
  },
  {
    id: 'srv-2',
    category: 'Full Home Deep Cleaning',
    subCategory: '2 BHK',
    title: '2 BHK Complete Deep Cleaning Package',
    sku: 'HOME-2BHK-DEEP',
    price: 3499,
    strikePrice: 4499,
    gstPercent: 5,
    durationMinutes: 240,
    requiredPartners: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    videoUrl: '',
    description: 'Complete deep cleaning of 2 Bedrooms, Kitchen, Bathrooms, and Living Room.',
    scopeOfWork: ['Floor scrubbing', 'Kitchen degreasing', 'Bathroom descaling', 'Balcony wash'],
    equipmentRequired: ['Single Disc Floor Scrubber', 'Industrial Vacuum', 'Steam Cleaner'],
    isActive: true,
  }
];

export const AdminCatalogueTab: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('bharatpro_catalog_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<ServiceItem, 'id'>>({
    category: 'Sofa Cleaning',
    subCategory: 'Fabric Sofa',
    title: '',
    sku: '',
    price: 0,
    strikePrice: 0,
    gstPercent: 5,
    durationMinutes: 60,
    requiredPartners: 1,
    thumbnailUrl: '',
    bannerUrl: '',
    videoUrl: '',
    description: '',
    scopeOfWork: [''],
    equipmentRequired: [''],
    isActive: true,
  });

  useEffect(() => {
    localStorage.setItem('bharatpro_catalog_services', JSON.stringify(services));
  }, [services]);

  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((srv) => {
    const matchesCategory = selectedCategory === 'ALL' || srv.category === selectedCategory;
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setFormData({
        category: service.category,
        subCategory: service.subCategory,
        title: service.title,
        sku: service.sku,
        price: service.price,
        strikePrice: service.strikePrice,
        gstPercent: service.gstPercent,
        durationMinutes: service.durationMinutes,
        requiredPartners: service.requiredPartners,
        thumbnailUrl: service.thumbnailUrl,
        bannerUrl: service.bannerUrl,
        videoUrl: service.videoUrl,
        description: service.description,
        scopeOfWork: [...service.scopeOfWork],
        equipmentRequired: [...service.equipmentRequired],
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      setFormData({
        category: 'Sofa Cleaning',
        subCategory: 'Standard',
        title: '',
        sku: `BP-${Date.now().toString().slice(-5)}`,
        price: 999,
        strikePrice: 1499,
        gstPercent: 5,
        durationMinutes: 60,
        requiredPartners: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        bannerUrl: '',
        videoUrl: '',
        description: '',
        scopeOfWork: ['Standard cleaning process'],
        equipmentRequired: ['Standard Cleaning Kit'],
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      const updated = services.map((s) =>
        s.id === editingService.id ? { ...formData, id: editingService.id } : s
      );
      setServices(updated);
    } else {
      const newService: ServiceItem = {
        ...formData,
        id: `srv-${Date.now()}`,
      };
      setServices([newService, ...services]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Kya aap sach me is service ko catalogue se hatana chahte hain?')) {
      const updated = services.filter((s) => s.id !== id);
      setServices(updated);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setServices(updated);
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Master Service Catalogue</h1>
          <p className="text-slate-400 text-sm">Add, Edit, Modify Pricing, Upload Media, and Manage Active Services</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-lg shadow transition"
        >
          + Add New Service
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <input
          type="text"
          placeholder="Search by Title or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 flex-1 min-w-[200px] focus:outline-none focus:border-amber-500"
        />
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-slate-800 rounded-xl overflow-hidden border ${
              service.isActive ? 'border-slate-700' : 'border-red-900/50 opacity-60'
            } flex flex-col justify-between`}
          >
            <div>
              <div className="relative h-48 bg-slate-950">
                <img
                  src={service.thumbnailUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 font-medium">
                  {service.category}
                </span>
                <span
                  className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-bold ${
                    service.isActive ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                  }`}
                >
                  {service.isActive ? 'LIVE' : 'DISABLED'}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-white leading-snug">{service.title}</h3>
                    <p className="text-xs text-slate-400">SKU: {service.sku} | {service.subCategory}</p>
                  </div>
                </div>

                <p className="text-slate-300 text-xs line-clamp-2">{service.description}</p>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-bold text-amber-400">₹{service.price}</span>
                  {service.strikePrice > service.price && (
                    <span className="text-sm text-slate-500 line-through">₹{service.strikePrice}</span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">+ {service.gstPercent}% GST</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                  <span>⏱ {service.durationMinutes} Mins</span>
                  <span>👤 {service.requiredPartners} Pro(s)</span>
                  {service.videoUrl && <span className="text-amber-400">🎥 Video Guide</span>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-850 border-t border-slate-700/60 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(service.id)}
                className={`text-xs px-3 py-1.5 rounded font-medium transition ${
                  service.isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {service.isActive ? 'Disable' : 'Enable'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(service)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs px-3 py-1.5 rounded transition"
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
              <h2 className="text-xl font-bold text-amber-400">
                {editingService ? 'Edit Service Listing' : 'Add New Cleaning Service'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold"
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
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Sofa Cleaning"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Sub-Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Fabric / L-Shape"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Selling Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Strike-through Price (INR)</label>
                  <input
                    type="number"
                    value={formData.strikePrice}
                    onChange={(e) => setFormData({ ...formData, strikePrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Est. Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Required Partners Count</label>
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
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Video Guide / Explainer URL</label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="YouTube Embed URL or MP4 Link"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Service Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-bold shadow"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};