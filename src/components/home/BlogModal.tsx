import React from 'react';
import { X, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { BharatProLogo } from '../BharatProLogo';

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookNow: () => void;
}

export const BlogModal: React.FC<BlogModalProps> = ({
  isOpen,
  onClose,
  onOpenBookNow
}) => {
  if (!isOpen) return null;

  const posts = [
    {
      id: 1,
      title: 'Why Acidic Cleaners Damage Italian Marble & How Diversey Neutral pH Solves It',
      date: 'Oct 2026',
      readTime: '4 min read',
      excerpt: 'Learn why typical local maid acid washes create irreversible yellow pitting on bathroom tiles and marble, and how hospital-grade Diversey Taski R9 preserves shine.',
      image: '/src/assets/images/bathroom_deep_cleaning_1790693663269.jpg'
    },
    {
      id: 2,
      title: 'The Hidden Danger of Dust Mites in Mattresses & Couches in Urban Apartments',
      date: 'Sep 2026',
      readTime: '5 min read',
      excerpt: 'Standard dry vacuuming leaves 80% of allergen colonies behind. Injection-extraction wet shampooing at 60°C eliminates bacterial buildup completely.',
      image: '/src/assets/images/sofa_deep_cleaning_1790693680475.jpg'
    },
    {
      id: 3,
      title: 'How Power Jet AC Servicing Saves 30% Electricity in Peak Summer',
      date: 'Aug 2026',
      readTime: '3 min read',
      excerpt: 'High-pressure water coil washing unclogs compacted dust fins, restoring original airflow CFM and reducing compressor duty cycles significantly.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <BharatProLogo size="sm" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bharat Pro Expert Insights &amp; Blog</h3>
              <p className="text-[11px] text-slate-500">Expert guides on home hygiene, fabric longevity &amp; equipment science</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {posts.map((p) => (
            <div 
              key={p.id}
              className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start"
            >
              <img 
                src={p.image} 
                alt={p.title} 
                className="w-full sm:w-36 h-28 object-cover rounded-xl border border-slate-100 shrink-0" 
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span>📅 {p.date}</span>
                  <span>&bull;</span>
                  <span>⏱️ {p.readTime}</span>
                </div>
                <h4 className="text-sm font-bold text-[#0B2A4A] leading-snug">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {p.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
