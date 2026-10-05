import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface OurCleaningServicesSectionProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAll: () => void;
}

export const OurCleaningServicesSection: React.FC<OurCleaningServicesSectionProps> = ({
  onSelectCategory,
  onViewAll
}) => {
  const cards = [
    {
      id: 'full-home-cleaning',
      title: 'Full House Cleaning',
      fromPrice: 2499,
      image: '/assets/images/full_home_deep_cleaning_1790693627652.jpg'
    },
    {
      id: 'kitchen-cleaning',
      title: 'Kitchen Cleaning',
      fromPrice: 1499,
      image: '/assets/images/kitchen_deep_cleaning_1790693647667.jpg'
    },
    {
      id: 'bathroom-cleaning',
      title: 'Bathroom Cleaning',
      fromPrice: 1499,
      image: '/assets/images/bathroom_deep_cleaning_1790693663269.jpg'
    },
    {
      id: 'sofa-shampooing',
      title: 'Sofa & Carpet Cleaning',
      fromPrice: 1499,
      image: '/assets/images/sofa_deep_cleaning_1790693680475.jpg'
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#F8F9FB] font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#08213F] tracking-tight">
              Our Cleaning Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Professional Cleaning for Every Corner of Your Home
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#08213F] hover:text-blue-700 transition-colors cursor-pointer group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 4 Large Featured Cards Grid matching reference image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(8,33,63,0.04)] hover:shadow-[0_12px_32px_rgba(8,33,63,0.1)] transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => onSelectCategory(c.id)}
            >
              {/* Card Image */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                <img
                  src={c.image}
                  alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Title + Chevron Arrow */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#08213F] group-hover:text-blue-700 transition-colors">
                    {c.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors group-hover:translate-x-0.5" />
                </div>

                {/* Bottom Row: Price + Green Book Now Pill */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    From ₹{c.fromPrice.toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory(c.id);
                    }}
                    className="px-4 py-2 rounded-full bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
