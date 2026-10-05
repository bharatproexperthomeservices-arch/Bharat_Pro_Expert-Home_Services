import React from 'react';
import { X, Clock, Plus, Minus, Star, Check } from 'lucide-react';
import { CatalogCategory, CatalogItem } from '../../data/masterCatalogData';
import { CartItem } from './ServiceCatalogGrid';

interface CategoryDetailModalProps {
  category: CatalogCategory | null;
  onClose: () => void;
  onAddItem: (item: CatalogItem) => void;
  onRemoveItem: (itemId: string) => void;
  cart: CartItem[];
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  category,
  onClose,
  onAddItem,
  onRemoveItem,
  cart
}) => {
  if (!category) return null;

  const getItemQty = (itemId: string) => {
    const found = cart.find(c => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150 font-['Inter',sans-serif]">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0B2A4A]">
              {category.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {category.items.length} Packages Available &bull; Hospital-grade Diversey &amp; Kärcher
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid of Items */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((service) => {
              const qty = getItemQty(service.id);
              return (
                <div 
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{service.duration}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#0B2A4A] leading-snug">
                        {service.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        {service.originalPrice > service.offerPrice && (
                          <span className="text-xs text-slate-400 line-through block font-medium">
                            ₹{service.originalPrice}
                          </span>
                        )}
                        <span className="text-base font-black text-[#0B2A4A]">
                          ₹{service.offerPrice}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          Offer price
                        </span>
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => onAddItem(service)}
                          className="px-4 py-1.5 rounded-full bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>ADD</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-full p-0.5">
                          <button
                            onClick={() => onRemoveItem(service.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-blue-700 hover:bg-blue-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-blue-900">
                            {qty}
                          </span>
                          <button
                            onClick={() => onAddItem(service)}
                            className="w-6 h-6 rounded flex items-center justify-center text-blue-700 hover:bg-blue-100 cursor-pointer"
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
      </div>
    </div>
  );
};
