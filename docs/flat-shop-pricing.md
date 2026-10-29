# Flat shop pricing display

The public cards and authenticated plan picker show per-shop totals, user bands (1–3, 4–8, 9+) and the server's fixed additional charge. Plans too small for the current team cannot be selected; the picker updates when the current selection is outgrown. The new public catalog URL includes a pricing version to avoid reusing old cached responses after rollout.

Before checkout, an unavailable or failed pricing preview blocks the payment buttons and offers a retry. Accrued staff charges are included even when switching tiers, matching the backend's actual invoice. Subscription pricing remains server-computed.

Base prices 240 / 500 / 2,000 plus a fixed KES 50 per month produce 290 / 550 / 2,050. No percentage VAT rate is assumed. Requires the companion backend changes and scripts/updateLaunchPricing.mjs database migration after both deployments; seed edits alone do not change live prices.

Verification: TypeScript and production build passed. Manual real-API/database results and rollout details are recorded in backend docs/launch-pricing-2026-10-29.md. No existing test suite was used as proof. Current production public pricing loaded in the browser, but new pricing UI, signed-in payment clicks and physical-phone checks remain pending after deployment. No live charge was made.
