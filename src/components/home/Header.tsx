import React, { useState } from 'react';
import { BharatProLogo } from '../BharatProLogo';
import { 
  Search, 
  MapPin, 
  Clock, 
  User, 
  Menu, 
  X, 
  PhoneCall, 
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface HeaderProps {
  activeNav: string;
  onNavigate: (sectionId: string) => void;
  selectedCity: string;
  onOpenLocationModal: () => void;
  onOpenTrackBookingModal: () => void;
  onOpenBookNow: () => void;
  onOpenAuth: () => void;
  onOpenCustomerDashboard: () => void;
  onOpenHelp: () => void;
  onToggleMobileView?: () => void;
  user: any;
  profile: any;
  bookingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeNav,
  onNavigate,
  selectedCity,
  onOpenLocationModal,
  onOpenTrackBookingModal,
  onOpenBookNow,
  onOpenAuth,
  onOpenCustomerDashboard,
  onOpenHelp,
  onToggleMobileView,
  user,
  profile,
  bookingsCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'locations', label: 'Locations' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'blog', label: 'Blog' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)] font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LEFT: Logo & Brand Name + Live Location Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onNavigate('home')}>
              <BharatProLogo size="md" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-[#08213F] tracking-tight leading-tight">
                  Bharat Pro Expert
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#E5A812] tracking-normal">
                  Home Services
                </span>
              </div>
            </div>

            {/* Desktop Location Quick Switcher */}
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs hover:border-blue-400 group"
              title="Click to auto-detect or change service location in India"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[150px]">{selectedCity || 'Detect Location'}</span>
              <span className="text-[10px] text-blue-600 font-semibold underline ml-0.5">Change</span>
            </button>
          </div>

          {/* CENTER & RIGHT: Navigation Links & Actions */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-sm font-semibold transition-all cursor-pointer relative py-1 ${
                    isActive 
                      ? 'text-[#08213F] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#08213F]' 
                      : 'text-slate-600 hover:text-[#08213F]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Track Booking with Search Icon matching reference */}
            <button
              onClick={onOpenTrackBookingModal}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#08213F] transition-colors cursor-pointer"
              title="Track live booking status"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Track Booking</span>
              {bookingsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Book Now Button matching reference */}
            <button
              onClick={onOpenBookNow}
              className="px-6 py-2.5 rounded-full bg-[#062040] hover:bg-[#04162C] text-white text-sm font-bold transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
            >
              Book Now
            </button>

            {/* User Account / Login pill */}
            {user || profile ? (
              <button
                onClick={onOpenCustomerDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                title="Account Settings & Dashboard"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate max-w-[90px]">{profile?.name || user?.displayName || 'Account'}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Login
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenTrackBookingModal}
              className="p-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200"
              title="Track Booking"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-150 shadow-xl">
          {/* City selector on mobile */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLocationModal();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Location: {selectedCity}</span>
            </div>
            <span className="text-[11px] text-blue-600 font-bold">Change</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(item.id);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeNav === item.id 
                    ? 'text-[#0B2A4A] bg-blue-50 font-black' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackBookingModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/80 text-[#0B2A4A] text-xs font-bold flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Track Booking {bookingsCount > 0 && `(${bookingsCount})`}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBookNow();
              }}
              className="w-full py-3 px-4 rounded-full bg-[#0B2A4A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Book Cleaning Service Now</span>
            </button>

            {user || profile ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomerDashboard();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>My Account ({profile?.name || user?.displayName || 'Customer'})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold text-center"
              >
                Customer Sign In / Register
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHelp();
              }}
              className="w-full py-2 px-4 rounded-xl text-slate-500 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help &amp; Support</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
