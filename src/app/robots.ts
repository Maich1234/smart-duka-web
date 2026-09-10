import type { MetadataRoute } from 'next';

// Nothing here is meant for search engines: the dashboard is behind login,
// and the public utility routes (/r/ receipts, /embed/ webview) are
// unauthenticated but carry per-token shop/sale data that isn't meant to be
// indexed either. The marketing/help pages that used to be crawlable here
// now live in the smart-duka-marketing project.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
