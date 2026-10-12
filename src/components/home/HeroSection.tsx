import React, { useEffect, useState } from 'react';
import './HeroSection.css';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { MASTER_CATALOG_CATEGORIES } from '../../data/masterCatalogData';

export interface HeroSectionProps {
  selectedLocation?: string;
  onOpenLocationModal?: () => void;
  onSelectServiceItem?: (service: any) => void;
  onOpenBookNow?: () => void;
}

const SERVICE_SLIDES = [
  { id: 'sofa-cleaning', label: 'Sofa Cleaning', categoryId: 'sofa-cleaning', image: 'https://images.pexels.com/photos/4401538/pexels-photo-4401538.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'FABRIC CARE, REFINED', headline: 'Bring Your Sofa Back to Life', detail: 'Deep fabric cleaning, fresh finishes and expert care for your favourite place to relax.', icon: '🛋️' },
  { id: 'carpet-cleaning', label: 'Carpet Cleaning', categoryId: 'carpet-cleaning', image: 'https://images.pexels.com/photos/4107284/pexels-photo-4107284.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'DEEP FIBRE RESTORATION', headline: 'Luxury Care for Every Fibre', detail: 'Refresh carpets and rugs with detailed cleaning designed for a cleaner, brighter home.', icon: '✦' },
  { id: 'chair-cleaning', label: 'Chairs Cleaning', categoryId: 'chair-cleaning', image: 'https://images.pexels.com/photos/18947371/pexels-photo-18947371.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'CARE IN EVERY DETAIL', headline: 'Make Every Seat Feel New', detail: 'Specialist chair and upholstery cleaning for dining, office and accent seating.', icon: '🪑' },
  { id: 'kitchen-cleaning', label: 'Kitchen Cleaning', categoryId: 'kitchen-cleaning', image: 'https://images.pexels.com/photos/10568269/pexels-photo-10568269.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'A FRESH START, EVERY DAY', headline: 'A Kitchen That Truly Shines', detail: 'Thoughtful degreasing and detailed cleaning for the heart of your home.', icon: '✧' },
  { id: 'apartment-cleaning', label: 'Apartment Cleaning', categoryId: 'apartment-cleaning', image: 'https://images.pexels.com/photos/6195278/pexels-photo-6195278.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'WHOLE-HOME PERFECTION', headline: 'Come Home to Exceptional Clean', detail: 'A considered deep clean for rooms, surfaces and the spaces you live in.', icon: '⌂' },
  { id: 'bathroom-cleaning', label: 'Bathroom Cleaning', categoryId: 'bathroom-cleaning', image: 'https://images.pexels.com/photos/4239114/pexels-photo-4239114.jpeg?auto=compress&cs=tinysrgb&w=1800', eyebrow: 'SPA-INSPIRED CLEANLINESS', headline: 'A Brighter, Fresher Bathroom', detail: 'Detailed bathroom cleaning for sparkling fittings, tiles and everyday comfort.', icon: '✦' }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation = '',
  onOpenLocationModal,
  onSelectServiceItem,
  onOpenBookNow
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SERVICE_SLIDES[activeSlide];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % SERVICE_SLIDES.length), 5200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const bookSlide = (categoryId: string) => {
    const category = MASTER_CATALOG_CATEGORIES.find(item => item.id === categoryId && item.active);
    const service = category?.items.find(item => item.active) || category?.items[0];
    if (service && onSelectServiceItem) {
      onSelectServiceItem(service);
      return;
    }
    onOpenBookNow?.();
  };

  const changeSlide = (next: number) => setActiveSlide((next + SERVICE_SLIDES.length) % SERVICE_SLIDES.length);

  return (
    <section
      className="bpe-ultra-slider"
      aria-label="Premium cleaning services"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SERVICE_SLIDES.map((item, index) => (
        <div key={item.id} className={`bpe-ultra-slider__scene ${index === activeSlide ? 'is-active' : ''}`} aria-hidden={index !== activeSlide}>
          <img className="bpe-ultra-slider__photo" src={item.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} />
        </div>
      ))}
      <div className="bpe-ultra-slider__veil" />
      <div className="bpe-ultra-slider__topline">
        <div className="bpe-ultra-slider__trust"><ShieldCheck size={17} /><span>Trusted Home Cleaning Services</span></div>
        <button type="button" className="bpe-ultra-slider__location" onClick={onOpenLocationModal}>
          <MapPin size={16} /><span>{selectedLocation || 'Choose your location'}</span><span className="bpe-ultra-slider__change">Change</span>
        </button>
      </div>

      <div className="bpe-ultra-slider__copy" key={slide.id}>
        <p className="bpe-ultra-slider__eyebrow"><Sparkles size={14} /> {slide.eyebrow}</p>
        <h1>{slide.headline}</h1>
        <p className="bpe-ultra-slider__description">{slide.detail}</p>
        <div className="bpe-ultra-slider__proof"><CheckCircle2 size={16} /> Professional service <span /> Transparent pricing <span /> Easy booking</div>
        <button type="button" className="bpe-ultra-slider__book" onClick={() => bookSlide(slide.categoryId)}>
          <span>Book {slide.label}</span><ArrowRight size={17} />
        </button>
      </div>

      <button type="button" aria-label="Previous service" className="bpe-ultra-slider__arrow bpe-ultra-slider__arrow--left" onClick={() => changeSlide(activeSlide - 1)}><ChevronLeft size={23} /></button>
      <button type="button" aria-label="Next service" className="bpe-ultra-slider__arrow bpe-ultra-slider__arrow--right" onClick={() => changeSlide(activeSlide + 1)}><ChevronRight size={23} /></button>

      <div className="bpe-ultra-slider__bottom">
        <div className="bpe-ultra-slider__service-tabs" role="group" aria-label="Choose cleaning service">
          {SERVICE_SLIDES.map((item, index) => (
            <div key={item.id} className={`bpe-ultra-slider__tab-item ${index === activeSlide ? 'is-selected' : ''}`}>
              <button type="button" aria-pressed={index === activeSlide} className="bpe-ultra-slider__tab-select" onClick={() => changeSlide(index)}>
                <span className="bpe-ultra-slider__tab-icon">{item.icon}</span><span>{item.label}</span>
              </button>
              <button type="button" className="bpe-ultra-slider__mini-book" onClick={() => bookSlide(item.categoryId)}>
                Book <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="bpe-ultra-slider__progress"><span>{String(activeSlide + 1).padStart(2, '0')}</span><div><i style={{ width: `${((activeSlide + 1) / SERVICE_SLIDES.length) * 100}%` }} /></div><span>{String(SERVICE_SLIDES.length).padStart(2, '0')}</span></div>
      </div>
    </section>
  );
};

export default HeroSection;
