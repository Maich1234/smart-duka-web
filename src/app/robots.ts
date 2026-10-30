import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Marketing and help pages are crawlable; everything behind a login is not.
 *
 * Customer document URLs are omitted from the sitemap and carry noindex
 * metadata/headers. Allowing crawl lets search engines read that instruction.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: process.env.VERCEL_ENV === 'preview' ? undefined : '/',
        disallow: process.env.VERCEL_ENV === 'preview' ? ['/'] : ['/owner/', '/staff/', '/admin/', '/api/', '/embed/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/onboarding'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
