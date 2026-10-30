# Public-site authenticity and pricing follow-up, 30 October 2026

## Observed problems and changes

The landing page repeated slogan headings and registration prompts, displayed decorative stars and a 01/03 counter without a slideshow, and placed arrow icons on non-clickable feature rows. The auth layout still contained fabricated avatar initials and a separate 5,000+ trust claim. Contact/FAQ copy advertised obsolete Free/Pro limits, guaranteed reply hours, daily backups and broad encryption promises without verified support for those statements.

Replaced slogans with actual sale, stock and end-of-day tasks. Removed the decoration, false slide affordance, fake social proof, popularity badges and repeated marketing filler. Feature rows now link to the relevant existing guides. Onboarding steps state the records a shop owner needs. The final section offers setup help rather than another generic registration pitch. Public and authenticated pricing cards retain API prices and feature lists; decorative badges, taglines and price comparisons no longer distract from user limits and totals.

Home, About, Contact and Help share a footer. The public body/nav use the configured font consistently, while existing serif headings and brand colours remain. Contact methods are usable email/phone/guide links. Form labels are associated with fields, browser autofill is supported, success/errors are announced and the FAQ controls expose expanded state. A pricing FAQ links directly to current prices. Contact promises now say where replies will go without inventing a response SLA. Captcha and transport are preserved; no support message was sent during verification.

Replaced the staged shop image with a documentary Nairobi shopfront photograph by Natalia Msungu from Pexels. The visible caption credits the photographer and links to the source; it is not presented as a DuQana customer or endorsement. Source/licence/download details are tracked in public/images/nairobi-shopfront-credit.txt. The source and Pexels licence were read, and downloaded images were visually inspected. No generated image or synthetic testimonial was added.

Help no longer advertises an unsupported free tier or guaranteed backup/encryption policy. The AI banner opens a working web guide instead of a custom app URL that does nothing for a web visitor. Actual AI features remain named honestly. The owner-requested 500+ shops figure remains on About; it was not newly measured or added as structured proof.

## Pricing source and rollout

Live public API inspection confirmed old database pricing, not merely a browser cache. Backend PR 21 applies the agreed pricing to existing plans once. This web change does not paint new prices over an old checkout: public cards and authenticated checkout continue using server values. The public request version changes, pricing refetches every minute while active and on focus, and obsolete Free/Pro FAQ claims are removed.

Merge/deploy backend first, then web. Expected monthly totals are KES 290 (1–3 users), KES 550 (4–8), and KES 2,050 (9+), including KES 50 per billed month. The backend revision preserves old plan IDs and entitlements; full independent replica-set evidence is in its docs/manual-launch-pricing-rollout-2026-10-30.md.

## Verification and limits

Final TypeScript and Next production build passed. Walked all 20 sitemap URLs from the built server: 200 status, unique title/description, exactly one matching canonical and H1, complete social-image tags, valid JSON-LD and no em dashes in rendered public HTML. Private/tokenized routes retain noindex headers. Generated share image remains a valid 1200x630 PNG. Repeated syntax-tree copy scan found no remaining em dashes in owned UI literals. New internal guide targets were included in that crawl.

Reviewed CTA destinations, source pricing arithmetic, loading/retry/empty states, responsive layout rules, reduced-motion support, sticky navigation, field-label bindings and the unchanged contact transport. No physical Android or visual full-page browser sign-off was performed; source/HTTP checks do not certify every breakpoint or contact delivery. No existing test suite, live support message, deployment or merge was performed.

Photography source: https://www.pexels.com/photo/small-shopfront-in-busy-urban-setting-28505434/
Licence: https://www.pexels.com/license/
