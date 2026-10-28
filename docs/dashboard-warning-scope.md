# Dashboard warning scope

The global QueryFailureNotice reported every active failed query as potentially incomplete figures/lists, including optional features and requests already handled locally. The stock forecast query ran on all owner dashboards despite requiring the advanced_analytics plan feature; the backend deliberately returns 403 for a plan without it. DepletionSection hid this expected rejection, but the global observer turned it back into an alarming page-wide warning. This is a confirmed source-code path, not a verified diagnosis of the account in the customer's screenshot.

Changes:

- Request the stock forecast only when the loaded plan includes advanced_analytics. Backend 403 remains authoritative if access changes mid-session; other forecast failures get a section-level retry.
- Queries with local error UI explicitly opt out of the global warning. This covers stock forecasts, notification unread count and the owner/staff dashboard summaries.
- Notification unread failures get a retry beside the bell rather than suggesting sales figures are incomplete. Hide the unread badge while its status is unavailable.
- Other unresolved active errors remain visible in the global notice with a friendly affected-area label, such as Shift status, Shop settings or Subscription status. Retry targets the same reported queries. Do not assume every failure is a connection problem.

Validation: 30 Node tests passed, including an expected plan rejection alongside successful sales data and a genuine error that disappears after successful retry. TypeScript and production build passed. Signed-in production diagnosis and physical-phone verification remain pending; no credentials were available for the account in the screenshot.
