# Public quotation loading recovery

## Reproduced cause

The public quotation used the authenticated app's QueryClient. On initial hydration with a stored account, AuthHydrator calls authStore.hydrate(), which clears that client when the user identity changes from null to the stored user. React Query cancels the quotation's consumed AbortSignal and removes the query. The mounted public page does not subscribe to auth changes, so it can keep displaying its previous observer result indefinitely.

A QueryObserver reproduction showed:

- Before auth hydration: status=pending, fetchStatus=fetching.
- After cache clear: status=pending, fetchStatus=fetching, cached queries=0.

The cancelled request runs fetchJson's finally handler, clearing the timeout. Increasing the network timeout or changing the loading animation cannot repair this state.

## Change

Public quotation and landing-page pricing reads now receive a separate QueryClient created once per mounted page. Auth hydration, logout and account changes continue clearing the authenticated cache in full. No authenticated reads are moved into the public client. Quotation request cancellation, timeout, no automatic retries and manual retry remain in place.

## Validation

All 28 Node tests passed, including two new regressions proving that public quotation success and timeout/error both settle after the private cache is cleared. TypeScript and production build passed. The regression models the actual QueryObserver/cache behavior; physical-phone and deployed-browser verification remain necessary after merge. No production data was changed.
