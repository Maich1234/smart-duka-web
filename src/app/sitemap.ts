import type { MetadataRoute } from 'next';
import { HELP_TOPICS } from '@/lib/helpTopics';
import { SITE_URL } from '@/lib/site';

/**
 * Sitemap for the public marketing pages and every Help Center article.
 *
 * The Help Center was moved onto this app partly so help articles become an
 * organic acquisition channel — that only pays off if they're crawlable, so
 * each topic is listed here rather than leaving discovery to internal links.
 *
 * Dashboard, admin, and auth routes are deliberately excluded: they're
 * authenticated and have nothing to offer a search engine.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/help`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.4 },
    // Listed on purpose: Google Play requires this URL to be publicly
    // reachable, and a user looking for it should be able to find it.
    { url: `${SITE_URL}/delete-account`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const helpArticles: MetadataRoute.Sitemap = HELP_TOPICS.map((topic) => ({
    url: `${SITE_URL}/help/${topic.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...helpArticles];
}
