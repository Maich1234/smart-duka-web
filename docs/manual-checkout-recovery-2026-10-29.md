# Checkout recovery and interaction review — 29 October 2026

## Verification method

Rendered the actual subscription checkout components with ReactDOM in a JSDOM runtime, compiled from repository source. Their real service functions and Axios client called the running Express API over local HTTP, backed by a fresh MongoDB 7.0.24 replica set with actual indexes. Used the backend implementation from PR #13. Clicked rendered controls, inspected DOM text/buttons and request headers/payloads, and compared persisted records.

All accounts and configuration were synthetic. M-Pesa charge/status methods and bank status queries used controlled provider-boundary responses; the bank initializer itself used its unchanged production implementation to prepare local checkout. A controlled Paystack widget supplied close/setup-failure events without loading the external widget. No real charge, provider sandbox or production database was used. The client lost-response scenario discarded a real local API response after the backend saved the payment. Clock/poll-timer controls crossed the local waiting deadlines without waiting two or three real minutes.

Separate interactive probes mounted the actual shared hook to inspect precise slow-response, reset and unmount ordering. These were manual runtime explorations without an assertion runner or the existing test suites. This is stronger than source inspection alone, but JSDOM is not a physical browser or a visual/mobile layout test. Initial runtime setup needed browser globals and narrowly scoped timer interception before the receipt checks were accepted; those were harness issues, not reported as application defects.

## Changes

- A synchronous ref guard blocks repeated starts before React can paint the busy state.
- Subscription checkouts opt into preserving unresolved intent keys and their original initiation callback/payload. Recovering a lost response reuses that intent; an existing payment ID resumes observation rather than initiating a new charge.
- Recursive polling schedules the next request only after the previous one finishes. Generation checks reject results from an older poll or an attempt that was reset. Unmounted components cannot start another polling timer from a late initiation result.
- Both subscription modals make status verification the primary recovery action. A new payment action appears only after a definitive failure/cancellation or a rejected request. Unconfirmed waits use neutral/amber confirmation messaging, not a declaration that payment failed.
- Closing and reopening the modal preserves an unresolved attempt while the subscription page keeps that component mounted. Network initiation failures without a payment ID offer recovery using the original key.
- M-Pesa now has direct status verification as well as SMS recovery. Pending server activation messages appear during observation. Verification actions use synchronous guards against repeated clicks.
- Bank popup closure or setup failure preserves the server's attempt ID and does not establish cancellation. Receipts still require server-confirmed success. Successful close/Done continues through the existing subscription refresh callback.
- The shared hook retains fresh-attempt behavior after a known failure for its older callers. The subscription-specific intent protection is opt-in; this pass does not certify the till payment UX.

## Observations

| Scenario | Observed result |
| --- | --- |
| Ten rapid clicks on rendered M-Pesa Pay | One POST, one provider-boundary call, one saved payment |
| Cross the M-Pesa client wait deadline | “Still awaiting confirmation”; status check and SMS recovery; no new-payment action |
| Close/reopen that unresolved modal after changing selected plan | Original unresolved screen retained; no extra initiation request |
| Repeated status-check clicks | One recheck request for that action; same payment ID; observation resumes |
| Discard successful initiation response after backend saved payment | UI offers “Recover payment request”, not a new payment |
| Close/reopen, change plan, then click recovery repeatedly | Recovery POST uses the same key and original phone/cycle/plan body; one total provider call and one record |
| Confirm recovered payment through actual HTTP callback, then poll | Receipt rendered with original KES 290 amount despite parent selection changing to KES 550 |
| Close confirmed receipt with dialog close button | Existing success callback invoked once |
| Ten rapid clicks on bank Pay | One POST, one popup opening, one saved payment |
| Close bank widget without a confirmed result | UI remains unconfirmed with its payment ID; database stays pending |
| Cross bank client deadline | Status verification is primary; no blind new-payment action |
| Provider-boundary verification then confirms amount/currency | Same attempt activates and renders receipt; no new popup or initiation request |
| Controlled bank popup setup failure | Existing ID preserved; checking available; one saved payment |
| Actual API returns 404 for a synthetic unknown plan | Known failure message; new-payment action allowed; no payment record created |
| Slow poll left unresolved | One request in flight, no additional poll scheduled |
| Confirm success externally, then deliver old failed poll response | UI stays successful with confirmed receipt; old error ignored; no timer remains |
| Reset before initiation response arrives | Remains idle with no payment ID or polling timer |
| Unmount before initiation response arrives | No timer scheduled by the late response |
| Older hook caller starts again after known failure | Distinct intent keys retained for the two explicit attempts |

The final source also passed TypeScript checking, whitespace checking and a production Next.js build (74 routes). Reviewed hook lifetimes/ref usage, request ordering, notification semantics, input labels and dependency changes; no runtime dependency was added. The last source changes only narrowed legacy error wording and adjusted the pending bank message color/comment; the full build was repeated afterward.

## Limits and remaining work

No deployment was performed. End-to-end recovery relies on backend PR #13's durable reservation and replay fields; that PR was confirmed merged during this review. Real provider connectivity, bank widget behavior, physical Android/iOS, touch/keyboard/focus and screen-reader behavior, CSS layout/animation quality, service-worker effects and browser refreshes remain unverified here.

Preservation is in component memory while the subscription page remains mounted. Reloading/navigating away, switching accounts or opening another browser tab does not restore that attempt from persistent storage. Independent provider modals/intents are not globally deduplicated by this change. The UI still has a bounded observation window; reaching it is treated as unknown, not proof that no money was taken. A provider/database outcome that cannot be verified may still need support.

The shared polling changes received targeted runtime probes, not a full sales/till regression pass. Whole-system parity, security certification, offline behavior and all product workflows are not established by these checkout checks.
