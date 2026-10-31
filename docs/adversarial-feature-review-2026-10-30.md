# Adversarial feature review, 30 October 2026

Actual React DOM checks covered FormData file selection, component/variant review, below-cost acknowledgement, one commit and success feedback. Web production build passes. Price review shows invalid stock/ranges and excludes unknown amounts. Unit changes are visible in history.

Real MongoDB concurrency and physical-device checks remain outstanding. No production merge/deploy or customer data mutation was performed.


## Excel guide and system responses

Added /help/excel-product-import with template fields, example products/variants/bundles, rejection reasons and recovery steps. Linked from the importer, Help Centre/related topics, DuQana AI help results and agent training form. Guide anchors account for the sticky header. Identifiers remain text-formatted.

Import rejection responses now distinguish file type, empty file, size (413), extra files/fields, rate limits, expired preview (410), unavailable preview (404) and catalogue changes. Child validation errors identify their sheet/row. Free/unknown-cost variant warnings require review. The web UI filters rejected rows, focuses result feedback, announces real checking/saving phases and preserves the selected file for retry.

Added an owner/shop-scoped read-only import-status endpoint. Lost save responses are treated as uncertain, not as proof of rollback: keep the same preview, block starting another upload, check status or retry safely. Session storage retains only the scoped batch identity and pending flag; the server revalidates access, status and expiry. Actual React DOM checks passed for lost response after save, status confirmation without a second commit, reload recovery, row errors/filters, oversize feedback and guide links. Actual server-rendered help route/tables/anchors/navigation passed. Actual HTTP status/error responses were checked with synthetic model adapters. These adapters do not establish real database atomicity.

Further financial finding: configurable parent trackInventory:false is normal, while the sales engine always tracks variant stock. The old report incorrectly zeroed variant exposure. It now uses variant quantities independently of the parent flag; the actual aggregation pipeline scenario passes with the flag off. Imported services default to untracked stock, and composite parents default to false without suppressing variant quantities.

Production web/admin builds, web/mobile/admin TypeScript, 2,000-product/parser, archive/role/numeric scenarios and the native PDF adapter checks pass. Local Mongo still cannot start; real transaction/index races and physical-device behavior remain unverified. No production merge or live customer writes were performed.
