# Web loading audit — 28 October 2026

## Live checks

The user-supplied public quotation link initially displayed Loading quotation, then rendered its quotation and PDF link successfully. No application error appeared in the sampled browser console; a browser-extension metadata warning is unrelated evidence. Homepage plans initially loaded, then rendered both plans. No reliable request duration was captured, so these observations do not establish a latency benchmark or explain the original slowdown.

The live Starter plan displayed KES 1 per month per staff. This is a configuration observation requiring owner review, not a price changed during this audit.

## Source-wide request inventory and fixes

- Authenticated requests use the shared Axios client with a 15-second request timeout; token refresh has its own 12-second timeout. Authentication replay/425 recovery can make total elapsed time longer than a single request timeout. AI chat explicitly permits 30 seconds.
- Shared quotation reads are bounded through request and response-body parsing, support cancellation, and provide explicit connection/timeout errors.
- Public receipt reads now have a 15-second timeout, cancellation on navigation, request-state reset and a Retry action. Rating submissions also have a timeout; writes are not automatically retried.
- Logo preloads abort after ten seconds and release their shared in-flight entry, allowing later attempts.
- Default query reads no longer pause indefinitely when the browser reports offline. Automatic query retries are disabled by default, while page-specific explicit policies remain intact. This does not queue or automatically retry financial mutations.
- Active dashboard query failures are shown in a shared notice with a read-only retry action. Owner/staff dashboard summaries explicitly show an error instead of presenting unavailable figures as zeros. Staff editing now fails visibly if staff details or the permission catalogue cannot load.
- A route error boundary provides a recovery screen for rendering failures.

## Verification limits

Authenticated screens were reviewed through source and automated tests, not exercised with a signed-in production account. Receipt failure/cancellation behavior and shared query policy require further browser fault-injection verification. The public quotation is a bearer link; its token and customer data are deliberately omitted from this report. No live financial records, ratings, payments or settings were changed.
