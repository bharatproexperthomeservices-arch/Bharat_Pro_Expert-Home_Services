import React, { useState } from 'react';
import { CleaningService } from '../types';
import { Star, Clock, Video, CheckCircle2, ShieldAlert, ArrowRight, X, Sparkles, AlertCircle, Eye } from 'lucide-react';

interface ServiceDetailModalProps {
  service: CleaningService | null;
  onClose: () => void;
  onBookNow: (service: CleaningService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookNow
}) => {
  const [photoViewMode, setPhotoViewMode] = useState<'both' | 'before' | 'after'>('both');

  if (!service) return null;

  const hasDistinctBeforeAfter = Boolean(service.beforeImage && service.afterImage);
  const beforePhoto = service.beforeImage || service.imageUrl;
  const afterPhoto = service.afterImage || service.beforeAfterImage || service.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div 
        id="service-detail-modal-card"
        className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-white/50 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Visual Banner */}
        <div className="relative h-56 sm:h-72 w-full shrink-0 overflow-hidden bg-black">
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C1E]/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
            <Video className="w-3.5 h-3.5 text-[#E07B1A]" />
            <span>{service.demoVideoBadge}</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-xs uppercase tracking-wider font-bold text-[#D4A24E]">
              {service.categoryName}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] leading-tight mt-1">
              {service.name}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-white/90">
              <span className="flex items-center gap-1 font-bold text-[#F9D976]">
                <Star className="w-4 h-4 fill-[#F9D976] text-[#F9D976]" />
                {service.rating} ({service.reviewCount} verified reviews)
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-white/70" />
                ~{service.estimatedMinutes} mins duration
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Pricing Highlight */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA]">
            <div>
              <span className="text-xs text-[#8E8E93] font-medium block">Bharat Pro Direct Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#1C1C1E]">
                  ₹{service.basePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm line-through text-[#8E8E93]">
                  ₹{service.competitorPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-[#1F8A3B] bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save 15% vs Market
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onBookNow(service);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Book This Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1C1C1E] mb-2">
              Service Overview
            </h3>
            <p className="text-sm text-[#48484A] leading-relaxed">
              {service.detailedDesc}
            </p>
          </div>

          {/* Real Before & After Proof Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1C1C1E]">
                  Real Verified Before &amp; After Results
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Actual camera evidence from verified Bharat Pro expert cleaning jobs
                </p>
              </div>

              {hasDistinctBeforeAfter && (
                <div className="flex items-center gap-1 bg-[#F2F2F7] p-1 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('both')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      photoViewMode === 'both'
                        ? 'bg-white shadow-sm text-[#1C1C1E] font-bold'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('before')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      photoViewMode === 'before'
                        ? 'bg-red-500 text-white font-bold'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                    }`}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('after')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      photoViewMode === 'after'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                    }`}
                  >
                    After Clean
                  </button>
                </div>
              )}
            </div>

            {hasDistinctBeforeAfter ? (
              photoViewMode === 'both' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Before Box */}
                  <div className="relative rounded-2xl overflow-hidden border border-red-200 bg-red-50/20 group">
                    <img
                      src={beforePhoto}
                      alt={`${service.name} before cleaning`}
                      className="w-full h-44 sm:h-52 object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>BEFORE: Uncleaned / Grease &amp; Grime</span>
                    </div>
                  </div>

                  {/* After Box */}
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50/20 group">
                    <img
                      src={afterPhoto}
                      alt={`${service.name} after cleaning`}
                      className="w-full h-44 sm:h-52 object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>AFTER: Bharat Pro Deep Cleaned</span>
                    </div>
                  </div>
                </div>
              ) : photoViewMode === 'before' ? (
                <div className="relative rounded-2xl overflow-hidden border border-red-200 bg-red-50/20">
                  <img
                    src={beforePhoto}
                    alt={`${service.name} before cleaning`}
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    BEFORE CLEANING: Stains, Sticky Oil &amp; Dust Accumulation
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50/20">
                  <img
                    src={afterPhoto}
                    alt={`${service.name} after cleaning`}
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AFTER CLEANING: Restored &amp; Food-Safe Sanitized</span>
                  </div>
                </div>
              )
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-black/10 bg-black/5">
                <img
                  src={service.beforeAfterImage || service.imageUrl}
                  alt="Before After cleaning result"
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white">
                  100% Real Camera Evidence from Certified Bharat Pro Hubs
                </div>
              </div>
            )}
          </div>

          {/* Accurate Step-by-Step Sequence */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1C1C1E] mb-3">
              Standard Operating Procedure (SOP Steps)
            </h3>
            <div className="space-y-3">
              {service.steps.map((step) => (
                <div 
                  key={step.order}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#B8892E] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#1C1C1E]">
                        {step.title}
                      </h4>
                      <span className="text-[11px] text-[#8E8E93] font-mono">
                        {step.estimatedMinutes} min
                      </span>
                    </div>
                    <p className="text-xs text-[#636366] mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F8A3B] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> What&apos;s Included
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-900">
                {service.inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#1F8A3B] font-bold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" /> What&apos;s Not Included
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-900">
                {service.exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] text-[#8E8E93] uppercase font-bold tracking-wider block">Estimated Price</span>
            <span className="text-2xl font-black text-[#1C1C1E]">
              ₹{service.basePrice.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            id={`book-now-modal-btn-${service.id}`}
            onClick={() => {
              onClose();
              onBookNow(service);
            }}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-bold text-sm shadow-md hover:shadow-xl transition-all"
          >
            Confirm &amp; Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
