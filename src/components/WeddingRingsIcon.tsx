import React from 'react';

interface WeddingRingsIconProps {
  className?: string;
}

export const WeddingRingsIcon: React.FC<WeddingRingsIconProps> = ({
  className = 'w-6 h-6',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Left Interlocking Ring */}
      <circle
        cx="24"
        cy="36"
        r="13"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Right Interlocking Ring */}
      <circle
        cx="40"
        cy="32"
        r="13"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Diamond Solitaire on Right Ring */}
      <polygon
        points="40,10 45,15.5 40,19.5 35,15.5"
        fill="currentColor"
      />
      {/* Subtle Sparkle Rays */}
      <path
        d="M40 5V8M32 9L34 11M48 9L46 11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
