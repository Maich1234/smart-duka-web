import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { SOCIAL_IMAGE } from '@/lib/seo';
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
  title: 'DuQana | POS and Inventory Software for Kenyan Shops',
  description:
    'Manage shop sales, inventory, M-Pesa payments, staff and customer credit with DuQana, built for Kenyan retail businesses.',
  verification: {
    // Use only Google's supplied token(s), never a placeholder or full HTML
    // tag. Comma-separated values retain verification for multiple owners.
    google: process.env.GOOGLE_SITE_VERIFICATION?.split(',').map(token => token.trim()).filter(Boolean),
  },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_KE',
    images: [SOCIAL_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE.url] },
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
