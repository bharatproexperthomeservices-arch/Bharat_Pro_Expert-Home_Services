import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  className?: string;
  theme?: 'light' | 'dark';
}

export const BharatProLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  className = '',
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  
  // Shield dimensions
  const shieldDimensions = {
    sm: { width: 28, height: 32 },
    md: { width: 36, height: 42 },
    lg: { width: 48, height: 56 },
    xl: { width: 64, height: 74 },
  }[size];

  const ShieldIcon = (
    <div 
      className="relative flex items-center justify-center shrink-0 drop-shadow-md"
      style={{ width: shieldDimensions.width, height: shieldDimensions.height }}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Gold metallic frame gradient */}
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9D976" />
            <stop offset="35%" stopColor="#E0B050" />
            <stop offset="70%" stopColor="#B8892E" />
            <stop offset="100%" stopColor="#8A5A12" />
          </linearGradient>

          {/* Charcoal shield core */}
          <linearGradient id="shieldCharcoal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252528" />
            <stop offset="100%" stopColor="#121214" />
          </linearGradient>

          {/* Tricolour bands */}
          <linearGradient id="saffronGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E07B1A" />
          </linearGradient>

          <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D9D9DE" />
          </linearGradient>

          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2BB64C" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
        </defs>

        {/* Shield Outer Gold Rim */}
        <path
          d="M50 4 L88 20 C88 64 68 96 50 114 C32 96 12 64 12 20 Z"
          fill="url(#goldBorder)"
        />

        {/* Shield Inner Charcoal Background */}
        <path
          d="M50 9 L83 23 C83 62 65 91 50 107 C35 91 17 62 17 23 Z"
          fill="url(#shieldCharcoal)"
        />

        {/* Stylized 'B' with Tricolour horizontal bands */}
        {/* Top Band: Saffron */}
        <path
          d="M34 32 H54 C62 32 67 36 67 43 C67 48 64 52 58 54 H34 V32 Z"
          fill="url(#saffronGradient)"
        />
        <circle cx="48" cy="43" r="4.5" fill="#1C1C1E" opacity="0.9" />

        {/* Middle Band: White / Silver */}
        <path
          d="M34 51 H58 L54 62 H34 V51 Z"
          fill="url(#silverGradient)"
        />

        {/* Bottom Band: Tricolour Green */}
        <path
          d="M34 58 H56 C64 58 70 63 70 71 C70 79 63 84 53 84 H34 V58 Z"
          fill="url(#greenGradient)"
        />
        <circle cx="50" cy="71" r="5.5" fill="#1C1C1E" opacity="0.9" />

        {/* Vertical stem connector in metallic gold */}
        <rect x="34" y="32" width="6" height="52" rx="2" fill="url(#goldBorder)" />

        {/* TM superscript mark */}
        <text
          x="78"
          y="28"
          fontSize="9"
          fill="#D4A24E"
          fontWeight="700"
          fontFamily="system-ui"
        >
          TM
        </text>
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{ShieldIcon}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-1.5 ${className}`}>
        {ShieldIcon}
        <div>
          <span className="block text-sm sm:text-base font-extrabold tracking-wider bg-gradient-to-r from-[#E07B1A] via-[#9E9EA7] to-[#1F8A3B] bg-clip-text text-transparent font-['Outfit']">
            BHARAT PRO EXPERT
          </span>
          <span className="block text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#B8892E] font-semibold">
            Home Services
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {ShieldIcon}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold font-['Outfit'] tracking-tight ${
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg sm:text-xl'
          } ${isDark ? 'text-white' : 'text-[#1C1C1E]'}`}>
            Bharat <span className="bg-gradient-to-r from-[#B8892E] to-[#D4A24E] bg-clip-text text-transparent">Pro</span> Expert
          </span>
          <span className="text-[9px] font-bold text-[#D4A24E] border border-[#D4A24E]/40 px-1 py-0.2 rounded">
            TM
          </span>
        </div>
        <span className="text-[10px] sm:text-xs tracking-[0.16em] uppercase font-semibold text-[#8E8E93]">
          Home Cleaning &amp; Expert Services
        </span>
      </div>
    </div>
  );
};
