import React from 'react';

interface WeddingRingsIconProps {
  className?: string;
  logoUrl?: string;
  withSquircleBg?: boolean;
}

export const WeddingRingsIcon: React.FC<WeddingRingsIconProps> = ({
  className = 'w-6 h-6',
  logoUrl,
  withSquircleBg = false,
}) => {
  const uid = React.useId().replace(/:/g, '');

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="MEPlan — My Event Planner"
        className={`${className} object-contain rounded-md`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={withSquircleBg ? '0 0 120 120' : '16 8 94 88'}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Squircle Background */}
        <linearGradient
          id={`${uid}-bg-squircle`}
          x1="0"
          y1="0"
          x2="120"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#131629" />
          <stop offset="100%" stopColor="#090A14" />
        </linearGradient>

        <linearGradient
          id={`${uid}-border-glow`}
          x1="0"
          y1="0"
          x2="120"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FB7185" stopOpacity="0.6" />
        </linearGradient>

        {/* 1. Left Vertical Pillar Gradient (Violet to Deep Royal Blue) */}
        <linearGradient
          id={`${uid}-pillar-left`}
          x1="28"
          y1="30"
          x2="28"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        {/* 2. Left-to-Center Fold Gradient (Deep Indigo Shadow Ribbon) */}
        <linearGradient
          id={`${uid}-fold-left`}
          x1="34"
          y1="34"
          x2="62"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3730A3" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>

        {/* 3. Right Vertical Pillar Gradient (Blue to Warm Coral/Peach) */}
        <linearGradient
          id={`${uid}-pillar-right`}
          x1="84"
          y1="34"
          x2="84"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>

        {/* 4. Center-to-Right Ascending Check Ribbon (Vivid Violet to Electric Cyan) */}
        <linearGradient
          id={`${uid}-fold-right`}
          x1="48"
          y1="78"
          x2="90"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>

        {/* 5. 4-Point Celebration Sparkle Gradient */}
        <linearGradient
          id={`${uid}-sparkle`}
          x1="82"
          y1="12"
          x2="106"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FDA4AF" />
        </linearGradient>

        <filter id={`${uid}-shadow`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {withSquircleBg && (
        <>
          <rect x="4" y="4" width="112" height="112" rx="28" fill={`url(#${uid}-bg-squircle)`} />
          <rect
            x="5"
            y="5"
            width="110"
            height="110"
            rx="27"
            stroke={`url(#${uid}-border-glow)`}
            strokeWidth="2"
          />
        </>
      )}

      {/* 3D Origami Ribbon "M" */}
      <g filter={`url(#${uid}-shadow)`}>
        {/* Back Layer: Left-to-Center Diagonal Fold */}
        <path d="M28 32L63 73L51 81L22 44L28 32Z" fill={`url(#${uid}-fold-left)`} />

        {/* Right Vertical Pillar (Coral Bottom to Blue Top) */}
        <rect x="74" y="32" width="18" height="60" rx="7" fill={`url(#${uid}-pillar-right)`} />

        {/* Left Vertical Pillar (Violet Top to Indigo Bottom) */}
        <rect x="20" y="32" width="18" height="60" rx="7" fill={`url(#${uid}-pillar-left)`} />

        {/* Front Hero Layer: Ascending Cyan Checkmark Ribbon */}
        <path
          d="M48.5 76.5L74.5 35.5C76.5 32.3 80 32 83.5 32H85C89.4 32 92 35.5 92 39.5C92 41.5 91.2 43.4 89.8 45.2L62.8 81.2C59.2 86 52 86 48.5 81.2C46.5 78.5 46.8 75.2 48.5 76.5Z"
          fill={`url(#${uid}-fold-right)`}
        />
      </g>

      {/* Iconic 4-Point Event Sparkle (Top Right) */}
      <path
        d="M94 12C94 20.5 97.5 24 106 24C97.5 24 94 27.5 94 36C94 27.5 90.5 24 82 24C90.5 24 94 20.5 94 12Z"
        fill={`url(#${uid}-sparkle)`}
      />
    </svg>
  );
};
