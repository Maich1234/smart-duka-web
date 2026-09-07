/**
 * Where this app is deployed.
 *
 * Needed as an absolute URL in a few places that can't work with a relative
 * one: Next.js `metadataBase` (which resolves every `alternates.canonical` and
 * Open Graph URL), the sitemap, and robots.txt.
 *
 * `NEXT_PUBLIC_SITE_URL` wins so preview deployments describe themselves
 * correctly instead of claiming to be production. Vercel injects
 * `VERCEL_PROJECT_PRODUCTION_URL` automatically, which keeps this right if the
 * project later moves to a custom domain without anyone remembering to update
 * a constant.
 */
import { isLocalUrl } from './isLocalUrl';

// A localhost value here (e.g. NEXT_PUBLIC_SITE_URL left over from a local
// .env copied into the wrong Vercel project) must never leak into canonical
// tags, the sitemap, or robots.txt on a real deployment.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && !isLocalUrl(explicit)) return explicit.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'https://duqana.co.ke';
}

/** No trailing slash — callers append paths beginning with "/". */
export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = 'DuQana';
export const SUPPORT_EMAIL = 'info@duqana.co.ke';
export const SUPPORT_PHONE = '+254107596454';
