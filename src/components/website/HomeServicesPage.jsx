import React from 'react';
import HomeServicesSkeleton from './HomeServicesSkeleton';
import SkeletonWrapper from '../Skeleton';

/**
 * Customer Home / Services Page Component
 * Accepts isLoading state and renders shimmering skeleton grid during fetch
 */
export function HomeServicesPage({ isLoading = false, categories = [], services = [], onSelectCategory, onSelectService, onAddToCart }) {
  if (isLoading) {
    return <HomeServicesSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Categories Row */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Categories</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(cat.id)}
              className="flex flex-col items-center group cursor-pointer text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-sm">
                {cat.emoji || '✨'}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Popular Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectService && onSelectService(s.id)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                {s.image || s.photo || s.imageUrl ? (
                  <img src={s.image || s.photo || s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{s.emoji || '✨'}</span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">{s.name}</h3>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>★ {s.rating || 5.0}</span>
                <span>•</span>
                <span>{s.duration || 30} min</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{s.price}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart && onAddToCart(s);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomeServicesPage;
