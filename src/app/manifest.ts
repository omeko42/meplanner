import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MEPlanner — My Event Planner & Digital Invitation Suite',
    short_name: 'MEPlanner',
    description:
      'Platform persiapan acara, manajemen tamu VIP, anggaran RAB, checklist panitia & undangan digital eksklusif.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF8F5',
    theme_color: '#C5A059',
    lang: 'id',
    dir: 'ltr',
    categories: ['lifestyle', 'productivity', 'business'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
