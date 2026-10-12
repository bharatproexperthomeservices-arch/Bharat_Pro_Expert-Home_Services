import React from 'react';
import { ArrowRight, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES } from '../../data/masterCatalogData';

interface OurCleaningServicesSectionProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAll: () => void;
  onBookDirect?: (serviceId: string) => void;
}

export const OurCleaningServicesSection: React.FC<OurCleaningServicesSectionProps> = ({
  onSelectCategory,
  onViewAll,
  onBookDirect
}) => {
  const categoryPrice = (categoryId: string) =>
    MASTER_CATALOG_CATEGORIES.find((category) => category.id === categoryId)?.startingPrice ?? 0;

  // Use the catalog's category-specific interior photo so each service card stays aligned with its own category.
  const cards = [
    {
      id: 'complete-home-cleaning',
      title: 'Full House Cleaning',
      subtitle: 'Whole-home deep cleaning',
      fromPrice: categoryPrice('complete-home-cleaning'),
      image: MASTER_CATALOG_CATEGORIES.find(category => category.id === 'complete-home-cleaning')?.heroImage || '',
      duration: 'Varies by home size',
      badge: 'Whole home',
      features: ['Rooms and surfaces', 'Kitchen and bathroom options', 'Choose a suitable package']
    },
    {
      id: 'kitchen-cleaning',
      title: 'Kitchen Cleaning',
      subtitle: 'Detailed kitchen surface care',
      fromPrice: categoryPrice('kitchen-cleaning'),
      image: MASTER_CATALOG_CATEGORIES.find(category => category.id === 'kitchen-cleaning')?.heroImage || '',
      duration: 'Varies by package',
      badge: 'Kitchen care',
      features: ['Counter and surface cleaning', 'Sink and fixture care', 'Select add-ons when booking']
    },
    {
      id: 'bathroom-cleaning',
      title: 'Bathroom Cleaning',
      subtitle: 'Tiles, fittings and surfaces',
      fromPrice: categoryPrice('bathroom-cleaning'),
      image: MASTER_CATALOG_CATEGORIES.find(category => category.id === 'bathroom-cleaning')?.heroImage || '',
      duration: 'Varies by package',
      badge: 'Bathroom care',
      features: ['Tile and grout attention', 'Sink and fitting care', 'Choose the required service']
    },
    {
      id: 'sofa-cleaning',
      title: 'Sofa & Upholstery',
      subtitle: 'Fabric and seating care',
      fromPrice: categoryPrice('sofa-cleaning'),
      image: MASTER_CATALOG_CATEGORIES.find(category => category.id === 'sofa-cleaning')?.heroImage || '',
      duration: 'Varies by seating',
      badge: 'Upholstery',
      features: ['Sofa surface vacuuming', 'Select seating options', 'Fabric suitability may vary']
    }
  ];

  return (
    <section
      id="our-cleaning-services"
      className="pt-8 pb-14 sm:pt-10 sm:pb-16 bg-gradient-to-b from-[#F8F9FB] to-white font-['Inter',sans-serif] relative overflow-hidden scroll-mt-20"
    >
      <div id="services" className="absolute -top-20" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-100 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#08213F] text-[11px] font-black uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            Cleaning services
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#08213F] tracking-tight">
            Professional Home Cleaning
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Explore the service, check the package details and review the price before you book.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Service details before checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Choose a package that fits</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
          {cards.map((card) => (
            <article
              key={card.id}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(8,33,63,0.06)] hover:shadow-[0_16px_38px_rgba(8,33,63,0.12)] transition-all duration-300 overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => onSelectCategory(card.id)}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset"
                aria-label={`Explore ${card.title}`}
              >
                <div className="relative h-44 sm:h-40 lg:h-36 overflow-hidden bg-slate-100">
                  <img
                    src={card.image}
                    alt={`${card.title} service being carried out`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" aria-hidden="true" />
                  <div className="absolute top-3 left-3 bg-white/95 text-[#08213F] text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">
                    {card.badge}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white gap-2">
                    <span className="text-[11px] font-semibold bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {card.duration}
                    </span>
                    <span className="text-[11px] font-semibold bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      View service
                    </span>
                  </div>
                </div>
              </button>

              <div className="p-5 sm:p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-lg font-black text-[#08213F] group-hover:text-blue-700 transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">{card.subtitle}</p>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[11px] text-slate-500 font-semibold mb-1">Starting price</p>
                  <p className="text-2xl font-black text-[#08213F] leading-none">
                    {card.fromPrice > 0 ? `₹${card.fromPrice.toLocaleString('en-IN')}` : 'See packages'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 mb-3">Final price depends on selected service and package.</p>
                  <button
                    type="button"
                    onClick={() => onBookDirect ? onBookDirect(card.id) : onSelectCategory(card.id)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00A86B] to-[#008f5b] hover:from-[#008f5b] hover:to-[#006b44] text-white text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  >
                    <span>Book this service</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#08213F] hover:bg-[#0c2c52] text-white text-sm sm:text-base font-bold transition-all shadow-lg hover:shadow-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>View all services</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default OurCleaningServicesSection;
