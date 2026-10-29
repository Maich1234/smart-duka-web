# Durable subscription checkout UI review — 29 October 2026

## Method and changes

Rendered the actual subscription page and payment modals with ReactDOM in JSDOM, connected through actual Axios HTTP requests to the production Express API and an isolated MongoDB replica set with real indexes. Used synthetic accounts/configuration and controlled provider dispatch/query results. Captured requests, key/payload identity, button states, visible messages and stored records. Controlled the polling clock; no existing test suite or live charge was used. This is component/API verification, not physical-browser layout or phone certification.

Pending intent details are saved before dispatch, scoped to owner and shop. Unknown outcomes retain the original request and key; known IDs resume status checks instead of dispatching again. Only a fresh server response clears completed, failed or cancelled attempts. Authenticated server recovery can restore a missing/damaged local copy. Opening checkout follows the canonical provider, and new payment/plan controls are disabled during an unresolved attempt. Storage failures show actionable messages. Receipts use the confirmed server provider. Cached recovery query results are not adopted before a fresh successful lookup during the current mount.

The local record contains original checkout parameters (including the M-Pesa number when supplied), key and payment ID. It is not proof of payment and contains no provider secrets or authentication token. It is removed on a confirmed terminal outcome. Existing account authentication storage is unchanged.

## Observations

| Walkthrough | Observed result |
| --- | --- |
| Fresh actual subscription page, no unfinished payment | Recovery GET 200/null; no unfinished-payment warning |
| Ten same-render taps on Pay | One initiation POST, one saved payment, one provider dispatch |
| Discard initiation response after the server processes it | UI says still awaiting confirmation; durable original request remains |
| Unmount/remount modal, then Recover payment request | Second POST uses exactly the original key and payload; server replays same ID; total provider dispatches remains one |
| Recreate full page with stored payment ID | Continue payment check restores polling; no initiation POST |
| Remove pending local entry, recreate full page | Authenticated recovery GET repopulates the same payment ID and shows the unfinished-payment notice |
| Damage local JSON while server has pending payment | Successful recovery GET repairs local record |
| Continue payment check, deliver successful HTTP callback, advance polling | Fresh GET status confirms success; local entry removed; warning disappears; receipt shows M-Pesa and the confirmed amount |
| Deny checkout storage writes, then Pay | Actionable allow-site-storage message; no initiation POST |
| Seed React Query cache with an obsolete pending result after completion | No pending record or warning before refresh; authenticated recovery GET 200/null; no warning afterwards |

The first cached-query fixture accidentally removed the authentication token along with pending storage and received 401; it was discarded. Repeated with authentication restored and verified a successful recovery query before accepting the observation.

Final TypeScript checking and production Next.js build passed (74 routes). No existing automated test suite ran.

## Deployment and remaining verification

Merge/deploy the companion backend change first: the page uses owner-only GET /subscriptions/checkout and canonical provider fields. No production deployment or database migration was performed here. The backend separately serializes attempts across tabs/devices, so browser storage is not the final duplicate-charge guard.

Safari/Chrome lifecycle behavior, real payment sandboxes, Paystack popup return on an actual phone, provider outages and end-to-end production operation remain unverified. A provider outcome that cannot be established can still require support. Offline behavior remains deferred. This is not whole-system security certification.
