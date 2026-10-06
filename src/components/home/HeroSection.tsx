import { useState, useEffect } from 'react';

// 10 Full HD Cleaning Images — No Blur, 1920px width
const SLIDER_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&q=95&auto=format&fit=crop',
    title: 'Sofa Deep Cleaning',
    subtitle: 'Fabric shampooing & stain removal'
  },
  {
    url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=95&auto=format&fit=crop',
    title: 'Bathroom Sanitization',
    subtitle: 'Hard water scale & grime removal'
  },
  {
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=95&auto=format&fit=crop',
    title: 'Kitchen Deep Cleaning',
    subtitle: 'Oil & grease degreasing'
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=95&auto=format&fit=crop',
    title: 'Carpet Cleaning',
    subtitle: 'Dust mite & allergen removal'
  },
  {
    url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=95&auto=format&fit=crop',
    title: 'Mattress Cleaning',
    subtitle: 'UV sanitization & stain treatment'
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=95&auto=format&fit=crop',
    title: 'Full Apartment Cleaning',
    subtitle: '360° deep home sanitization'
  },
  {
    url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1920&q=95&auto=format&fit=crop',
    title: 'Modern Bathroom Shine',
    subtitle: 'Chrome polish & tile descaling'
  },
  {
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1920&q=95&auto=format&fit=crop',
    title: 'Modular Kitchen Care',
    subtitle: 'Chimney & appliance deep clean'
  },
  {
    url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1920&q=95&auto=format&fit=crop',
    title: 'Living Room Refresh',
    subtitle: 'Complete home deep cleaning'
  },
  {
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=95&auto=format&fit=crop',
    title: 'Professional Cleaning Team',
    subtitle: 'Diversey certified chemicals & equipment'
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  // 8-second auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => setCurrent(index);
  const goPrev = () => setCurrent((prev) => (prev - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % SLIDER_IMAGES.length);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {SLIDER_IMAGES.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={img.url}
            alt={img.title}
            className="w-full h-full object-cover"
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Text content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              {img.title}
            </h1>
            <p className="text-lg md:text-2xl text-gray-100 mb-6 drop-shadow-md">
              {img.subtitle}
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg w-fit transition-colors shadow-xl">
              Book Now
            </button>
          </div>
        </div>
      ))}

      {/* Left Arrow */}
      <button
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
      >
        ‹
      </button>

      {/* Right Arrow */}
      <button
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
      >
        ›
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDER_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}