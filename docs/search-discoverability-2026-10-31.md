# Search discoverability, 31 October 2026

## Evidence and limits

Live checks returned HTTP 200 for the www homepage, About, Help, robots.txt and sitemap.xml. The apex is configured in Vercel to redirect permanently (308) to www; both domains are verified and custom domains do not require Vercel sign-in. Public HTML had titles, descriptions, canonical links and readable content without a noindex directive. Search checks did not surface the site. This does not establish Google's index status or the reason for exclusion; URL Inspection and Page indexing in the owner's Search Console are authoritative. No claim of an indexing penalty or a proven Googlebot firewall block is made.

PR18 was merged and Vercel's production deployment at main 95109fe became READY during this review. The earlier live content preceded that release.

## Changes

- Brand-first homepage title and explicit DuQana introduction in rendered content.
- Preferred www canonical origin even when the site environment variable uses the redirecting apex, with the same host used in the sitemap and structured data.
- Public-page index/follow metadata, retaining preview noindex/nofollow and existing private/document noindex headers.
- Connected Organization, WebSite, WebPage and WebApplication structured data with the real brand, logo, public contact information and supported features. No invented rating, testimonial, price, Play Store listing or social account.
- Optional GOOGLE_SITE_VERIFICATION metadata. It emits only tokens supplied by Google; comma-separated tokens support multiple existing owners. An absent variable emits no placeholder tag. This code alone does not verify ownership or submit a sitemap.

## Owner action from a phone

1. Open https://search.google.com/search-console and use the Google account that should own the property.
2. Open the existing property if it exists. Otherwise add the URL-prefix property https://www.duqana.co.ke/ and select HTML tag verification. A Domain property for duqana.co.ke is also valid but requires the supplied DNS TXT record at the domain's authoritative DNS provider.
3. For HTML verification, use Google's actual content value as GOOGLE_SITE_VERIFICATION in this Vercel project's Production environment, deploy, check that the tag appears in the live homepage head, then choose Verify in Search Console. Preserve any other owner's verification tokens.
4. Submit https://www.duqana.co.ke/sitemap.xml in Sitemaps. An existing submitted sitemap does not need duplicate submission.
5. Inspect https://www.duqana.co.ke/, run Test live URL, and request indexing if eligible. Repeat for /about, /contact and /help when appropriate.
6. Review Page indexing for the actual reason if a URL is excluded. Compare Google's chosen canonical and the live response. If Google reports a crawl block, investigate that specific request rather than disabling site protection globally.

Google says crawling can take days to weeks and neither a request nor a sitemap guarantees indexing or rankings. Source: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl. Brand site-name guidance: https://developers.google.com/search/docs/appearance/site-names. Ownership methods: https://support.google.com/webmasters/answer/9008080.

This work does not access a signed-in Search Console property, submit URLs or release production changes. Merge the companion PR before attempting the optional HTML token verification. Useful next evidence is the homepage URL Inspection result, not repeated general searches alone.

## Independent verification

Production build and TypeScript validation passed. An actual local production server served all 21 sitemap URLs with HTTP 200, nonempty titles/descriptions, one H1 and matching canonical paths/host. Parsed homepage JSON-LD contained the brand/site/app graph. Robots allowed public crawling, private/dashboard and quotation responses retained noindex headers, logo/favicon/social-image requests returned 200, and the old import-guide URL redirected with 308. With no Google token configured, no invented verification meta tag was emitted. The actual URL resolver and metadata function were also evaluated for apex/www/unset/invalid preview-domain configuration and production/preview index settings. No external provider writes or customer data changes occurred.
