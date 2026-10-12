import React, { useState } from 'react';
import './HeroSection.css';
import { ArrowRight, CheckCircle2, ChevronDown, MapPin, Search, ShieldCheck, Sparkles, Tag } from 'lucide-react';

export interface HeroSectionProps {
  selectedLocation?: string;
  onOpenLocationModal?: () => void;
  onSelectServiceItem?: (service: any) => void;
  onOpenBookNow?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedLocation = 'Gurugram, Haryana',
  onOpenLocationModal,
  onOpenBookNow
}) => {
  const [serviceQuery, setServiceQuery] = useState('');

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (serviceQuery.trim()) {
      const query = serviceQuery.trim().toLowerCase();
      const targetId = query.includes('kitchen') ? 'kitchen-cleaning' :
        query.includes('bath') ? 'bathroom-cleaning' :
        query.includes('sofa') || query.includes('carpet') ? 'sofa-shampooing' :
        'full-home-cleaning';
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    onOpenBookNow?.();
  };

  return (
    <section className="bpe-reference-hero relative isolate w-full overflow-hidden">
      <img
        className="bpe-reference-hero__background"
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=90"
        alt="Bright luxury living room with elegant sofa and large windows"
        fetchPriority="high"
      />
      <div className="bpe-reference-hero__overlay" />

      <div className="bpe-reference-hero__inner relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 sm:px-8 lg:px-16">
        <div className="bpe-reference-hero__content">
          <div className="bpe-reference-hero__trust-pill">
            <ShieldCheck className="h-5 w-5 shrink-0 fill-emerald-600 text-white" />
            <span>Trusted Home Cleaning Services</span>
          </div>

          <h1 className="bpe-reference-hero__headline">Bharat Pro Expert</h1>
          <p className="bpe-reference-hero__tagline">Professional. Reliable. Premium.</p>

          <form className="bpe-reference-hero__searchbar" onSubmit={handleSearch}>
            <button type="button" onClick={onOpenLocationModal} className="bpe-reference-hero__location" aria-label="Choose service location">
              <MapPin className="h-6 w-6 shrink-0 fill-[#08213f] text-white" />
              <span className="bpe-reference-hero__location-label">{selectedLocation || 'Choose your location'}</span>
              <ChevronDown className="h-5 w-5 shrink-0" />
            </button>
            <label className="bpe-reference-hero__service-search">
              <Search className="h-6 w-6 shrink-0 text-[#08213f]" />
              <input type="search" value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Search cleaning services..." aria-label="Search cleaning services" />
            </label>
            <button className="bpe-reference-hero__book-button" type="submit">
              <span>Book Now</span><ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <div className="bpe-reference-hero__locations" aria-label="Service locations">
            <span>Serving:</span>
            {['Delhi', 'Gurgaon', 'Noida', 'Haryana', 'Patna', 'Jharkhand'].map((city) => (
              <button type="button" key={city} onClick={onOpenLocationModal}>{city}</button>
            ))}
          </div>
        </div>

        <aside className="bpe-reference-hero__offer" aria-label="First booking offer">
          <div className="bpe-reference-hero__offer-icon"><Tag className="h-5 w-5" /></div>
          <div>
            <strong>Get 20% OFF</strong>
            <span>Your First Booking</span>
            <small><Sparkles className="h-4 w-4" /> CLEANING <Sparkles className="h-4 w-4" /></small>
          </div>
        </aside>

        <div className="bpe-reference-hero__bottom-note">
          <CheckCircle2 className="h-4 w-4" /> Premium care for every corner of your home
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
