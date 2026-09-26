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
    sm: { width: 30, height: 34 },
    md: { width: 38, height: 44 },
    lg: { width: 48, height: 56 },
    xl: { width: 64, height: 74 },
  }[size];

  const ShieldIcon = (
    <div 
      className="relative flex items-center justify-center shrink-0 drop-shadow-sm"
      style={{ width: shieldDimensions.width, height: shieldDimensions.height }}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0B050" />
            <stop offset="50%" stopColor="#B8892E" />
            <stop offset="100%" stopColor="#8C631B" />
          </linearGradient>
          <linearGradient id="shieldCharcoal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A261F" />
            <stop offset="100%" stopColor="#1C1C1E" />
          </linearGradient>
        </defs>

        {/* Shield Outer Rim */}
        <path
          d="M50 4 L88 20 C88 64 68 96 50 114 C32 96 12 64 12 20 Z"
          fill="url(#shieldCharcoal)"
          stroke="url(#shieldGold)"
          strokeWidth="3"
        />

        {/* Inner Shield Inset */}
        <path
          d="M50 16 L78 30 C78 62 64 86 50 102 C36 86 22 62 22 30 Z"
          fill="#1C1C1E"
          stroke="url(#shieldGold)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Center Spark / Bolt */}
        <path
          d="M48 36 L36 58 L48 58 L46 78 L64 52 L52 52 Z"
          fill="url(#shieldGold)"
        />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{ShieldIcon}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-1 ${className}`}>
        {ShieldIcon}
        <div className="flex flex-col items-center">
          <div className="text-base sm:text-lg font-black tracking-tight leading-tight">
            <span className={isDark ? "text-white" : "text-[#1C1C1E]"}>Bharat Pro </span>
            <span className="text-[#B8892E]">Expert</span>
          </div>
          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${isDark ? 'text-gray-400' : 'text-[#8E8E93]'}`}>
            CLEANING SERVICES
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {ShieldIcon}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black tracking-tight flex items-baseline ${
          size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg sm:text-[21px]'
        }`}>
          <span className={isDark ? "text-white" : "text-[#1C1C1E]"}>Bharat Pro </span>
          <span className="text-[#B8892E] ml-1">Expert</span>
        </div>
        <span className={`text-[9px] tracking-[0.22em] uppercase font-extrabold mt-0.5 ${
          isDark ? 'text-gray-400' : 'text-[#8E8E93]'
        }`}>
          CLEANING SERVICES
        </span>
      </div>
    </div>
  );
};
