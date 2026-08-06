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
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'https://smart-duka-web-delta.vercel.app';
}

/** No trailing slash — callers append paths beginning with "/". */
export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = 'Dukana';
export const SUPPORT_EMAIL = 'info@dukana.app';
export const SUPPORT_PHONE = '+254107596454';
