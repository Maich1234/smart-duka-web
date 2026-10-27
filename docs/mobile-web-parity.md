# Duqana mobile-to-web parity

Reference: `smart-duka` mobile and `smart-duka-backend`; target: `smart-duka-web`. This is a source-based comparison, not release sign-off. Offline browser behaviour is deferred by request.

## Implemented; end-to-end testing still required

- Owner assets: list, add, edit, archive/restore, pagination.
- Owner customers: search, add, edit, archive, account and credit activity.
- Owner credit overview and ledger; repayment form retains retry key and payload on this browser.
- Owner financial records: preview and CSV/XLSX/PDF download.
- Owner quotation list/detail, pagination, custom multiline creation and decline.
- Existing web till covers standard, variable, weighted, refillable, service, bundle and configurable product paths; promotion preview now follows backend pricing rules for supported product types.

## Remaining or incomplete

- Credit checkout, settings, opening balances and owner reversals; permission-scoped staff access to customers/credit/quotations.
- Quotations: searchable/paginated customer selection, catalogue lines, edit/delete, public share/PDF and conversion to a sale with full payment support.
- Customer filters, credit account settings, complete ledger pagination and customer history.
- Business overview: capital, sales, product and staff analysis.
- Verify pricing under concurrent catalog changes, all product combinations, configurable variants, promotions, staff commissions and payment methods against the backend.
- Compare remaining profile/settings, onboarding, billing and subscription gates.
- Browser camera scanning, printing, receipt sharing and notifications, including unsupported-device responses.
- Mobile/desktop layout, keyboard and accessibility tests, RBAC/security checks and real API integration tests.

## Test evidence

Focused Node tests cover promotion preview and malformed/pending repayment recovery. TypeScript is checked separately. Production builds verify compilation, not real transactions. No physical-device usability test or authenticated live transaction has been performed for these changes. Retrying the same repayment retains its key on the same browser; storage clearing, other browsers/devices and user-cleared pending requests require ledger reconciliation.
