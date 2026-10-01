import React, { useState, useEffect, useRef } from 'react';
import { CleaningService } from '../../types';
import { 
  getAllServices, 
  addNewService, 
  updateServicePricing, 
  deleteService 
} from '../../services/dbService';
import { INITIAL_SERVICES } from '../../data';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  Edit, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  DollarSign,
  Clock,
  Users,
  Tag,
  Sliders,
  Archive
} from 'lucide-react';

interface AdminCatalogueTabProps {
  services?: CleaningService[];
  onRefresh?: () => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

const CATEGORY_OPTIONS = [
  { id: 'full-home-cleaning', name: 'Full Home / By Room Deep Cleaning' },
  { id: 'bathroom-cleaning', name: 'Bathroom Deep Cleaning' },
  { id: 'kitchen-cleaning', name: 'Kitchen Deep Cleaning' },
  { id: 'sofa-carpet-living', name: 'Sofa, Carpet & Living/Bedroom Furniture' },
  { id: 'balcony-floor-scrubbing', name: 'Balcony & Floor Scrubbing' },
  { id: 'commercial-cleaning', name: 'Office & Commercial Deep Cleaning' },
  { id: 'water-tank-cleaning', name: 'Water Tank Sanitization' },
  { id: 'mini-services', name: 'Mini Services & Add-ons' }
];

export const AdminCatalogueTab: React.FC<AdminCatalogueTabProps> = ({ 
  services: propServices, 
  onRefresh,
  onAuditLog
}) => {
  const [services, setServices] = useState<CleaningService[]>(() => {
    return propServices && propServices.length > 0 ? propServices : INITIAL_SERVICES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  // Modals & State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewingService, setViewingService] = useState<CleaningService | null>(null);
  const [editingService, setEditingService] = useState<CleaningService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    sku: string;
    categoryId: string;
    categoryName: string;
    subCategory: string;
    basePrice: number;
    referencePrice: number;
    discountPct: number;
    couponTag: string;
    couponEligible: boolean;
    gstPercent: number;
    estimatedMinutes: number;
    requiredPartners: number;
    displayOrder: number;
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
    slug: '',
    sku: '',
    categoryId: 'bathroom-cleaning',
    categoryName: 'Bathroom Deep Cleaning',
    subCategory: 'Standard',
    basePrice: 999,
    referencePrice: 1499,
    discountPct: 33,
    couponTag: 'FLAT50',
    couponEligible: true,
    gstPercent: 5,
    estimatedMinutes: 60,
    requiredPartners: 1,
    displayOrder: 1,
    imageUrl: '',
    bannerUrl: '',
    videoUrl: '',
    shortDesc: '',
    detailedDesc: '',
    scopeOfWork: 'Floor scrubbing, tile descaling, stain removal, mirror buffing',
    equipmentRequired: 'Single disc machine, Industrial vacuum, eco chemicals',
    active: true,
  });

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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auto-generate slug from name
  const handleNameChange = (nameVal: string) => {
    const slug = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({
      ...prev,
      name: nameVal,
      slug: prev.slug === '' || prev.slug.includes(slug.slice(0, 5)) ? slug : prev.slug
    }));
  };

  // Image Upload with Client-Side Compression & Validation (Max 5MB)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      return;
    }

    // Validate File Size (Max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('File size exceeds 5MB limit. Please upload an image under 5MB.');
      return;
    }

    setUploadProgress(15);

    // Read and compress using Canvas
    const reader = new FileReader();
    reader.onprogress = (pe) => {
      if (pe.lengthComputable) {
        setUploadProgress(Math.round((pe.loaded / pe.total) * 60));
      }
    };

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        setUploadProgress(80);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          setFormData(prev => ({
            ...prev,
            imageUrl: dataUrl,
            bannerUrl: prev.bannerUrl || dataUrl
          }));
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 800);
          showToast('Image uploaded and optimized successfully.');
        } else {
          setUploadError('Failed to process image canvas.');
          setUploadProgress(null);
        }
      };
      img.onerror = () => {
        setUploadError('Failed to load image file.');
        setUploadProgress(null);
      };
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      setUploadError('Error reading file from disk.');
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open modal for add or edit
  const handleOpenModal = (service?: CleaningService) => {
    setUploadError(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (service) {
      setEditingService(service);
      const discount = service.referencePrice && service.referencePrice > service.basePrice
        ? Math.round(((service.referencePrice - service.basePrice) / service.referencePrice) * 100)
        : (service.discountPct || 15);

      setFormData({
        name: service.name,
        slug: (service as any).slug || service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        sku: service.sku || `BPE-${service.id.slice(-6).toUpperCase()}`,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        subCategory: service.subCategory || service.categoryName,
        basePrice: service.basePrice,
        referencePrice: service.referencePrice || Math.round(service.basePrice / 0.85),
        discountPct: discount,
        couponTag: (service as any).couponTag || 'FLAT50',
        couponEligible: (service as any).couponEligible !== false,
        gstPercent: service.gstPercent ?? 5,
        estimatedMinutes: service.estimatedMinutes || 60,
        requiredPartners: service.requiredPartners ?? 1,
        displayOrder: (service as any).displayOrder || 1,
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
        slug: '',
        sku: `BPE-SRV-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: 'full-home-cleaning',
        categoryName: 'Full Home / By Room Deep Cleaning',
        subCategory: 'Deep Clean',
        basePrice: 1499,
        referencePrice: 1999,
        discountPct: 25,
        couponTag: 'FLAT50',
        couponEligible: true,
        gstPercent: 5,
        estimatedMinutes: 90,
        requiredPartners: 2,
        displayOrder: services.length + 1,
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
    if (!formData.name.trim()) {
      showToast('Service name is required', 'error');
      return;
    }
    if (!formData.imageUrl.trim()) {
      showToast('Please upload or provide a service image', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const scopeList = formData.scopeOfWork.split(',').map((s) => s.trim()).filter(Boolean);
      const equipList = formData.equipmentRequired.split(',').map((s) => s.trim()).filter(Boolean);

      const calculatedDiscount = formData.referencePrice > formData.basePrice
        ? Math.round(((formData.referencePrice - formData.basePrice) / formData.referencePrice) * 100)
        : Number(formData.discountPct) || 15;

      if (editingService) {
        const updatedFields: Partial<CleaningService> = {
          name: formData.name.trim(),
          ...( { slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } as any),
          sku: formData.sku.trim(),
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          subCategory: formData.subCategory.trim(),
          basePrice: Number(formData.basePrice),
          referencePrice: Number(formData.referencePrice),
          competitorPrice: Number(formData.referencePrice),
          discountPct: calculatedDiscount,
          gstPercent: Number(formData.gstPercent),
          estimatedMinutes: Number(formData.estimatedMinutes),
          requiredPartners: Number(formData.requiredPartners),
          imageUrl: formData.imageUrl,
          bannerUrl: formData.bannerUrl || formData.imageUrl,
          videoUrl: formData.videoUrl,
          shortDesc: formData.shortDesc.trim(),
          detailedDesc: formData.detailedDesc.trim(),
          scopeOfWork: scopeList,
          equipmentRequired: equipList,
          inclusions: scopeList.length > 0 ? scopeList : (editingService.inclusions || []),
          active: formData.active,
          ...( { 
            couponTag: formData.couponTag,
            couponEligible: formData.couponEligible,
            displayOrder: Number(formData.displayOrder) || 1,
            updatedAt: new Date().toISOString()
          } as any)
        };

        await updateServicePricing(editingService.id, updatedFields);

        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...updatedFields } : s))
        );
        onAuditLog?.('CATALOGUE_SERVICE_UPDATED', editingService.id, `Admin updated service ${formData.name}`);
        showToast(`Service "${formData.name}" successfully updated.`);
      } else {
        const newId = `srv-${Date.now()}`;
        const newService: CleaningService = {
          id: newId,
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          subCategory: formData.subCategory.trim(),
          basePrice: Number(formData.basePrice),
          referencePrice: Number(formData.referencePrice),
          competitorPrice: Number(formData.referencePrice),
          discountPct: calculatedDiscount,
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
          bannerUrl: formData.bannerUrl || formData.imageUrl,
          videoUrl: formData.videoUrl,
          shortDesc: formData.shortDesc.trim(),
          detailedDesc: formData.detailedDesc.trim(),
          scopeOfWork: scopeList,
          equipmentRequired: equipList,
          ...( { 
            slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            couponTag: formData.couponTag,
            couponEligible: formData.couponEligible,
            displayOrder: Number(formData.displayOrder) || (services.length + 1),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any)
        };

        await addNewService(newService);
        setServices((prev) => [newService, ...prev]);
        onAuditLog?.('CATALOGUE_SERVICE_CREATED', newId, `Admin created service ${formData.name}`);
        showToast(`New service "${formData.name}" published to live catalogue.`);
      }

      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving catalogue item:', err);
      showToast('Error saving service. Please check connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the live catalogue? Historical bookings will retain their original snapshots.`)) {
      try {
        await deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
        onAuditLog?.('CATALOGUE_SERVICE_DELETED', id, `Admin removed service ${name}`);
        showToast(`Service "${name}" removed from catalogue.`);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Failed to delete service:', err);
        showToast('Failed to delete service.', 'error');
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
      onAuditLog?.('CATALOGUE_STATUS_TOGGLED', service.id, `Status set to ${nextStatus ? 'ACTIVE' : 'DISABLED'}`);
      showToast(`Service marked as ${nextStatus ? 'ACTIVE & BOOKABLE' : 'DISABLED'}.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Filtered Services
  const filteredServices = services.filter((srv) => {
    const matchesCategory = selectedCategory === 'ALL' || 
      srv.categoryName === selectedCategory || 
      srv.categoryId === selectedCategory;

    const matchesStatus = selectedStatus === 'ALL' || 
      (selectedStatus === 'ACTIVE' && srv.active !== false) || 
      (selectedStatus === 'DISABLED' && srv.active === false);

    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.sku && srv.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.shortDesc && srv.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMinPrice = minPrice === '' || srv.basePrice >= Number(minPrice);
    const matchesMaxPrice = maxPrice === '' || srv.basePrice <= Number(maxPrice);

    return matchesCategory && matchesStatus && matchesSearch && matchesMinPrice && matchesMaxPrice;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl border font-bold text-xs flex items-center gap-2 transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-rose-600 text-white border-rose-500'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 04 &bull; Master Service Catalogue
            </span>
            <span className="text-xs text-[#8E8E93]">Single Source of Truth &bull; Real Device Media Uploads</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Master Service Catalogue &amp; Live Offerings
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Live synchronized repository of cleaning services, pricing rules, media files, and active booking availability. Edits reflect immediately across customer web, mobile app, and admin dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            Total Services: <strong>{services.length}</strong>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4A24E]" />
            <span>+ Add New Service</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Controls Bar */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Title, SKU, or Keyword..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#D4A24E]"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#D4A24E]"
            >
              <option value="ALL">All Categories</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-[#D4A24E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active &amp; Bookable Only</option>
              <option value="DISABLED">Disabled Only</option>
            </select>
          </div>
        </div>

        {/* Price Range Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8E8E93] font-bold">Price Range (₹):</span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
              className="w-24 px-2.5 py-1.5 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E]"
            />
            <span className="text-[#8E8E93]">-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
              className="w-24 px-2.5 py-1.5 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#1C1C1E]"
            />
            {(minPrice !== '' || maxPrice !== '' || searchQuery !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setCurrentPage(1);
                }}
                className="text-[11px] text-[#D4A24E] hover:underline font-bold ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-[11px] text-[#8E8E93]">
            Showing <strong>{filteredServices.length}</strong> matching services (Page {currentPage} of {totalPages})
          </div>
        </div>
      </div>

      {/* Services Grid or Empty State */}
      {paginatedServices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5EA] shadow-xs space-y-3">
          <Layers className="w-12 h-12 text-[#8E8E93] mx-auto opacity-40" />
          <h4 className="text-base font-bold text-[#1C1C1E]">No Services Found</h4>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
            No catalogue services matched your current search and filter criteria. Try adjusting your query or create a new service.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#1C1C1E] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4A24E]" />
            <span>Add Service to Catalogue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedServices.map((service) => {
            const isActive = service.active !== false;
            const savings = service.referencePrice && service.referencePrice > service.basePrice
              ? service.referencePrice - service.basePrice
              : 0;

            return (
              <div
                key={service.id}
                className={`rounded-3xl bg-white border ${
                  isActive ? 'border-[#E5E5EA]' : 'border-rose-200 bg-rose-50/20'
                } shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group`}
              >
                <div>
                  {/* Service Image Card Header */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[11px] font-bold">No Image Uploaded</span>
                      </div>
                    )}

                    {/* Category Pill Tag */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[#D4A24E] text-[10px] font-bold tracking-wide border border-white/10">
                      {service.categoryName || service.categoryId}
                    </span>

                    {/* Status Badge */}
                    <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {isActive ? 'ACTIVE & BOOKABLE' : 'DISABLED'}
                    </span>

                    {savings > 0 && (
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-[#D4A24E] text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        Save ₹{savings} ({service.discountPct || 15}% Off)
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1C1E] leading-snug line-clamp-1">
                        {service.name}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] font-mono mt-0.5">
                        SKU: {service.sku || `BPE-${service.id.slice(-6).toUpperCase()}`}
                        {service.subCategory && ` &bull; ${service.subCategory}`}
                      </p>
                    </div>

                    <p className="text-xs text-[#48484A] line-clamp-2 leading-relaxed">
                      {service.shortDesc || service.detailedDesc || 'Professional deep cleaning with certified technicians.'}
                    </p>

                    {/* Pricing Breakdown */}
                    <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Bharat Pro Price</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-900">₹{service.basePrice}</span>
                          {service.referencePrice > service.basePrice && (
                            <span className="text-xs text-[#8E8E93] line-through font-medium">₹{service.referencePrice}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#8E8E93]">
                        + {service.gstPercent ?? 5}% GST
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{service.estimatedMinutes || 60} mins</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-600" />
                        <span>{service.requiredPartners || 1} Pro(s)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{(service as any).couponTag || 'COUPON'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-[#E5E5EA] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(service)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingService(service)}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                      title="View full details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(service)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit className="w-3 h-3 text-[#D4A24E]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id, service.name)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                      title="Delete service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === num
                    ? 'bg-[#1C1C1E] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT CATALOGUE MODAL WITH REAL DEVICE MEDIA UPLOAD */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4A24E] font-bold">
                  {editingService ? 'EDIT CATALOGUE SERVICE' : 'NEW CATALOGUE SERVICE'}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {editingService ? `Edit: ${editingService.name}` : 'Add New Cleaning Service'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single source of truth. Updates live website, mobile view, and booking engine instantly.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* SECTION 1: REAL MEDIA UPLOAD FROM DEVICE */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-900 block">
                      Service Media &amp; Photographs *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Upload from phone or computer. Valid formats: JPEG, PNG, WebP (Max 5MB).
                    </span>
                  </div>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-36 h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block font-bold">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Trigger & Progress */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileSelect}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D4A24E]" />
                        <span>{formData.imageUrl ? 'Replace Image' : 'Select from Device'}</span>
                      </button>

                      <input
                        type="text"
                        placeholder="Or paste direct image URL (https://...)"
                        value={formData.imageUrl.startsWith('data:') ? 'Image uploaded from device (Stored)' : formData.imageUrl}
                        onChange={(e) => {
                          if (!e.target.value.startsWith('Image uploaded')) {
                            setFormData({ ...formData, imageUrl: e.target.value });
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900"
                      />
                    </div>

                    {uploadProgress !== null && (
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#D4A24E] h-full rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{uploadError}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: BASIC DETAILS & SLUG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#D4A24E]"
                    placeholder="e.g. 3-Seater Fabric Sofa Deep Cleaning"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug (SEO &amp; Routing) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    placeholder="e.g. 3-seater-fabric-sofa-deep-cleaning"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const catObj = CATEGORY_OPTIONS.find(c => c.id === id);
                      setFormData({ 
                        ...formData, 
                        categoryId: id, 
                        categoryName: catObj?.name || 'Cleaning' 
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#D4A24E]"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory / Variant</label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    placeholder="e.g. Fabric Sofa / L-Shape / Furnished"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order Position</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                  />
                </div>
              </div>

              {/* SECTION 3: PRICING, DISCOUNT & COUPONS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Customer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Strike Price (₹)</label>
                  <input
                    type="number"
                    value={formData.referencePrice}
                    onChange={(e) => setFormData({ ...formData, referencePrice: Number(e.target.value) })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Coupon Tag / Code</label>
                  <input
                    type="text"
                    value={formData.couponTag}
                    onChange={(e) => setFormData({ ...formData, couponTag: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. FLAT50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SECTION 4: DESCRIPTIONS & SCOPE */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Description (Card Highlight) *</label>
                  <input
                    type="text"
                    required
                    value={formData.shortDesc}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    placeholder="1-2 sentences highlighting service benefits"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    value={formData.detailedDesc}
                    onChange={(e) => setFormData({ ...formData, detailedDesc: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    placeholder="Complete specifications and process notes"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Scope of Work (Comma separated)</label>
                    <input
                      type="text"
                      value={formData.scopeOfWork}
                      onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Required (Comma separated)</label>
                    <input
                      type="text"
                      value={formData.equipmentRequired}
                      onChange={(e) => setFormData({ ...formData, equipmentRequired: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#D4A24E]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: STATUS TOGGLES */}
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D4A24E]"
                  />
                  <span>Active &amp; Bookable on Customer Website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.couponEligible}
                    onChange={(e) => setFormData({ ...formData, couponEligible: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D4A24E]"
                  />
                  <span>Eligible for Promotional Coupons</span>
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-[#D4A24E]" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save & Publish Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SERVICE MODAL */}
      {viewingService && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-black text-base text-slate-900">{viewingService.name}</h4>
              <button 
                onClick={() => setViewingService(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold"
              >
                &times;
              </button>
            </div>

            <div className="h-44 rounded-2xl overflow-hidden bg-slate-100">
              <img src={viewingService.imageUrl} alt={viewingService.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">{viewingService.shortDesc || viewingService.detailedDesc}</p>
              <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selling Price:</span>
                  <strong className="text-slate-900">₹{viewingService.basePrice}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Market Benchmark:</span>
                  <span className="text-slate-500 line-through">₹{viewingService.referencePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-[#D4A24E]">{viewingService.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SKU:</span>
                  <span className="font-mono">{viewingService.sku}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingService(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
