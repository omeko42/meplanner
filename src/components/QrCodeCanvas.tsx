'use client';

import React, { useMemo } from 'react';
import {
  createQRCodeMatrix,
  QRErrorCorrectLevelKey,
  renderQRCodeToDataUrl,
} from '@/lib/qrcodeGenerator';

export interface QrCodeCanvasProps {
  text: string;
  size?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: QRErrorCorrectLevelKey;
  quietZone?: number;
  className?: string;
  centerBadgeText?: string;
}

export const QrCodeCanvas: React.FC<QrCodeCanvasProps> = ({
  text,
  size = 200,
  colorDark = '#1c1917',
  colorLight = '#ffffff',
  correctLevel = 'M',
  quietZone = 2,
  className = '',
  centerBadgeText,
}) => {
  const matrix = useMemo(
    () => createQRCodeMatrix(text || 'https://meplanner.vercel.app', correctLevel),
    [text, correctLevel]
  );

  const moduleCount = matrix.length;
  const totalModules = moduleCount + quietZone * 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${totalModules} ${totalModules}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className="w-full h-full rounded-xl"
        role="img"
        aria-label={`QR Code: ${text}`}
      >
        <rect width="100%" height="100%" fill={colorLight} />
        {matrix.map((row, r) =>
          row.map((isDark, c) =>
            isDark ? (
              <rect
                key={`${r}-${c}`}
                x={c + quietZone}
                y={r + quietZone}
                width={1}
                height={1}
                fill={colorDark}
              />
            ) : null
          )
        )}
      </svg>
      {centerBadgeText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="px-1.5 py-0.5 rounded-md bg-white border border-[#D4AF37] text-[#8B6914] font-serif font-extrabold text-[10px] shadow-xs">
            {centerBadgeText}
          </span>
        </div>
      )}
    </div>
  );
};

export { renderQRCodeToDataUrl };
