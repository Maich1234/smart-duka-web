import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Duka – POS System for Kenyan Businesses',
  description: 'Smart Duka is a powerful Point-of-Sale system built for Kenyan dukas and retail shops. Manage inventory, accept M-Pesa, and grow your business.',
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
