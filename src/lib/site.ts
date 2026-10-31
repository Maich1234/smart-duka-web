/**
 * Where this app is deployed.
 *
 * Needed as an absolute URL in a few places that can't work with a relative
 * one: Next.js `metadataBase` (which resolves every `alternates.canonical` and
 * Open Graph URL), the sitemap, and robots.txt.
 *
 * Canonical URLs always identify the production site, including in previews.
 * `NEXT_PUBLIC_SITE_URL` accepts a custom HTTPS production domain. Vercel injects
 * `VERCEL_PROJECT_PRODUCTION_URL` automatically, which keeps this right if the
 * project later moves to a custom domain without anyone remembering to update
 * a constant.
 */
import { isLocalUrl } from './isLocalUrl';

// A localhost value here (e.g. NEXT_PUBLIC_SITE_URL left over from a local
// .env copied into the wrong Vercel project) must never leak into canonical
// tags, the sitemap, or robots.txt on a real deployment.
function resolveSiteUrl(): string {
  for (const value of [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (!value) continue;
    try {
      const url = new URL(value.includes('://') ? value : `https://${value}`);
      if (url.protocol !== 'https:' || isLocalUrl(url.origin) || url.hostname.endsWith('.vercel.app') || url.username || url.password) continue;
      // The apex permanently redirects to www in Vercel. Publish the final
      // destination in canonical tags, structured data and the sitemap.
      if (url.hostname === 'duqana.co.ke') url.hostname = 'www.duqana.co.ke';
      return url.origin;
    } catch { /* Ignore invalid deployment configuration. */ }
  }
  return 'https://www.duqana.co.ke';
}

/** No trailing slash — callers append paths beginning with "/". */
export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = 'DuQana';
export const SUPPORT_EMAIL = 'info@duqana.co.ke';
export const SUPPORT_PHONE = '+254107596454';
