import React from 'react';
import ServiceDetailSkeleton from './ServiceDetailSkeleton';

/**
 * Service Detail Page Component
 * Renders shimmering skeleton while isLoading is true, and real service info when loaded
 */
export function ServiceDetailPage({ isLoading = false, service, onAddToCart }) {
  if (isLoading || !service) {
    return <ServiceDetailSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-4">
      <div className="h-60 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-6 text-white shadow-md">
        {service.image || service.photo || service.imageUrl ? (
          <img src={service.image || service.photo || service.imageUrl} alt={service.name} className="h-full object-contain rounded-xl" />
        ) : (
          <span className="text-7xl">{service.emoji || '✨'}</span>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{service.name}</h1>
        <div className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-3">
          <span>★ {service.rating || 5.0} ({service.reviews || 0} reviews)</span>
          <span>•</span>
          <span>{service.duration || 30} min</span>
        </div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{service.price}</div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-2 shadow-sm">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Description</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          {service.desc || 'Professional doorstep service by verified experts.'}
        </p>
      </div>

      {service.includes && service.includes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">What's Included</h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {service.includes.map((inc, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span> {inc}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg flex justify-between items-center z-20">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Price</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white">₹{service.price}</div>
        </div>
        <button
          type="button"
          onClick={() => onAddToCart && onAddToCart(service)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ServiceDetailPage;
