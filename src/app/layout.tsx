import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { MobileTouchTooltipBridge } from '@/components/InfoTooltip';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF8F5',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://meplanner.vercel.app'),
  title:
    'MEPlanner — My Event Planner & Digital Invitation Suite',
  description:
    'Platform Persiapan Acara, Manajemen Tamu VIP & Undangan Digital Eksklusif (Pernikahan, Ulang Tahun, Wisuda, Rapat & Gala Dinner).',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icon-192x192.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'MEPlanner — My Event Planner & Digital Invitation Suite',
    description:
      'Platform Persiapan Acara, Manajemen Tamu VIP & Undangan Digital Eksklusif (Pernikahan, Ulang Tahun, Wisuda, Rapat & Gala Dinner).',
    url: 'https://meplanner.vercel.app',
    siteName: 'MEPlanner — My Event Planner',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://meplanner.vercel.app/og-meplanner-logo-m-light.jpg',
        secureUrl: 'https://meplanner.vercel.app/og-meplanner-logo-m-light.jpg',
        type: 'image/jpeg',
        width: 800,
        height: 800,
        alt: 'MEPlanner — My Event Planner & Digital Invitation Suite',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'MEPlanner — My Event Planner & Digital Invitation Suite',
    description:
      'Platform Persiapan Acara, Manajemen Tamu VIP & Undangan Digital Eksklusif (Pernikahan, Ulang Tahun, Wisuda, Rapat & Gala Dinner).',
    images: [
      'https://meplanner.vercel.app/og-meplanner-logo-m-light.jpg',
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body
        style={{ fontFamily: 'var(--font-inter)' }}
        className="min-h-screen antialiased bg-[#FAF8F5] text-stone-800"
      >
        {children}
        <Toaster richColors position="top-center" closeButton />
        <MobileTouchTooltipBridge />
      </body>
    </html>
  );
}
