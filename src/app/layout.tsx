import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  // Without metadataBase, the relative `alternates.canonical` values on the
  // Help Center, privacy, and terms pages resolve against localhost at build
  // time — which publishes wrong canonical tags and breaks the SEO value the
  // help articles exist for.
  metadataBase: new URL(SITE_URL),
  title: 'DuQana – POS System for Kenyan Businesses',
  description:
    'DuQana is a powerful Point-of-Sale system built for Kenyan dukas and retail shops. Manage inventory, accept M-Pesa, and grow your business.',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_KE',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
