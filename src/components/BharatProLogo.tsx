import React from 'react';

// Exact Uploaded Official Bharat Pro Expert Brand Logo Image Asset
export const OFFICIAL_LOGO_PATH = '/BharatProExpert.jpg';
export const OFFICIAL_LOGO_FALLBACK = '/BharatProExpert.png';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  className?: string;
  theme?: 'light' | 'dark';
  showText?: boolean;
}

export const BharatProLogo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  // showText is strictly false by default so ONLY the exact uploaded image is rendered as the logo
  showText = false,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  // Proportional sizing - strictly preserving 1:1 aspect ratio with object-contain
  const sizeClasses = {
    xs: 'h-8 w-8 min-h-[32px] min-w-[32px]',
    sm: 'h-10 w-10 min-h-[40px] min-w-[40px]',
    md: 'h-12 w-12 sm:h-14 sm:w-14 min-h-[48px] min-w-[48px]',
    lg: 'h-20 w-20 sm:h-24 sm:w-24 min-h-[80px] min-w-[80px]',
    xl: 'h-28 w-28 sm:h-36 sm:w-36 min-h-[112px] min-w-[112px]',
  }[size];

  // The Exact Uploaded Image - Unaltered, Uncropped, Proportional
  const ImageElement = (
    <img
      src={OFFICIAL_LOGO_PATH}
      alt="Bharat Pro Expert Official Logo"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== OFFICIAL_LOGO_FALLBACK) {
          target.src = OFFICIAL_LOGO_FALLBACK;
        }
      }}
      referrerPolicy="no-referrer"
      className={`${sizeClasses} object-contain aspect-square select-none pointer-events-none rounded-lg`}
      style={{
        objectFit: 'contain',
        aspectRatio: '1 / 1'
      }}
      loading="eager"
    />
  );

  // Default: Render the EXACT uploaded image itself as the logo
  if (!showText) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {ImageElement}
      </div>
    );
  }

  // Optional companion text layout only when explicitly requested
  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {ImageElement}
      <div className="flex flex-col justify-center leading-none">
        <div className="text-lg sm:text-xl font-black tracking-tight flex items-baseline">
          <span className={isDark ? 'text-white' : 'text-[#0B2A4A]'}>Bharat Pro</span>
          <span className="text-amber-500 ml-1.5">Expert</span>
        </div>
        <span className={`text-[9.5px] tracking-[0.22em] uppercase font-black mt-1 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          HOME SERVICES
        </span>
      </div>
    </div>
  );
};

export default BharatProLogo;
