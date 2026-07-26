import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Marketing and help pages are crawlable; everything behind a login is not.
 *
 * `/r/` (public receipts) is excluded because those URLs are per-sale tokens —
 * they're meant to be opened by the one customer who scanned the receipt, not
 * indexed. They carry shop and transaction detail, so leaving them crawlable
 * would publish a shop's sales one receipt at a time.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/owner/', '/staff/', '/admin/', '/login', '/register', '/onboarding', '/r/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
