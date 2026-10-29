# Refund confirmation UI review — 29 October 2026

The backend can return 202 for a reserved refund whose provider outcome is unknown. The web action previously styled every successful HTTP response green and pending sales said M-Pesa was already returning the money.

Refund action results now use the returned sale status: green only for refunded, amber for pending/unconfirmed, red when a definitive failed attempt leaves the sale completed. Pending text explains that confirmation is still required and advises against another refund. Network errors ask the user to refresh sale details instead of claiming the refund failed. Sales-history queries are invalidated after an error so another user's correction can be refreshed. Confirmation wording describes stock/revenue changes only after completion.

Rendered the actual RefundSaleSection with ReactDOM/JSDOM, a real QueryClient and Axios HTTP requests to the production Express API on an isolated MongoDB replica set. Used synthetic accounts/configuration and controlled provider fetch responses; no existing suite, real provider or production data.

Observed:

- Actual M-Pesa refund initiation loses its provider response, API returns 202: amber role=status panel with the server's not-confirmed message; no second refund button.
- Actual cash refund returns 200/refunded: green role=status panel saying stock restored.
- Re-render persisted refund_pending sale: awaiting-confirmation text, no refund action.
- TypeScript and production Next.js build passed (74 routes).

This is semantic/component/API verification, not physical-phone or visual-browser certification. Backend refund safety must deploy first. Real provider sandbox checks, automatic reconciliation for uncertain refunds and durable callback processing remain outstanding. No production deployment was performed.
