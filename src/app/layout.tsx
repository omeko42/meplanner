import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Great_Vibes } from 'next/font/google';
import './globals.css';
import { MobileTouchTooltipBridge } from '@/components/InfoTooltip';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-serif',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
});

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
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
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
    <html lang="id" className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased bg-[#FAF8F5] text-stone-800`}>
        {children}
        <MobileTouchTooltipBridge />
      </body>
    </html>
  );
}
