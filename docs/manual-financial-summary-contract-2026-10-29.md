# Financial summary response contract — 29 October 2026

The companion backend visibility change omits purchase dashboard totalSpend, supplier spend/averagePurchaseCost and recent purchase grandTotal when a staff member lacks view_purchase_prices. Mark these fields optional in the web service types, consistent with the already-optional cost fields on purchase rows.

The existing purchase home and supplier screens check price permission and accept undefined in their money formatters, while cost analytics queries are already disabled without that permission. No screen or interaction changed in this update. TypeScript checking and the production Next.js build passed (74 routes). No existing test suite ran. Actual API visibility, permission granting/revocation, cached replies and owner/staff responses were exercised against the isolated backend; see its manual-financial-visibility-2026-10-29.md.

This type-only addition accompanies the pending refund-message PR. It does not certify browser account-switch caches, real-phone rendering or all exports. No production deployment was performed.
