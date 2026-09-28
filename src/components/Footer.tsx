import React from 'react';
import { BharatProLogo } from './BharatProLogo';
import { Phone, Mail, MapPin, ShieldCheck, HeartHandshake, HelpCircle, Lock } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data';

interface FooterProps {
  onOpenPartner: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPartner, onOpenHelp, onOpenAdmin }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 font-['Inter',sans-serif] border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <BharatProLogo size="md" variant="horizontal" />
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier technology-driven home deep cleaning &amp; sanitization platform. 100% verified professionals, Diversey hospital-grade eco-certified solutions, and upfront transparent pricing.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-semibold">ISO 9001:2015 Hygiene Protocol Compliant</span>
            </div>
          </div>

          {/* Cleaning Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-['Outfit']">
              Popular Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white transition-colors cursor-pointer">Bathroom Intense Deep Cleaning</li>
              <li className="hover:text-white transition-colors cursor-pointer">Full Home Sanitization &amp; Wash</li>
              <li className="hover:text-white transition-colors cursor-pointer">Fabric &amp; Leather Sofa Shampooing</li>
              <li className="hover:text-white transition-colors cursor-pointer">Kitchen Degreasing &amp; Chimney Descaling</li>
              <li className="hover:text-white transition-colors cursor-pointer">Underground &amp; Overhead Water Tank Cleaning</li>
            </ul>
          </div>

          {/* Operating Hubs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-['Outfit']">
              Operating Cities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Gurugram (Cyber City, Golf Course Rd)</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Delhi NCR (South Delhi, Saket, Dwarka)</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Noida (Sector 62, 50, 137, Expressway)</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Mumbai (Bandra, Andheri, Powai)</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Bengaluru (Indiranagar, Whitefield, Koramangala)</li>
            </ul>
          </div>

          {/* Customer Care & Professional Network */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-['Outfit']">
                Help &amp; Support
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Helpline: <a href="tel:8920252647" className="hover:text-white text-slate-300 font-semibold">8920252647</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="mailto:support@bharatproexpert.com" className="hover:text-white text-slate-300">
                    support@bharatproexpert.com
                  </a>
                </div>
                <button
                  onClick={onOpenHelp}
                  className="mt-1 flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer text-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>View Help Center &amp; FAQs</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 font-['Outfit']">
                Portals &amp; Staff Access
              </h4>
              <button
                onClick={onOpenPartner}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>Partner with Us (Join as Expert)</span>
              </button>
              <button
                onClick={onOpenAdmin}
                className="w-full py-2 px-3 rounded-xl bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-blue-800/70"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Admin Panel Portal</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Bharat Pro Expert Home Services Pvt. Ltd. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="hover:text-slate-200 cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-slate-200 cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-slate-200 cursor-pointer">Safety Protocols</span>
            <span>&bull;</span>
            <button
              onClick={onOpenAdmin}
              className="text-blue-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-semibold transition-colors bg-slate-800/90 hover:bg-blue-900/60 px-3 py-1 rounded-md border border-slate-700"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
