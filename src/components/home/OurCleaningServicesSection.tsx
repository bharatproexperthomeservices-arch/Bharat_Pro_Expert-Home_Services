import React from 'react';
import { ArrowRight, ChevronRight, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES } from '../../data/masterCatalogData';

interface OurCleaningServicesSectionProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAll: () => void;
  onBookDirect?: (serviceId: string) => void;
}

const SERVICE_CARDS = [
  { id: 'sofa-cleaning', title: 'Sofa Cleaning', subtitle: 'Fabric, cushions & upholstery', badge: 'Fabric care', duration: 'Package-based', features: ['Deep fabric vacuuming', 'Seat-wise packages', 'Care for everyday spills'] },
  { id: 'complete-home-cleaning', title: 'Home Cleaning', subtitle: 'Complete home refresh', badge: 'Whole home', duration: 'By home size', features: ['Rooms and common areas', 'Optional kitchen & bathroom', '1–5 BHK package options'] },
  { id: 'unfurnished-cleaning', title: 'Unfurnished Home', subtitle: 'Move-in ready cleaning', badge: 'Move-in', duration: 'Package-based', features: ['Floor and surface cleaning', 'Cabinet and ledge care', 'Ideal before shifting in'] },
  { id: 'furnished-cleaning', title: 'Furnished Home', subtitle: 'Detailed furnished spaces', badge: 'Home care', duration: 'By home size', features: ['Accessible furniture surfaces', 'Room-by-room cleaning', 'Choose add-ons at booking'] },
  { id: 'kitchen-cleaning', title: 'Kitchen Cleaning', subtitle: 'Grease, counters & fittings', badge: 'Kitchen care', duration: 'Package-based', features: ['Countertop and sink care', 'Degreasing of accessible surfaces', 'Classic and deep-clean options'] },
  { id: 'bathroom-cleaning', title: 'Bathroom Cleaning', subtitle: 'Tiles, fittings & glass', badge: 'Hygiene care', duration: 'Package-based', features: ['Tile and fixture cleaning', 'Glass and basin care', 'Select the required package'] },
  { id: 'carpet-cleaning', title: 'Carpet Cleaning', subtitle: 'Rugs and carpet fibres', badge: 'Floor care', duration: 'By carpet size', features: ['Carpet surface extraction', 'Multiple size options', 'Care based on fabric type'] },
  { id: 'mattress-cleaning', title: 'Mattress Cleaning', subtitle: 'A fresher sleeping space', badge: 'Sleep care', duration: 'By mattress size', features: ['Single and double sizes', 'Detailed vacuum treatment', 'Add service to your booking'] },
] as const;

export const OurCleaningServicesSection: React.FC<OurCleaningServicesSectionProps> = ({
  onSelectCategory,
  onViewAll,
  onBookDirect
}) => {
  const cards = SERVICE_CARDS.map((card) => {
    const category = MASTER_CATALOG_CATEGORIES.find((item) => item.id === card.id);
    return {
      ...card,
      image: category?.heroImage || category?.items?.find((item) => item.imageUrl)?.imageUrl || '',
      fromPrice: category?.startingPrice ?? 0,
      available: Boolean(category && category.active !== false),
    };
  });

  return (
    <section id="our-cleaning-services" className="relative scroll-mt-20 overflow-hidden bg-[#fffdf9] py-10 sm:py-14 lg:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f5e8cb] blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#f7eee0] blur-3xl" />
      </div>
      <div id="services" className="absolute -top-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ead8b5] bg-white px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8a6222] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Bharat Pro Expert · Home Services
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[#102849] sm:text-4xl lg:text-[2.65rem]">Our Cleaning Services</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Explore each service, compare packages and see the starting price before you book a trusted professional.</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#b88a3b]" /> Clear package details</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#b88a3b]" /> Book a convenient slot</span>
            </div>
          </div>
          <button type="button" onClick={onViewAll} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#d6b16b] bg-white px-5 py-3 text-sm font-bold text-[#7a571f] shadow-sm transition hover:bg-[#fff6e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89a43] sm:self-auto">
            View all services <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {cards.map((card, index) => (
            <article key={card.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-[#eee4d2] bg-white shadow-[0_5px_24px_rgba(31,41,55,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#d9bd83] hover:shadow-[0_18px_42px_rgba(31,41,55,0.12)]">
              <button type="button" onClick={() => onSelectCategory(card.id)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c89a43]" aria-label={`Explore ${card.title}`}>
                <div className="relative h-52 overflow-hidden bg-[#f4efe5] sm:h-48">
                  {card.image ? (
                    <img src={card.image} alt={`${card.title} professional cleaning service`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]" loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7efdf] to-[#e7d6b4] text-sm font-semibold text-[#7a571f]">Bharat Pro Expert · {card.title}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081b30]/75 via-[#081b30]/5 to-transparent" aria-hidden="true" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#78531d] shadow-sm">{card.badge}</span>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                    <span className="text-xs font-semibold text-white/90">{card.duration}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold">Explore <ChevronRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </button>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-extrabold leading-tight text-[#102849]">{card.title}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{card.subtitle}</p>
                </div>
                <ul className="mb-5 flex-1 space-y-2">
                  {card.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-600"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c49a4c]" /><span>{feature}</span></li>)}
                </ul>
                <div className="border-t border-[#f0e8db] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Starting price</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-[#102849]">{card.fromPrice > 0 ? `₹${card.fromPrice.toLocaleString('en-IN')}` : 'View packages'}</p>
                  <button type="button" onClick={() => onBookDirect ? onBookDirect(card.id) : onSelectCategory(card.id)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d7ad5c] to-[#b88732] px-4 py-3 text-sm font-extrabold text-white shadow-[0_5px_14px_rgba(184,135,50,0.22)] transition hover:from-[#c99a42] hover:to-[#9c6d21] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88732] focus-visible:ring-offset-2">
                    Book this service <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurCleaningServicesSection;
