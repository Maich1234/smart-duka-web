# Duqana mobile-to-web parity

Reference: `smart-duka` mobile and `smart-duka-backend`; target: `smart-duka-web`. This is a source-based comparison, not release sign-off. Offline browser behaviour is deferred by request.

## Implemented; end-to-end testing still required

- Owner assets: list, add, edit, archive/restore, pagination.
- Owner customers: search, add, edit, archive, account and credit activity.
- Owner credit overview and ledger; repayment form retains retry key and payload on this browser. Owner credit settings, individual customer limits/blocks and per-product eligibility are implemented; end-to-end testing is still required.
- Owner financial records: preview and CSV/XLSX/PDF download.
- Owner quotation list/detail, pagination, custom and catalogue multiline creation, searchable paginated customer/product pickers, and decline.
- Existing web till covers standard, variable, weighted, refillable, service, bundle and configurable product paths; promotion preview now follows backend pricing rules for supported product types.

## Remaining or incomplete

- Credit checkout is implemented with a customer picker and retry recovery, gated on the backend guarded-credit capability. The backend guard must be deployed and the end-to-end flow tested before it is available. Manual opening balances and owner credit reversals now have web interfaces with retained retry keys. Legacy-sale import, custom opening-balance due dates and permission-scoped staff access to customers/credit/quotations remain.
- Quotations: edit and conversion to a sale with full payment support; deletion is available only after the guarded backend update is deployed. Configurable products cannot yet be quoted as catalogue items; end-to-end verify catalogue pricing and customer selection.
- Customer filters, archived-account visibility, account ledger pagination and latest-five purchase history are implemented; end-to-end verification remains.
- Business overview: capital, sales, product and staff analysis.
- Verify pricing under concurrent catalog changes, all product combinations, configurable variants, promotions, staff commissions and payment methods against the backend.
- Compare remaining profile/settings, onboarding, billing and subscription gates.
- Browser camera scanning, printing, receipt sharing and notifications, including unsupported-device responses.
- Mobile/desktop layout, keyboard and accessibility tests, RBAC/security checks and real API integration tests.

## Test evidence

Focused Node tests cover receipt HTML escaping, promotion preview and malformed/pending repayment recovery. TypeScript is checked separately. Production builds verify compilation, not real transactions. No physical-device usability test or authenticated live transaction has been performed for these changes. Retrying the same repayment retains its key on the same browser; storage clearing, other browsers/devices and user-cleared pending requests require ledger reconciliation.

## Latest verification

13 focused web tests pass. 147 selected backend tests pass across quotation CRUD/permissions, credit authorization/rules/service, sale creation and idempotency. These tests use mocks and do not substitute for a live database concurrency test, payment-provider integration test or physical-device usability review. Customer account activity is paginated; the purchase panel deliberately shows only the latest five purchases returned by the backend.

## Security check follow-up

The full backend test suite passes (593 tests). Web regression tests now cover session identity changes and an explicit runtime cache allowlist (16 tests total). Query caches clear on cross-tab logout, account/shop changes, and permission changes. Dashboard routes stop disallowed children from mounting before redirects. Runtime caching is limited to same-origin Next static build assets; the new worker deletes the previous default runtime caches on activation. These changes require deployment and browser activation; authenticated browser and live database tests remain outstanding.

## Owner credit corrections

Manual opening balances and reversals use authenticated owner-only endpoints. Requests persist their payload and idempotency key before submission, reject malformed recovery data, serialize creation across tabs with Web Locks, and stop retries after 72 hours. The owner must reconcile the ledger before clearing an uncertain request. These controls require a current HTTPS browser and do not prove live MongoDB concurrency behavior. No money transfer or refund is initiated by a ledger reversal.
