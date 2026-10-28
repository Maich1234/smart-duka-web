# Duqana system review — 27 October 2026

## Verdict and scope

Do not treat the system as ready for release sign-off. The automated checks are useful, but payment integrity, recovery after interrupted requests, session revocation and inventory editing need further work.

Reviewed the backend `codex/guarded-credit-checkout`, web `codex/mobile-feature-parity`, and mobile main (`e2fcb02`) source. The web/backend feature branches are not evidence of what production currently runs. This was a cross-system source and test review, not a penetration test, physical-device session, provider sandbox run, real MongoDB concurrency test or exhaustive review of every screen. Platform administration outside these repositories was not assessed.

## Prioritized findings

| Priority | Finding and evidence | Consequence | Required correction |
|---|---|---|---|
| P1 | Backend `src/services/saleCreationService.js` selects a successful M-Pesa transaction scoped to the shop and atomically claims it, but never compares its amount with the server-calculated sale total. | A smaller confirmed payment can be attached to a larger sale. Catalogue repricing between payment and sale creation also creates an accounting mismatch. | Validate the confirmed paid amount against the final server total inside the transaction; define rounding, overpayment and reconciliation policy. Test underpayment and concurrent price changes. |
| P1 | Backend `src/middlewares/idempotency.js` stores the response separately from the sale transaction; response-persistence errors are swallowed. Stale stubs can be reclaimed after two minutes and records expire after 72 hours. | A cash sale that committed before an interrupted/persistence-failed response can execute again when retried. Credit ledger clientRef and M-Pesa claims protect some paths, not ordinary cash sales. | Put a durable operation identity/result in the same transaction as financial writes; reclaim/replay by that identity. Exercise crashes between commit and response persistence. |
| P1 | Web `src/app/(dashboard)/staff/sales/page.tsx` retains a durable retry request for credit, but ordinary cash checkout calls mutate again with no retained key. `src/lib/api.ts` creates a new key for each new request. | Retrying after a lost cash-sale response can create a second sale and decrement stock twice, even within the backend replay window. | Retain the immutable payload and operation key for every sale until its result is reconciled. Apply the same recovery UX already used for credit. |
| P1 | Backend access JWT contains only user ID; `src/middlewares/auth.js` verifies JWT and active user but no session identifier/version. Login, logout and password changes revoke refresh sessions. Staff replacement is conditional on a supplied device ID. | Previously issued access tokens remain usable until expiry (default one hour) after logout/password change or staff device replacement. A client can omit device metadata. | Bind access tokens to revocable sessions or a token version, validate it on protected requests, and enforce staff session policy independently of optional client metadata. |
| P1 | Web `src/components/inventory/ProductForm.tsx` reads variant fields into VariantForm without retaining variant `_id`, then sends replacement variant objects. Backend updateProduct passes the replacement array to Mongoose. | Editing an existing configurable product regenerates variant IDs, invalidating references held by open carts and potentially offline queued sales. | Preserve immutable variant IDs and validate that supplied IDs belong to the product. Test editing one variant while another till holds a cart. |
| P2 | Web ProductForm.toPayload uses parseInt for ordinary product quantity, including weighted/refillable products. It also uses `parseInt(lowStockAlert) || 5`. | A stock value of 2.75 is saved as 2; a legitimate zero threshold becomes 5. | Parse quantities by product type, preserve decimals and zero, and validate finite values explicitly. |
| P2 | Backend `src/controllers/mpesaController.js` handleCallback acknowledges the callback before saving payment status; callback audit logging is not awaited. | On serverless hosting, work after the response can be suspended. A paid transaction can remain pending. This is a deployment-dependent reliability risk, not an observed production loss. | Persist/queue the callback durably before acknowledgment, then process idempotently. Test function interruption and repeated callbacks. |
| P2 | Backend `src/app.js` uses Morgan request logging; M-Pesa callback shared secrets are in URL path segments. Public document/reset/verification tokens in URLs also require review. | Request logs can contain bearer-like secrets. Exposure depends on access to application/platform logs. | Redact token-bearing paths and query values; review platform log configuration, retention and access. Rotate secrets if log exposure is found. |
| P2 | Backend idempotency records store method/path but replay lookup uses only user/key and does not compare route or request payload. | Reusing a key for a different operation can return unrelated success data instead of rejecting the conflicting request. | Bind keys to method, canonical route and payload digest; reject mismatches with 409. |
| P2 | Web `src/app/(dashboard)/owner/inventory/[id]/edit/page.tsx` renders a spinner whenever `!seeded`, with no query-error branch. | A failed/deleted/forbidden product fetch leaves the user stuck indefinitely. | Add explicit error, retry and not-found states. |
| P2 | Parity checklist still has unimplemented or gated flows: quotation editing/conversion, configurable quotation lines, opening balances/reversals, permitted staff customer/credit/quotation access and business analysis. | Web cannot yet replace mobile for all supported work. | Complete and verify each role-specific workflow before declaring parity. |

P1 denotes high-priority release work; P2 denotes material correctness, reliability or usability work. These are findings from source inspection unless explicitly described as a deployment risk. No live exploit was attempted.

## Positive controls observed

- Backend scopes major customer, quotation, product and credit lookups to the session shop; sensitive credit configuration is owner-only.
- Sale/stock/credit changes use MongoDB transactions. M-Pesa transaction claiming and quotation conversion use conditional writes.
- Credit limits are server-enforced; customer limits/blocks and settings have audit paths.
- Password hashing, rotating refresh tokens, callback secret checks and Paystack signature tests exist.
- Recent web work escapes receipt HTML, restricts service-worker runtime caching, clears query caches on session identity changes and gates page mounting before role redirects.
- Mobile auth storage uses secureStorage rather than plain AsyncStorage directly. This does not by itself establish complete device security.

## Verification evidence and limits

The preceding full backend run passed **593 tests**. The current web source passed **16 focused tests**, TypeScript and a production build. These are primarily unit/mocked tests, not proof of the financial invariants above in a live database. No new product code was changed for this review.

The passing suite lacks sufficient coverage to rule out the confirmed mismatched-payment and ordinary-sale retry problems. Required additional coverage includes payment amount mismatch; commit-before-response failure; stale idempotency takeover; access-token use after revocation; fractional stock round trips; stable variant IDs; two real concurrent tills; and physical Android browser/app workflows.

UI/UX evidence here is limited to source-level interaction/error-state review. A visual or accessibility sign-off requires running owner and restricted-staff workflows at phone widths, keyboard/focus tests, screen-reader checks, camera permission denial, popup/print failure and long/empty/loading/error data states. Actual APK size, startup performance, frame rate, battery impact and EAS configuration must be measured on a fresh build/device.

## Recommended execution order

1. Payment amount validation and durable sale identity/recovery across all clients.
2. Session revocation and stable inventory identities/decimal stock.
3. Callback durability and secret-safe logging.
4. Finish parity with role-specific acceptance criteria.
5. Run sandbox end-to-end tests against a dedicated test database and provider setup, then physical-device usability tests.
6. Deploy reviewed branches together, validate worker migration, and confirm the exact production commit versions before sign-off.

## Remediation prepared after review

The backend and web feature branches now include durable keyed sale results, payment amount checks and recorded rounding differences, session-bound access tokens, callback persistence before acknowledgment, URL-free application access logs, request-digest conflicts, stable variant serialization, fractional stock/zero thresholds and product-load error states. Product serialization is extracted into a pure module; session validation uses an indexed existence query. The full backend suite passes 600 tests; 19 focused web tests, TypeScript and the web production build pass. These results are automated/mocked checks, not a live transaction sign-off. Deployment must create the new unique sale-operation and session lookup indexes first; see backend docs/transaction-and-session-hardening.md. Previously committed/unkeyed sales cannot be retroactively deduplicated. Platform logs, provider integration, real MongoDB concurrency, mobile compatibility and remaining feature parity still require verification.
