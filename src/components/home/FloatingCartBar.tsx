import React from 'react';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { CartItem } from './ServiceCatalogGrid';

interface FloatingCartBarProps {
  cart: CartItem[];
  onProceedToCheckout: () => void;
  onClearCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  cart,
  onProceedToCheckout,
  onClearCart
}) => {
  const totalCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.item.offerPrice * c.quantity, 0);

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto font-['Inter',sans-serif] animate-in slide-in-from-bottom-6 duration-200">
      <div className="bg-[#08213F] text-white rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_40px_rgba(8,33,63,0.35)] border border-slate-700/60 flex items-center justify-between gap-4 backdrop-blur-md">
        
        {/* Left: Summary */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 relative shrink-0">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#00A86B] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {totalCount}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                10-20% Saved
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate max-w-[200px] sm:max-w-xs">
              {cart.map(c => `${c.item.name} (${c.quantity})`).join(', ')}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearCart}
            className="text-[11px] text-slate-400 hover:text-white underline px-2 py-1 transition-colors cursor-pointer hidden sm:block"
          >
            Clear
          </button>

          <button
            onClick={onProceedToCheckout}
            className="px-6 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Proceed to Book</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
};
