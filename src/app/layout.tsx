import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:
    'The Wedding of Eko Agung & Jessica — Undangan Digital & Wedding Readiness Tracker (18–19 Des 2026 Semarang)',
  description:
    'All-in-One Wedding Planner, Readiness Tracker & Undangan Pernikahan Digital Resmi Briptu Eko Agung Krisdianto, S.Kom. & Jessica Anastasia, S.E. — Biston 18 Desember 2026 & Pemberkatan 19 Desember 2026 di Semarang.',
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
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
