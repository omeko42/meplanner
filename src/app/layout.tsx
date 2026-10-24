import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Great_Vibes } from 'next/font/google';
import './globals.css';

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
    'My Event Planner — All-in-One Event Planner & Digital Invitation Suite',
  description:
    'Platform Manajemen Acara & Undangan Digital Terpadu (Wedding, Birthday, Graduation, Meeting, Gala Dinner — Readiness Tracker, Checklist, Budget, CRM Tamu WA & Studio Undangan).',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
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
      </body>
    </html>
  );
}
