# Mobile to web feature parity

The web source is smart-duka-web; smart-duka is the mobile reference. Existing web workflows must be retained.

## Implemented in this branch

- Owner business assets: paginated list, create, edit, archive and restore; acquisition/current values and status. Backend computes estimated value.
- Typed API clients for business overview, customers, credit, quotations and location presets, adapted to the authenticated web API.

## Still required before claiming parity

- Customers: search, filter, create, edit, archive, account and scoped ledger.
- Credit: overview, repayments, reversal with reason, opening balances, customer selection at POS and settings.
- Quotations: create catalog/custom lines, detail, decline, delete, conversion with existing payment workflows, public sharing.
- Business overview: capital, sales, product and staff analysis; financial books preview/export CSV/XLSX/PDF.
- Compare existing POS support for every product type, promotions, price overrides, commissions and payment methods.
- Compare profile/settings, onboarding, permissions, billing and subscription feature gates.
- Verify offline persistence, retry/idempotency, queue visibility and conflict handling in browser.
- Verify camera scanning, printing, receipt downloads/sharing and browser notification support; expose explicit browser capability limits.
- Verify mobile and desktop layouts, error/empty/loading states, permission denial and browser navigation.

Native APIs cannot simply be imported into Next.js. Downloads must use authenticated HTTP with blob URLs; printer and scanner support must respect browser capabilities. Financial data must use backend totals, never independently recompute balances.

## Validation

TypeScript check passed for the first implementation. Full browser integration and authenticated end-to-end verification remain required.
