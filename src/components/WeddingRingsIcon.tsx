import React from 'react';

interface WeddingRingsIconProps {
  className?: string;
  logoUrl?: string;
  withSquircleBg?: boolean;
}

/**
 * Official MEPlanner App Icon — 3D Champagne Gold Ribbon "M" + 4-Point Star Sparkle
 * inside a sleek Dark Obsidian Squircle.
 * Source: D:\EKO\FOTO\MEPlan_Brand_Kit\concepts\meplanner_official_logo_sheet.jpg
 */
export const WeddingRingsIcon: React.FC<WeddingRingsIconProps> = ({
  className = 'w-8 h-8',
  logoUrl,
  withSquircleBg = true,
}) => {
  const uid = React.useId().replace(/:/g, '');

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="MEPlanner — My Event Planner"
        className={`${className} object-contain rounded-xl shrink-0`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      className={`${className} shrink-0 select-none`}
      aria-hidden="true"
    >
      <defs>
        {/* Obsidian Squircle Background */}
        <linearGradient
          id={`${uid}-bg-squircle`}
          x1="0"
          y1="0"
          x2="120"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E2433" />
          <stop offset="55%" stopColor="#10141E" />
          <stop offset="100%" stopColor="#080A0F" />
        </linearGradient>

        {/* Subtle Top Glass Gloss */}
        <linearGradient
          id={`${uid}-top-gloss`}
          x1="60"
          y1="4"
          x2="60"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Gold Rim Border */}
        <linearGradient
          id={`${uid}-border-gold`}
          x1="0"
          y1="0"
          x2="120"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF3B8" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8A6412" stopOpacity="0.75" />
        </linearGradient>

        {/* Primary 3D Champagne Gold Ribbon Gradient */}
        <linearGradient
          id={`${uid}-gold-main`}
          x1="20"
          y1="22"
          x2="96"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="32%" stopColor="#E6C35C" />
          <stop offset="68%" stopColor="#C59B27" />
          <stop offset="100%" stopColor="#8A6412" />
        </linearGradient>

        {/* Secondary Shaded Gold Pillar Gradient */}
        <linearGradient
          id={`${uid}-gold-pillar`}
          x1="24"
          y1="96"
          x2="88"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8A6412" />
          <stop offset="48%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#FFF2B2" />
        </linearGradient>

        {/* Deep Gold Fold Shadow */}
        <linearGradient
          id={`${uid}-gold-shadow`}
          x1="30"
          y1="28"
          x2="65"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7A560E" />
          <stop offset="100%" stopColor="#B88E22" />
        </linearGradient>

        <filter
          id={`${uid}-drop`}
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            floodColor="#000000"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      {withSquircleBg !== false && (
        <>
          <rect
            x="4"
            y="4"
            width="112"
            height="112"
            rx="28"
            fill={`url(#${uid}-bg-squircle)`}
          />
          <path
            d="M32 5H88C102.9 5 115 17.1 115 32V52C98 60 79 64 60 64C41 64 22 60 5 52V32C5 17.1 17.1 5 32 5Z"
            fill={`url(#${uid}-top-gloss)`}
          />
          <rect
            x="5"
            y="5"
            width="110"
            height="110"
            rx="27"
            stroke={`url(#${uid}-border-gold)`}
            strokeWidth="2"
          />
        </>
      )}

      {/* 3D Champagne Gold Ribbon "M" + Star Sparkle */}
      <g filter={`url(#${uid}-drop)`}>
        {/* Left Vertical Pillar */}
        <rect
          x="22"
          y="28"
          width="17"
          height="64"
          rx="4"
          fill={`url(#${uid}-gold-pillar)`}
        />

        {/* Right Vertical Pillar */}
        <rect
          x="74"
          y="28"
          width="16"
          height="58"
          rx="4"
          fill={`url(#${uid}-gold-shadow)`}
        />

        {/* Left-to-Center Diagonal Ribbon Fold */}
        <path
          d="M22 28H37L59 74H45L22 28Z"
          fill={`url(#${uid}-gold-main)`}
        />

        {/* Center-to-Right Ascending Ribbon Fold */}
        <path
          d="M45 74L69 28H86L59 74H45Z"
          fill={`url(#${uid}-gold-pillar)`}
        />

        {/* 4-Point Celebration Star Sparkle Overlapping Bottom-Right */}
        <path
          d="M84 48C84 65 88.5 69.5 105 69.5C88.5 69.5 84 74 84 91C84 74 79.5 69.5 63 69.5C79.5 69.5 84 65 84 48Z"
          fill={`url(#${uid}-gold-main)`}
        />
      </g>
    </svg>
  );
};
