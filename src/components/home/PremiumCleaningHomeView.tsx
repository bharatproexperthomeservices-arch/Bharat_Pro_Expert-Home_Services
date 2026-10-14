import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Bath, CheckCircle2, ChevronRight, Clock3, MapPin, Menu,
  Search, Sparkles, Sofa, Utensils, Home, BedDouble, Layers3, X, UserRound,
  CalendarCheck, ShieldCheck, MessageCircle
} from 'lucide-react';
import { BharatProLogo } from '../BharatProLogo';
import { IndiaLocationDetectionModal } from '../location/IndiaLocationDetectionModal';
import { TrackBookingModal } from './TrackBookingModal';
import { CategoryDetailModal } from './CategoryDetailModal';
import { MASTER_CATALOG_CATEGORIES, CatalogCategory, CatalogItem, catalogItemToCleaningService } from '../../data/masterCatalogData';
import { CleaningService, Booking } from '../../types';

interface Props {
  user: any;
  profile: any;
  myBookings: Booking[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onProceedToBooking: (service: CleaningService) => void;
  onTrackBooking: (booking: Booking) => void;
  onOpenAuth: (role?: 'customer' | 'partner') => void;
  onOpenCustomerDashboard: () => void;
  onOpenAdmin: () => void;
  onOpenPartner: () => void;
  onOpenHelp: () => void;
}

const categoryVisuals: Record<string, { image: string; icon: React.ReactNode; eyebrow: string }> = {
  'bathroom-cleaning': { image: 'https://images.pexels.com/photos/4239114/pexels-photo-4239114.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Bath />, eyebrow: 'Bathroom care' },
  'kitchen-cleaning': { image: 'https://images.pexels.com/photos/10568269/pexels-photo-10568269.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Utensils />, eyebrow: 'Kitchen care' },
  'sofa-carpet-living': { image: 'https://images.pexels.com/photos/4401538/pexels-photo-4401538.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Sofa />, eyebrow: 'Fabric & upholstery' },
  'full-home-cleaning': { image: 'https://images.pexels.com/photos/6195949/pexels-photo-6195949.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Home />, eyebrow: 'Whole-home care' },
  'mattress-cleaning': { image: 'https://images.pexels.com/photos/7513103/pexels-photo-7513103.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <BedDouble />, eyebrow: 'Mattress care' },
  'carpet-cleaning': { image: 'https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Layers3 />, eyebrow: 'Carpet care' },
};

const defaultVisual = { image: 'https://images.pexels.com/photos/6197116/pexels-photo-6197116.jpeg?auto=compress&cs=tinysrgb&w=1200', icon: <Sparkles />, eyebrow: 'Cleaning experts' };
const waUrl = 'https://wa.me/918920252647?text=' + encodeURIComponent('Hello Bharat Pro Expert, I need help with a cleaning service booking.');

export const PremiumCleaningHomeView: React.FC<Props> = ({
  user, profile, selectedCity, onSelectCity, onProceedToBooking,
  onTrackBooking, onOpenAuth, onOpenCustomerDashboard, onOpenAdmin, onOpenPartner, onOpenHelp
}) => {
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bpe_customer_location_v1');
      if (!saved) setLocationModalOpen(true);
      else {
        const parsed = JSON.parse(saved);
        if (parsed.city && parsed.state) onSelectCity(parsed.city + ', ' + parsed.state);
      }
    } catch {}
  }, []);

  const categories = useMemo(() => MASTER_CATALOG_CATEGORIES
    .filter(category => category.active && category.items.some(item => item.active))
    .sort((a, b) => a.sortOrder - b.sortOrder), []);

  const matchingCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return categories;
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => item.active &&
        [item.name, item.description, item.categoryName, category.name].some(value => value.toLowerCase().includes(normalized)))
    })).filter(category => category.items.length > 0);
  }, [categories, query]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const bookItem = (item: CatalogItem) => onProceedToBooking(catalogItemToCleaningService(item));
  const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  return (
    <main className="bpe-premium min-h-screen bg-white text-[#202124]">
      <style>{`
        .bpe-premium { --bpe-gold:#D4A24E; --bpe-ink:#202124; --bpe-muted:#6B7280; font-family:Inter,'Plus Jakarta Sans',sans-serif; }
        .bpe-premium * { box-sizing:border-box; }
        .bpe-premium .bpe-container { width:min(1240px, calc(100% - 40px)); margin-inline:auto; }
        .bpe-premium .bpe-glass { background:rgba(255,255,255,.88); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
        .bpe-premium .bpe-card { border:1px solid #ece9e2; border-radius:22px; overflow:hidden; background:#fff; transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease; }
        .bpe-premium .bpe-card:hover { transform:translateY(-5px); box-shadow:0 18px 45px rgba(37,31,19,.10); border-color:#e4c98e; }
        .bpe-premium .bpe-section { scroll-margin-top:100px; padding:52px 0; }
        .bpe-premium .bpe-pill { border:1px solid #eadfc8; background:#fffaf0; color:#805b1f; }
        .bpe-premium .bpe-gold-button { background:#D4A24E; color:#20180c; transition:all .2s ease; }
        .bpe-premium .bpe-gold-button:hover { background:#e0b766; transform:translateY(-1px); }
        .bpe-premium .bpe-photo { object-fit:cover; width:100%; height:100%; display:block; }
        .bpe-premium .bpe-category-link { white-space:nowrap; border:1px solid #ece9e2; border-radius:999px; padding:10px 15px; font-size:12px; font-weight:700; background:white; transition:all .2s ease; }
        .bpe-premium .bpe-category-link:hover { background:#fff8e9; border-color:#D4A24E; }
        .bpe-premium .bpe-line-clamp { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        @media(max-width:640px) { .bpe-premium .bpe-container { width:calc(100% - 28px); } .bpe-premium .bpe-section { padding:34px 0; } .bpe-premium .bpe-card { border-radius:16px; } }
        @media(prefers-reduced-motion:reduce) { .bpe-premium *, .bpe-premium *:before, .bpe-premium *:after { animation-duration:.01ms!important; transition-duration:.01ms!important; scroll-behavior:auto!important; } }
      `}</style>

      <header className="bpe-glass sticky top-0 z-40 border-b border-[#eee9df]">
        <div className="bpe-container flex min-h-[76px] items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} className="flex items-center gap-2 text-left">
            <BharatProLogo size="md" />
            <span className="flex flex-col leading-tight">
              <strong className="text-[15px] sm:text-lg font-extrabold tracking-tight">BHARAT PRO EXPERT</strong>
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a8792c]">Home Services</span>
            </span>
          </button>
          <button onClick={() => setLocationModalOpen(true)} className="hidden md:flex items-center gap-2 rounded-full border border-[#eee9df] bg-white px-4 py-2 text-xs font-semibold hover:border-[#D4A24E]">
            <MapPin size={15} className="text-[#b18437]" /><span className="max-w-[180px] truncate">{selectedCity || 'Select your location'}</span><ChevronRight size={14}/>
          </button>
          <div className="hidden lg:flex flex-1 max-w-[370px] items-center rounded-full border border-[#e9e5dc] bg-[#faf9f6] px-4 py-2.5">
            <Search size={16} className="mr-2 text-[#8b8b83]"/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cleaning services..." className="w-full bg-transparent text-sm outline-none" aria-label="Search cleaning services"/>
            {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14}/></button>}
          </div>
          <div className="flex items-center gap-2">
            <a href={waUrl} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 rounded-full border border-[#cce8d2] bg-[#f1fbf3] px-3 py-2 text-xs font-bold text-[#187640]"><MessageCircle size={15}/> WhatsApp</a>
            {user || profile
              ? <button onClick={onOpenCustomerDashboard} className="flex items-center gap-2 rounded-full bg-[#f7f3e9] px-3 py-2 text-xs font-bold"><UserRound size={16}/><span className="hidden sm:inline">My Account</span></button>
              : <button onClick={() => onOpenAuth('customer')} className="rounded-full border border-[#e7dfcf] px-4 py-2 text-xs font-bold">Login</button>}
            <button onClick={() => setMobileMenuOpen(v => !v)} className="rounded-xl border border-[#eee9df] p-2 lg:hidden" aria-label="Open menu">{mobileMenuOpen ? <X size={18}/> : <Menu size={18}/>}</button>
          </div>
        </div>
        <div className="bpe-container flex items-center gap-2 pb-3 md:hidden">
          <button onClick={() => setLocationModalOpen(true)} className="flex shrink-0 items-center gap-1 rounded-full bg-[#faf7ef] px-3 py-2 text-[11px] font-bold"><MapPin size={13}/>{selectedCity || 'Choose location'}</button>
          <div className="flex min-w-0 flex-1 items-center rounded-full border border-[#eee9df] px-3 py-2"><Search size={14} className="mr-2 shrink-0 text-gray-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search cleaning..." className="min-w-0 w-full bg-transparent text-xs outline-none"/></div>
          <a href={waUrl} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="rounded-full bg-[#e9f8ed] p-2 text-[#187640]"><MessageCircle size={17}/></a>
        </div>
        {mobileMenuOpen && <div className="bpe-container flex flex-wrap gap-2 pb-4 lg:hidden">
          <button className="bpe-category-link" onClick={()=>scrollTo('cleaning-catalogue')}>All Cleaning Services</button>
          <button className="bpe-category-link" onClick={()=>setTrackModalOpen(true)}>Track Booking</button>
          <button className="bpe-category-link" onClick={onOpenHelp}>Help & Support</button>
          <button className="bpe-category-link" onClick={()=>scrollTo('bpe-contact')}>Contact</button>
        </div>}
      </header>

      <nav className="border-b border-[#f0ede6] bg-[#fffdf9]">
        <div className="bpe-container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          <button className="bpe-category-link" onClick={()=>scrollTo('cleaning-catalogue')}>✨ All Cleaning</button>
          {categories.map(category => <button key={category.id} className="bpe-category-link" onClick={()=>scrollTo('category-'+category.id)}>{category.name}</button>)}
        </div>
      </nav>

      <section className="bpe-container py-7 sm:py-10">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.55}} className="relative isolate overflow-hidden rounded-[26px] sm:rounded-[34px] bg-[#f6f0e5]">
          <div className="absolute inset-0 -z-10">
            <img src="https://images.pexels.com/photos/6197116/pexels-photo-6197116.jpeg?auto=compress&cs=tinysrgb&w=1800" alt="Bright, professionally cleaned modern home interior" className="bpe-photo opacity-35"/>
            <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf0] via-[#fffaf0]/95 to-[#fffaf0]/25"/>
          </div>
          <div className="grid min-h-[360px] items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:p-14">
            <div className="max-w-[640px]">
              <span className="bpe-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em]"><Sparkles size={13}/> A cleaner home, a calmer day</span>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-.045em] sm:text-5xl lg:text-6xl">Your home deserves <span className="text-[#b07b25]">expert care.</span></h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#5e5a52] sm:text-base">Thoughtful home cleaning, beautifully organised packages, and trusted booking support — all in one place.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={()=>scrollTo('cleaning-catalogue')} className="bpe-gold-button inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold shadow-lg shadow-[#d4a24e]/20">Explore Cleaning Services <ArrowRight size={16}/></button>
                <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#ded2bb] bg-white/90 px-5 py-3.5 text-sm font-bold"><MessageCircle size={16} className="text-[#21864b]"/> Chat on WhatsApp</a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#655e51]">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#a8792c]"/> Clear package details</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#a8792c]"/> Easy online booking</span>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[{t:'Bathroom Cleaning',i:'https://images.pexels.com/photos/4239114/pexels-photo-4239114.jpeg?auto=compress&cs=tinysrgb&w=700'},{t:'Sofa Cleaning',i:'https://images.pexels.com/photos/4401538/pexels-photo-4401538.jpeg?auto=compress&cs=tinysrgb&w=700'},{t:'Kitchen Cleaning',i:'https://images.pexels.com/photos/10568269/pexels-photo-10568269.jpeg?auto=compress&cs=tinysrgb&w=700'},{t:'Home Deep Cleaning',i:'https://images.pexels.com/photos/6195949/pexels-photo-6195949.jpeg?auto=compress&cs=tinysrgb&w=700'}].map((item,i)=><motion.div key={item.t} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.12+i*.08}} className={'relative h-36 overflow-hidden rounded-2xl shadow-lg '+(i%2?'mt-7':'')}><img src={item.i} alt={item.t} className="bpe-photo"/><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/><span className="absolute bottom-3 left-3 text-sm font-bold text-white">{item.t}</span></motion.div>)}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bpe-container grid grid-cols-2 gap-3 pb-6 sm:grid-cols-4">
        {[{icon:<ShieldCheck/>,title:'Clear service scope',sub:'Know what is included'},{icon:<CalendarCheck/>,title:'Convenient booking',sub:'Choose an available slot'},{icon:<MessageCircle/>,title:'WhatsApp support',sub:'Chat with our team'},{icon:<Sparkles/>,title:'Cleaning-focused',sub:'Services for your home'}].map((item,i)=><motion.div key={item.title} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}} className="rounded-2xl border border-[#eee9df] bg-white p-4"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf2df] text-[#a8792c]">{item.icon}</span><strong className="block text-xs sm:text-sm">{item.title}</strong><span className="mt-1 block text-[10px] leading-4 text-[#77736b] sm:text-xs">{item.sub}</span></motion.div>)}
      </section>

      <section id="cleaning-catalogue" className="bpe-section bg-[#faf9f6]">
        <div className="bpe-container">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a8792c]">The cleaning catalogue</span><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Find the right clean.</h2><p className="mt-2 max-w-xl text-sm text-[#6B7280]">Browse category by category, with relevant photos, clear packages and straightforward booking.</p></div>
            <span className="rounded-full border border-[#e9dfcb] bg-white px-4 py-2 text-xs font-bold text-[#8b672e]">{matchingCategories.length} categories</span>
          </div>

          {matchingCategories.length === 0 && <div className="rounded-2xl border border-dashed border-[#d9c9a9] bg-white p-10 text-center"><Search className="mx-auto mb-3 text-[#b18437]"/><h3 className="font-bold">No cleaning services found</h3><p className="mt-1 text-sm text-gray-500">Try another service name or clear your search.</p><button onClick={()=>setQuery('')} className="mt-4 rounded-full bg-[#D4A24E] px-5 py-2 text-sm font-bold">Clear search</button></div>}

          {matchingCategories.map((category, index) => {
            const visual = categoryVisuals[category.id] || { ...defaultVisual, image: category.heroImage || defaultVisual.image };
            const items = category.items.filter(item => item.active).sort((a,b)=>a.sortOrder-b.sortOrder);
            return <section key={category.id} id={'category-'+category.id} className="scroll-mt-28 border-b border-[#eae6dd] py-9 last:border-b-0 sm:py-12">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e7cd] text-[#9b6c20] sm:flex">{visual.icon}</div>
                  <div><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a8792c]">{visual.eyebrow}</span><h3 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{category.name}</h3><p className="mt-1 text-xs text-[#77736b] sm:text-sm">{category.subtitle}</p></div>
                </div>
                <button onClick={()=>setSelectedCategory(category)} className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#9b6c20]">View all <ChevronRight size={15}/></button>
              </div>
              <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item, itemIndex) => <motion.article key={item.id} layout initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.08}} transition={{duration:.32,delay:Math.min(itemIndex*.035,.18)}} className="bpe-card flex min-w-0 flex-col">
                  <button onClick={()=>setSelectedCategory(category)} className="relative block aspect-[1.35/1] overflow-hidden bg-[#f1eee7] text-left">
                    <img src={item.imageUrl || visual.image} alt={item.name+' service'} loading={index > 0 || itemIndex > 2 ? 'lazy' : 'eager'} className="bpe-photo transition-transform duration-500 hover:scale-105" onError={e=>{(e.currentTarget as HTMLImageElement).src=visual.image}}/>
                    {item.popular && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold text-[#8a611e] shadow-sm">POPULAR</span>}
                  </button>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <h4 className="bpe-line-clamp min-h-[34px] text-xs font-extrabold leading-4 sm:text-sm">{item.name}</h4>
                    <p className="bpe-line-clamp mt-1.5 min-h-[32px] text-[10px] leading-4 text-[#77736b] sm:text-xs">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-1">
                      <div><span className="block text-[9px] text-[#8b857a]">Starting at</span><strong className="text-sm font-black sm:text-base">{money(item.offerPrice)}</strong>{item.originalPrice>item.offerPrice && <span className="ml-1 text-[9px] text-gray-400 line-through">{money(item.originalPrice)}</span>}</div>
                      {item.duration && <span className="flex items-center gap-1 text-[9px] text-[#77736b]"><Clock3 size={11}/>{item.duration}</span>}
                    </div>
                    <button onClick={()=>bookItem(item)} className="bpe-gold-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] font-extrabold sm:text-xs">Book service <ArrowRight size={13}/></button>
                  </div>
                </motion.article>)}
              </motion.div>
            </section>;
          })}
        </div>
      </section>

      <section className="bpe-container py-10 sm:py-14">
        <div id="bpe-contact" className="overflow-hidden rounded-[26px] bg-[#f7f0e3] p-6 sm:p-10 lg:flex lg:items-center lg:justify-between">
          <div><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#9a6b22]">Need a little help?</span><h2 className="mt-2 text-2xl font-black sm:text-3xl">Let's find your cleaning service.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#696257]">Message Bharat Pro Expert on WhatsApp for help with packages, service areas or an existing booking.</p><div className="mt-4 space-y-1 text-xs text-[#5d584f]"><p>bharatproexperthomeservices@gmail.com</p><p>bharatproexpert@gmail.com</p><p>Working hubs: Delhi NCR · Gurugram · Haryana · Jharkhand · Patna · Faridabad · Mumbai · Noida</p></div></div>
          <a href={waUrl} target="_blank" rel="noreferrer" className="bpe-gold-button mt-6 inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold lg:mt-0"><MessageCircle size={17}/> Connect on WhatsApp</a>
        </div>
      </section>

      <footer className="border-t border-[#eee9df] bg-[#fffdf9] py-10">
        <div className="bpe-container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2"><BharatProLogo size="md"/><div><strong className="block text-sm font-extrabold">BHARAT PRO EXPERT</strong><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a8792c]">Home Services</span></div></div>
            <p className="mt-3 max-w-xs text-xs leading-5 text-[#77736b]">Professional cleaning services with clear package details and convenient online booking.</p>
          </div>
          <div><h3 className="mb-3 text-xs font-extrabold uppercase tracking-[.16em]">Cleaning categories</h3><div className="flex flex-col gap-2 text-xs text-[#6B7280]">{categories.slice(0,6).map(c=><button key={c.id} onClick={()=>scrollTo('category-'+c.id)} className="text-left hover:text-[#9b6c20]">{c.name}</button>)}</div></div>
          <div><h3 className="mb-3 text-xs font-extrabold uppercase tracking-[.16em]">Working hubs</h3><p className="text-xs leading-6 text-[#6B7280]">Delhi NCR · Gurugram · Haryana · Jharkhand · Patna · Faridabad · Mumbai · Noida</p><button onClick={()=>setLocationModalOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9b6c20]"><MapPin size={13}/> Check your area</button></div>
          <div><h3 className="mb-3 text-xs font-extrabold uppercase tracking-[.16em]">Connect with us</h3><a href="mailto:bharatproexperthomeservices@gmail.com" className="block break-all text-xs text-[#6B7280] hover:text-[#9b6c20]">bharatproexperthomeservices@gmail.com</a><a href="mailto:bharatproexpert@gmail.com" className="mt-2 block text-xs text-[#6B7280] hover:text-[#9b6c20]">bharatproexpert@gmail.com</a><a href={waUrl} target="_blank" rel="noreferrer" className="bpe-gold-button mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold"><MessageCircle size={15}/> WhatsApp support</a><div className="mt-4 flex flex-wrap gap-2"><button onClick={onOpenHelp} className="text-xs font-semibold text-[#6B7280] underline">Help & FAQs</button><button onClick={onOpenPartner} className="text-xs font-semibold text-[#6B7280] underline">Partner portal</button><button onClick={onOpenAdmin} className="text-xs font-semibold text-[#6B7280] underline">Admin portal</button></div></div>
        </div>
        <div className="bpe-container mt-8 border-t border-[#eee9df] pt-5 text-[10px] text-[#8a857c]">© {new Date().getFullYear()} Bharat Pro Expert Home Services. All rights reserved.</div>
      </footer>

      <IndiaLocationDetectionModal isOpen={locationModalOpen} onClose={()=>setLocationModalOpen(false)} currentLocationName={selectedCity} onLocationResolved={loc=>onSelectCity(loc.city+', '+loc.state)}/>
      <TrackBookingModal isOpen={trackModalOpen} onClose={()=>setTrackModalOpen(false)} onOpenLiveTrackingModal={booking=>onTrackBooking(booking)}/>
      <CategoryDetailModal category={selectedCategory} onClose={()=>setSelectedCategory(null)} onAddItem={item=>bookItem(item)} onRemoveItem={()=>{}} cart={[]}/>
    </main>
  );
};

export default PremiumCleaningHomeView;
