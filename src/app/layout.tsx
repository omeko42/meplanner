import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:
    'My Wedding Manager — All-in-One Wedding Planner & Digital Invitation',
  description:
    'Aplikasi Manajemen Kesiapan Pernikahan Terpadu (Readiness Tracker, Checklist Bertahap, Budget & Vendor, Generator Undangan WA) & Undangan Digital Online.',
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
    <html lang="id">
      <body className={`${inter.className} min-h-screen antialiased bg-[#FAF8F5] text-stone-800`}>
        {children}
      </body>
    </html>
  );
}
