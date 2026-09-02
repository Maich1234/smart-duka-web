import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – POS System`,
    short_name: SITE_NAME,
    description: 'Manage inventory, sales, and M-Pesa payments for your duka.',
    // Self-resolves to the right screen for every case: the dashboard layout
    // already bounces staff on an owner route to /staff/dashboard and
    // unauthenticated users to /login, so one start_url covers owner, staff,
    // and logged-out launches without any auth changes here.
    start_url: '/owner/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F766E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
