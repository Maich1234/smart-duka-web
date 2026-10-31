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
    }];
  },
  async headers() {
    const sources = process.env.VERCEL_ENV === 'preview'
      ? ['/:path*']
      : ['/owner/:path*', '/staff/:path*', '/admin/:path*', '/onboarding/:path*', '/embed/:path*', '/r/:path*', '/q/:path*', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    return sources.map((source) => ({ source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }));
  },
};

export default withSerwist(nextConfig);
