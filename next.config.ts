import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // A cached service worker fighting the dev server's own hot-reloading is
  // worse than no offline support while iterating locally.
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: '/help/bulk-product-import',
      destination: '/help/excel-product-import',
      permanent: true,
    }, {
      source: '/help/smart-duka-ai',
      destination: '/help/duqana-ai',
      permanent: true,
    }];
  },
  async headers() {
    const sources = process.env.VERCEL_ENV === 'preview'
      ? ['/:path*']
      : ['/owner/:path*', '/staff/:path*', '/admin/:path*', '/onboarding/:path*', '/embed/:path*', '/r/:path*', '/q/:path*', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      ...sources.map((source) => ({ source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
      ...['/embed/:path*', '/q/:path*'].map((source) => ({
        source,
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      })),
    ];
  },
};

export default withSerwist(nextConfig);
