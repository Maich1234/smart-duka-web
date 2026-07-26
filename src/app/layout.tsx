import type { Metadata } from 'next';
import Providers from './providers';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  // Without metadataBase, the relative `alternates.canonical` values on the
  // Help Center, privacy, and terms pages resolve against localhost at build
  // time — which publishes wrong canonical tags and breaks the SEO value the
  // help articles exist for.
  metadataBase: new URL(SITE_URL),
  title: 'Smart Duka – POS System for Kenyan Businesses',
  description:
    'Smart Duka is a powerful Point-of-Sale system built for Kenyan dukas and retail shops. Manage inventory, accept M-Pesa, and grow your business.',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_KE',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
