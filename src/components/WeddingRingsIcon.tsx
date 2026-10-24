import React from 'react';

interface WeddingRingsIconProps {
  className?: string;
  logoUrl?: string;
}

export const WeddingRingsIcon: React.FC<WeddingRingsIconProps> = ({
  className = 'w-6 h-6',
  logoUrl,
}) => {
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="My Event Planner Logo"
        className={`${className} object-contain rounded-md`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Royal Crest / Crown Header */}
      <path
        d="M21 15L26.5 20L32 12.5L37.5 20L43 15L41 22H23L21 15Z"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Executive Event Calendar & Stage Shield Frame */}
      <rect
        x="12"
        y="22"
        width="40"
        height="32"
        rx="8"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      {/* Calendar Top Header Divider */}
      <path
        d="M12 30H52"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* 4-Point Royal Star Sparkle Centerpiece */}
      <path
        d="M32 33L34.4 39.6L41 42L34.4 44.4L32 51L29.6 44.4L23 42L29.6 39.6L32 33Z"
        fill="currentColor"
      />
      {/* Corner Accents */}
      <circle cx="19" cy="26" r="1.4" fill="currentColor" />
      <circle cx="45" cy="26" r="1.4" fill="currentColor" />
    </svg>
  );
};
