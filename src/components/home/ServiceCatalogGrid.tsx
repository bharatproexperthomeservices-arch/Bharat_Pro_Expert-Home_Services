import React from 'react';
import { Clock, Plus, Minus, ArrowRight, Star } from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES, CatalogCategory, CatalogItem } from '../../data/masterCatalogData';

export interface CartItem {
  item: CatalogItem;
  quantity: number;
}

interface ServiceCatalogGridProps {
  onAddItem: (item: CatalogItem) => void;
  onRemoveItem: (itemId: string) => void;
  cart: CartItem[];
  onOpenCategoryModal?: (category: CatalogCategory) => void;
  onItemClick?: (item: CatalogItem) => void;
}

export const ServiceCatalogGrid: React.FC<ServiceCatalogGridProps> = ({
  onAddItem,
  onRemoveItem,
  cart,
  onOpenCategoryModal,
  onItemClick
}) => {
  const getItemQty = (itemId: string) => {
    const found = cart.find(c => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div id="service-catalogue-sections" className="py-12 bg-white space-y-16 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {MASTER_CATALOG_CATEGORIES.map((category) => (
          <div key={category.id} id={category.id} className="scroll-mt-24 space-y-6">
            
            {/* Category Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#08213F] tracking-tight">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {category.subtitle}
                </p>
              </div>

              {category.items.length > 5 && (
                <button
                  onClick={() => onOpenCategoryModal?.(category)}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#08213F] hover:text-blue-700 transition-colors cursor-pointer group shrink-0"
                >
                  <span>See all</span>
                  <span className="text-[11px] text-slate-400">({category.items.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>

            {/* 5-Column Responsive Card Grid matching new design system */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
              {category.items.slice(0, 10).map((service) => {
                const qty = getItemQty(service.id);
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(8,33,63,0.04)] hover:shadow-[0_8px_24px_rgba(8,33,63,0.08)] hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top: Service Image with Duration Badge */}
                    <div 
                      className="relative h-36 sm:h-40 overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => onItemClick?.(service)}
                    >
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Duration Badge over Image */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{service.duration}</span>
                      </div>

                      {/* Rating pill */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 flex items-center gap-0.5 shadow-2xs">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>{service.rating}</span>
                      </div>
                    </div>

                    {/* Middle: Exact Service Name & Description */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div 
                        className="space-y-1 cursor-pointer"
                        onClick={() => onItemClick?.(service)}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-[#08213F] group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                          {service.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      {/* Bottom: Pricing & Green ADD Button matching new design */}
                      <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-1">
                        <div>
                          {service.originalPrice > service.offerPrice && (
                            <span className="text-[11px] text-slate-400 line-through block font-medium">
                              ₹{service.originalPrice}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-sm sm:text-base font-black text-[#08213F]">
                              ₹{service.offerPrice}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 block">
                            Offer price
                          </span>
                        </div>

                        {/* Working ADD Button matching new green button language */}
                        {qty === 0 ? (
                          <button
                            onClick={() => onAddItem(service)}
                            className="px-3.5 py-1.5 rounded-full bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 shrink-0"
                            title={`Add ${service.name} to booking`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-full px-1.5 py-0.5 shadow-2xs shrink-0">
                            <button
                              onClick={() => onRemoveItem(service.id)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-emerald-950">
                              {qty}
                            </span>
                            <button
                              onClick={() => onAddItem(service)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};
