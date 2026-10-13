import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, Clock3, HeartHandshake, MapPin, ShieldCheck, Sparkles, Star, WalletCards } from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES } from '../../data/masterCatalogData';

interface PremiumHomeSectionsProps {
  onBookNow: () => void;
  onOpenLocations: () => void;
}

const packageCards = [
  { title: 'Full Home Cleaning', subtitle: 'A complete refresh for every room', category: 'complete-home-cleaning' },
  { title: 'Sofa Cleaning', subtitle: 'Care for fabric, cushions and upholstery', category: 'sofa-cleaning' },
  { title: 'Kitchen Cleaning', subtitle: 'Lift everyday grease and grime', category: 'kitchen-cleaning' },
  { title: 'Bathroom Cleaning', subtitle: 'Fresh tiles, fittings and glass', category: 'bathroom-cleaning' },
  { title: 'Mattress Cleaning', subtitle: 'A fresher space for better rest', category: 'mattress-cleaning' },
];
const priceGroups = [
  { title: 'Bathroom Cleaning', rows: [['Classic', '₹399'], ['Intense', '₹499'], ['Moving', '₹599']] },
  { title: 'Sofa Cleaning', rows: [['Per seat', '₹180'], ['3-seat sofa', '₹499'], ['5-seat sofa', '₹649']] },
  { title: 'Mattress Cleaning', rows: [['Single', '₹499'], ['Double', '₹799']] },
  { title: 'Carpet Cleaning', rows: [['20 × 25', '₹399'], ['25 × 50', '₹599'], ['50 × 100', '₹800'], ['100 × 150', '₹1,300']] },
  { title: 'Full Home Cleaning', rows: [['1 BHK', '₹3,500'], ['2 BHK', '₹4,000'], ['3 BHK', '₹4,800'], ['4 BHK', '₹5,600'], ['5 BHK', '₹6,800']] },
  { title: 'Kitchen Cleaning', rows: [['Full', '₹2,200'], ['Moving', '₹1,800'], ['Classic', '₹1,400']] },
];
const benefits = [
  { icon: ShieldCheck, title: 'Verified Professionals', copy: 'Carefully onboarded home-service experts' },
  { icon: WalletCards, title: 'Transparent Pricing', copy: 'Know the package price before booking' },
  { icon: MapPin, title: 'Real-time Tracking', copy: 'Follow your booking status and updates' },
  { icon: BadgeCheck, title: 'Secure Payments', copy: 'Convenient payment options for bookings' },
  { icon: Sparkles, title: 'Thoughtful Cleaning', copy: 'A detailed approach to everyday home care' },
  { icon: HeartHandshake, title: 'Customer-first Support', copy: 'Help when you need it, from booking to finish' },
];
const reviews = [
  { name: 'Priya Sharma', city: 'Gurugram', quote: 'The team was punctual, professional and left my apartment feeling fresh.', initials: 'PS' },
  { name: 'Rahul Mehta', city: 'Gurugram', quote: 'Booking was simple and the service was thorough. Very convenient for a busy home.', initials: 'RM' },
  { name: 'Neha Singh', city: 'Gurugram', quote: 'Great experience. The team was careful with the furniture and cleaned every corner.', initials: 'NS' },
];
const faqs = [
  ['What areas do you serve in Gurugram?', 'We are building our service coverage around Gurugram. Enter your location while booking to check availability.'],
  ['How can I book a cleaning service?', 'Choose a service or package, select your address and preferred slot, then confirm your booking.'],
  ['Are your cleaners background checked?', 'Professionals are onboarded through the platform process. Please review the provider details shown for your booking.'],
  ['What cleaning products do you use?', 'Products and equipment can vary by service. Share any special surface or product requirements when arranging your booking.'],
  ['How do I make a payment?', 'Available payment methods are shown during checkout. Follow the checkout screen to complete payment securely.'],
  ['Can I reschedule or cancel my booking?', 'Open your booking details or contact support to check the available rescheduling and cancellation options.'],
];

export const PremiumHomeSections: React.FC<PremiumHomeSectionsProps> = ({ onBookNow, onOpenLocations }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const packages = packageCards.map((p) => {
    const category = MASTER_CATALOG_CATEGORIES.find((c) => c.id === p.category);
    const item = category?.items?.[0];
    return { ...p, image: category?.heroImage || item?.imageUrl || '', price: item?.offerPrice ?? category?.startingPrice ?? 0 };
  });

  return (
    <div className="bg-[#fffdf9] text-[#132b4a]">
      <section className="border-y border-[#eee4d2] bg-white py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {benefits.slice(0, 4).map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl px-2 py-2 sm:px-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e7d4ae] bg-[#fff8e9] text-[#a9782b]"><Icon className="h-5 w-5" /></span>
              <span><strong className="block text-xs sm:text-sm">{title}</strong><span className="mt-0.5 block text-[10px] leading-4 text-slate-500 sm:text-xs">{copy}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">Made for your home</p><h2 className="text-2xl font-black sm:text-3xl">Popular Service Packages</h2><p className="mt-2 text-sm text-slate-600">Premium cleaning, clear choices and convenient booking.</p></div>
            <button onClick={onBookNow} className="hidden items-center gap-2 text-sm font-bold text-[#8d6427] sm:inline-flex">View all packages <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {packages.map((p) => (
              <article key={p.category} className="group overflow-hidden rounded-2xl border border-[#eee3d1] bg-white shadow-[0_8px_24px_rgba(30,41,59,.05)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-40 overflow-hidden bg-[#f3eadb]">{p.image ? <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-sm text-[#8d6427]">Bharat Pro Expert</div>}</div>
                <div className="p-4"><h3 className="font-extrabold">{p.title}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{p.subtitle}</p><p className="mt-3 text-xs text-slate-500">Starting from</p><p className="text-xl font-black">{p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'View packages'}</p><button onClick={onBookNow} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d6ad62] to-[#b88732] px-3 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:brightness-95">Book Now <ArrowRight className="h-3.5 w-3.5" /></button></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#fff9ec] via-[#fffdf9] to-[#f8f1e5] py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_1.5fr] lg:px-8">
          <div className="self-center"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">Our service prices</p><h2 className="text-3xl font-black leading-tight sm:text-4xl">Premium care.<br/>Clear pricing.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Choose the service that fits your home. Final pricing and available options are confirmed in the booking flow.</p><button onClick={onBookNow} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#102b4d] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#193c65]">View packages <ArrowRight className="h-4 w-4" /></button></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {priceGroups.map((group) => <article key={group.title} className="rounded-2xl border border-[#ebdfc9] bg-white/90 p-4 shadow-[0_4px_18px_rgba(30,41,59,.04)]"><h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><span className="h-2 w-2 rounded-full bg-[#c99b4c]" />{group.title}</h3><div className="space-y-2">{group.rows.map(([label, price]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-dashed border-[#eee7dc] pb-2 text-xs last:border-0 last:pb-0"><span className="text-slate-600">{label}</span><strong className="text-[#172e4d]">{price}</strong></div>)}</div></article>)}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">The Bharat Pro difference</p><h2 className="text-2xl font-black sm:text-3xl">Why Choose Bharat Pro Expert?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">A smoother way to arrange trusted cleaning for your home.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(({ icon: Icon, title, copy }) => <article key={title} className="flex gap-4 rounded-2xl border border-[#eee4d2] bg-white p-5 shadow-[0_5px_20px_rgba(30,41,59,.035)]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e7d4ae] bg-[#fff8e9] text-[#a9782b]"><Icon className="h-5 w-5" /></span><div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{copy}</p></div></article>)}</div>
        </div>
      </section>

      <section className="bg-[#f8f5ee] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">Simple from start to finish</p><h2 className="text-2xl font-black sm:text-3xl">How It Works</h2></div>
          <div className="grid gap-4 md:grid-cols-3">{[{n:'01',title:'Choose a service',copy:'Explore cleaning categories and compare packages.',icon:Sparkles},{n:'02',title:'Schedule your slot',copy:'Add your address and choose a convenient time.',icon:CalendarDays},{n:'03',title:'Relax while we clean',copy:'Follow your booking updates and get ready for a fresher home.',icon:CheckCircle2}].map(({n,title,copy,icon:Icon},i)=><article key={n} className="relative rounded-2xl border border-[#e9deca] bg-white p-6 text-center shadow-sm"><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff6e4] text-[#a8782c]"><Icon className="h-6 w-6"/></span><span className="absolute right-4 top-4 text-xs font-black tracking-widest text-[#c9a361]">{n}</span><h3 className="font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{copy}</p>{i<2&&<span className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[#ead8b5] bg-white text-[#a8782c] lg:grid"><ArrowRight className="h-4 w-4"/></span>}</article>)}</div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">Customer stories</p><h2 className="text-2xl font-black sm:text-3xl">What Our Customers Say</h2><p className="mt-2 text-sm text-slate-600">A few examples of the experience we aim to deliver.</p></div><span className="hidden items-center gap-1 text-xs font-semibold text-slate-500 sm:flex"><Star className="h-4 w-4 fill-[#d3a44e] text-[#d3a44e]"/> Customer feedback</span></div>
          <div className="grid gap-4 md:grid-cols-3">{reviews.map((review)=><article key={review.name} className="rounded-2xl border border-[#eee4d2] bg-white p-5 shadow-[0_5px_20px_rgba(30,41,59,.04)]"><div className="flex gap-1 text-[#c4933d]">{Array.from({length:5},(_,i)=><Star key={i} className="h-3.5 w-3.5 fill-current"/>)}</div><p className="mt-4 text-sm leading-6 text-slate-600">“{review.quote}”</p><div className="mt-5 flex items-center gap-3 border-t border-[#f0e8dc] pt-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#102b4d] text-xs font-black text-white">{review.initials}</span><span><strong className="block text-sm">{review.name}</strong><span className="text-xs text-slate-500">{review.city}</span></span></div></article>)}</div>
        </div>
      </section>

      <section className="border-y border-[#eee4d2] bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff6e4] text-[#a8782c]"><MapPin className="h-5 w-5"/></span><div><h2 className="font-extrabold">Service Areas in Gurugram</h2><p className="mt-1 text-sm text-slate-500">Check whether cleaning service is available at your address.</p></div></div><button onClick={onOpenLocations} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7bd8b] px-5 py-3 text-sm font-bold text-[#8d6427] hover:bg-[#fff8ea]">Check service area <ArrowRight className="h-4 w-4"/></button></div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8782c]">Need a little help?</p><h2 className="text-2xl font-black sm:text-3xl">Frequently Asked Questions</h2><p className="mt-2 text-sm text-slate-600">Quick answers to common booking questions.</p></div>
          <div className="grid gap-3 md:grid-cols-2">{faqs.map(([q,a],i)=><article key={q} className="overflow-hidden rounded-xl border border-[#eee4d2] bg-white"><button type="button" onClick={()=>setOpenFaq(openFaq===i?null:i)} aria-expanded={openFaq===i} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold"><span>{q}</span><ChevronDown className={`h-4 w-4 shrink-0 text-[#a8782c] transition-transform ${openFaq===i?'rotate-180':''}`}/></button>{openFaq===i&&<p className="px-4 pb-4 text-sm leading-6 text-slate-600">{a}</p>}</article>)}</div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#0d2544] via-[#16385f] to-[#0d2544] px-6 py-8 text-white shadow-xl sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#e5c27c]">Your home deserves the best</p><h2 className="text-2xl font-black sm:text-3xl">Ready for a cleaner, healthier home?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Choose your cleaning service and book a convenient slot in just a few steps.</p></div>
          <button onClick={onBookNow} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#f0d18a] to-[#c69540] px-6 py-3.5 text-sm font-black text-[#172b46] shadow-lg transition hover:brightness-105">Book Now <ArrowRight className="h-4 w-4"/></button>
        </div>
      </section>
    </div>
  );
};

export default PremiumHomeSections;
