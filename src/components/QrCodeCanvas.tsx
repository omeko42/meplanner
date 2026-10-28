'use client';

import React, { useMemo } from 'react';
import {
  createQRCodeMatrix,
  QRErrorCorrectLevelKey,
  renderQRCodeToDataUrl,
} from '@/lib/qrcodeGenerator';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';

export interface QrCodeCanvasProps {
  text: string;
  size?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: QRErrorCorrectLevelKey;
  quietZone?: number;
  className?: string;
  centerBadgeText?: string;
  showBrandLogo?: boolean;
}

export const QrCodeCanvas: React.FC<QrCodeCanvasProps> = ({
  text,
  size = 200,
  colorDark = '#1c1917',
  colorLight = '#ffffff',
  correctLevel = 'M',
  quietZone = 2,
  className = '',
  showBrandLogo = true,
}) => {
  const matrix = useMemo(
    () => createQRCodeMatrix(text || 'https://meplanner.vercel.app', correctLevel),
    [text, correctLevel]
  );

  const moduleCount = matrix.length;
  const totalModules = moduleCount + quietZone * 2;
  const logoBoxPx = Math.max(16, Math.round(size * 0.22));
  const logoIconPx = Math.max(12, Math.round(size * 0.16));

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
      {showBrandLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-lg bg-white border border-[#D4AF37]/80 shadow-xs flex items-center justify-center"
            style={{ width: logoBoxPx, height: logoBoxPx }}
          >
            <div style={{ width: logoIconPx, height: logoIconPx }}>
              <WeddingRingsIcon className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { renderQRCodeToDataUrl };
