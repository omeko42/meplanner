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
  title:
    'MEPlanner — My Event Planner & Digital Invitation Suite',
  description:
    'Platform Persiapan Acara & Undangan Digital Eksklusif (Wedding, Birthday, Graduation, Rapat & Gala Dinner).',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'Undangan Pernikahan Agung & Selo • MEPlanner Digital Invitation',
    description:
      'Sabtu, 19 Desember 2026 • GKJ Immanuel Ungaran, Semarang. Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.',
    type: 'website',
    images: [
      {
        url: 'https://gwoyalvivfemaeacbyvi.supabase.co/storage/v1/object/public/wedding-media/photos/hero_slide_hero_slide_1792846417331_1_h6da_5_43TUZpYY1qKbBk.webp',
        width: 1200,
        height: 630,
        alt: 'Undangan Pernikahan Agung & Selo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Undangan Pernikahan Agung & Selo • MEPlanner Digital Invitation',
    description:
      'Sabtu, 19 Desember 2026 • GKJ Immanuel Ungaran, Semarang.',
    images: [
      'https://gwoyalvivfemaeacbyvi.supabase.co/storage/v1/object/public/wedding-media/photos/hero_slide_hero_slide_1792846417331_1_h6da_5_43TUZpYY1qKbBk.webp',
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
