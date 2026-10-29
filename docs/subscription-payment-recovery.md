# Subscription payment recovery responses

- Closing either payment modal after server-confirmed success invokes the same subscription refresh as Done. Previously X, Escape and backdrop close used the generic close callback, leaving the cached lock/status stale.
- Failed/timed-out payment copy no longer asserts that no money was taken. It asks the user to check payment status before retrying if charged.
- Card/bank recovery exposes status rechecking for any unsuccessful attempt with a payment ID, not only the timeout stage. Successful recovery continues through the existing server verification endpoint.

TypeScript and production build passed. These UI paths were inspected in source; signed-in browser, real provider and physical-phone verification remain pending. Manual backend requests with a real database and real unique index are documented in backend docs/manual-payment-recovery-2026-10-29.md. No existing test suite was used as correctness evidence.
