import React from 'react';
import { ArrowRight, ChevronRight, Star, Clock, Shield, Users } from 'lucide-react';

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
  const cards = [
    {
      id: 'full-home-cleaning',
      title: 'Full House Cleaning',
      subtitle: '360° घर की पूरी सफाई',
      fromPrice: 2499,
      originalPrice: 3899,
      image: '/assets/images/full_home_deep_cleaning_1790693627652.jpg',
      rating: 4.9,
      reviews: 12450,
      duration: '4-6 घंटे',
      badge: 'सबसे लोकप्रिय',
      features: ['पूरा घर साफ', 'रसोई + बाथरूम', 'विशेषज्ञ टीम']
    },
    {
      id: 'kitchen-cleaning',
      title: 'Kitchen Cleaning',
      subtitle: 'रसोई की गहरी सफाई',
      fromPrice: 1499,
      originalPrice: 2299,
      image: '/assets/images/kitchen_deep_cleaning_1790693647667.jpg',
      rating: 4.8,
      reviews: 8920,
      duration: '2-3 घंटे',
      badge: 'ऑफर',
      features: ['चिमनी सफाई', 'ग्रीस हटाना', 'टाइल्स चमकाना']
    },
    {
      id: 'bathroom-cleaning',
      title: 'Bathroom Cleaning',
      subtitle: 'बाथरूम की पूरी सफाई',
      fromPrice: 1499,
      originalPrice: 2399,
      image: '/assets/images/bathroom_deep_cleaning_1790693663269.jpg',
      rating: 4.9,
      reviews: 15680,
      duration: '1-2 घंटे',
      badge: 'टॉप रेटेड',
      features: ['हार्ड वाटर स्केल', 'क्रोम चमक', 'कीटाणु मुक्त']
    },
    {
      id: 'sofa-shampooing',
      title: 'Sofa & Carpet Cleaning',
      subtitle: 'सोफे-कारपेट की गहरी धुलाई',
      fromPrice: 1499,
      originalPrice: 2499,
      image: '/assets/images/sofa_deep_cleaning_1790693680475.jpg',
      rating: 4.9,
      reviews: 9870,
      duration: '2-3 घंटे',
      badge: 'प्रीमियम',
      features: ['शैम्पू धुलाई', 'दाग हटाना', 'एंटी-एलर्जी']
    }
  ];

  return (
    <section 
      id="our-cleaning-services" 
      className="py-16 sm:py-20 bg-gradient-to-b from-[#F8F9FB] to-white font-['Inter',sans-serif] relative overflow-hidden scroll-mt-20"
    >
      <div id="services" className="absolute -top-20" />

      {/* पृष्ठभूमि अलंकरण */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-100 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-10 xl:px-16">

        {/* ============ शीर्षक भाग ============ */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-4 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-[#08213F] tracking-wide uppercase">
              हमारी सेवाएँ
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#08213F] tracking-tight leading-tight">
            Our Cleaning Services
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium mt-4 max-w-2xl mx-auto">
            आपके घर के हर कोने के लिए पेशेवर और भरोसेमंद सफाई सेवाएँ — विशेषज्ञों द्वारा, उचित मूल्य पर।
          </p>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs sm:text-sm text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-semibold">100% भरोसेमंद</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">50,000+ खुश ग्राहक</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="font-semibold">समय पर सेवा</span>
            </div>
          </div>
        </div>

        {/* ============ 4 बड़े कार्ड ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {cards.map((c) => (
            <div
              key={c.id}
              className="group bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(8,33,63,0.06)] hover:shadow-[0_20px_50px_rgba(8,33,63,0.15)] transition-all duration-500 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-2"
              onClick={() => {
                if (onBookDirect) {
                  onBookDirect(c.id);
                } else {
                  onSelectCategory(c.id);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onBookDirect) {
                  e.preventDefault();
                  onBookDirect(c.id);
                }
              }}
            >
              {/* चित्र भाग */}
              <div className="relative h-60 sm:h-64 lg:h-72 overflow-hidden bg-slate-100">
                <img
                  src={c.image}
                  alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />

                {/* ऊपर छाया */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                {/* बैज */}
                {c.badge && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
                    {c.badge}
                  </div>
                )}

                {/* रेटिंग बैज */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-[#08213F]">{c.rating}</span>
                </div>

                {/* नीचे की जानकारी */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {c.duration}
                  </div>
                  <div className="text-[11px] font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {c.reviews.toLocaleString('en-IN')}+ बुकिंग
                  </div>
                </div>
              </div>

              {/* कार्ड सामग्री */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col">

                {/* शीर्षक और उपशीर्षक */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg sm:text-xl font-black text-[#08213F] group-hover:text-blue-700 transition-colors leading-tight">
                      {c.title}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {c.subtitle}
                  </p>
                </div>

                {/* विशेषताएँ */}
                <div className="space-y-2 mb-5 flex-1">
                  {c.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium">{f}</span>
                    </div>
                  ))}
                </div>

                {/* मूल्य भाग */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-slate-400 line-through font-medium">
                        ₹{c.originalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-2xl font-black text-[#08213F] leading-none">
                        ₹{c.fromPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-green-600 font-bold mt-0.5">
                        बचत ₹{(c.originalPrice - c.fromPrice).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-700 text-[11px] font-black px-2.5 py-1 rounded-full">
                      {Math.round(((c.originalPrice - c.fromPrice) / c.originalPrice) * 100)}% छूट
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBookDirect) {
                        onBookDirect(c.id);
                      } else {
                        onSelectCategory(c.id);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00A86B] to-[#008f5b] hover:from-[#008f5b] hover:to-[#006b44] text-white text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                  >
                    <span>अभी बुक करें</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* ============ नीचे "View All" बटन ============ */}
        <div className="text-center">
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#08213F] hover:bg-[#0c2c52] text-white text-sm sm:text-base font-bold transition-all shadow-lg hover:shadow-xl group cursor-pointer"
          >
            <span>सभी सेवाएँ देखें</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default OurCleaningServicesSection;