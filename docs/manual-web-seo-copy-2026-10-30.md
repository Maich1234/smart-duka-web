# Web copy and SEO review, 30 October 2026

## Changes

Removed em dashes from owned UI strings, JSX text, template strings and empty-value placeholders across marketing and dashboard screens. A TypeScript syntax-tree scan avoids changing comments or customer-entered business data. A repeated scan found zero remaining em dashes or encoded equivalents in those literals. Rendered public HTML was checked too.

Moved the existing interactive landing page into a client component behind a server page with explicit home metadata. Added reusable public-page metadata with a distinct title, description, canonical URL, Open Graph URL/image and Twitter large-image card. About and Contact now have their own metadata; Help, help articles and policy/account-deletion pages use the same complete metadata contract. Added an original code-rendered 1200x630 social image, Organization/WebSite JSON-LD on Home and breadcrumb JSON-LD on help articles. JSON serialization escapes less-than characters.

Home copy names sales, inventory and M-Pesa clearly. Replaced About's placeholder team biographies, unsupported milestones, revenue and ratings with product-focused content. Preserved the previously requested 500+ shops figure; it was not independently verified or placed in structured data. Removed the separate inconsistent 5,000+ claim from the auth panel. No invented ratings, reviews, prices or Play Store availability were added.

Canonical resolution accepts a valid HTTPS production origin, strips paths/query strings, and rejects invalid, local or Vercel preview origins. Preview deployments receive noindex headers site-wide and robots disallow-all. Auth, dashboard, onboarding, embed and tokenized customer-document routes receive noindex/nofollow response headers. Customer documents remain absent from the sitemap; crawlers can read their noindex instruction. Authentication still protects private app data; indexing directives are not access control.

Removed sitemap lastModified timestamps generated from build time, which did not represent actual content edits.

## Independent verification

TypeScript and the final Next production build passed. Started the built Next server on explicit loopback and fetched actual HTML/headers, without existing test suites or production user data.

Walked every one of the 20 URLs returned by sitemap.xml. All returned 200 with a unique title, description, exactly one canonical at the correct path, social-image metadata, a large-image Twitter card and exactly one H1. No em dash appeared in the rendered public HTML. Parsed emitted JSON-LD as valid JSON. Public pages did not return noindex headers. The sitemap omitted private/customer routes and no longer emitted artificial lastmod values.

Checked actual noindex response headers for /login, /register, /owner/sales, /staff/sales, /onboarding and synthetic invalid quotation/receipt URLs. Fetched the generated social image, checked its PNG signature and 1200x630 dimensions, and visually inspected it. No real customer tokens were used.

Exercised canonical configuration with local, invalid, preview and custom production values. Verified preview robots emits disallow-all without a conflicting allow-root rule. Source scan found no mdash, numeric em-dash entities or Unicode escape literals in owned web copy. React review covered server metadata boundaries, preserved client interactions, safe JSON-LD serialization, existing image priority and heading/link structure.

## Boundaries and references

No merge or deployment was performed. These are technical/content SEO improvements, not evidence of a ranking change. Search Console verification, sitemap submission, recrawl requests, live domain redirects and Google rich-results certification were not performed. Live API-provided or user-entered text is not rewritten by this patch. No customer data, receipt content, stored shop names or report values were changed.

Guidance checked against primary documentation:

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/crawling-indexing
