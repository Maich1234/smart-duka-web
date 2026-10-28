# Shared document printer design

The public quotation (`/q/[token]`) and receipt (`/r/[token]`) viewers now share an original printer-inspired presentation, based on the visual direction supplied at https://www.dqnamo.com/experiments/receipt-printer.

- Request state controls loading, ready and error displays. There is no artificial processing delay or fabricated payment confirmation.
- CSS paper reveal runs on ready content; reduced-motion users see it immediately. No animation package, external textures or additional network requests were introduced.
- Paper height grows with the content. Quotation lines stack for narrow screens, and existing customer, shop, tax, note and validity information remains available.
- Receipt uses only the public endpoint's summary fields. It does not invent private line items or payment information.
- Existing request cancellation, 15-second timeout and explicit retry behavior remain. Rating and PDF functionality are retained. Quotation also has a browser-print action and print styles.
- Shared status is announced through a polite live region. Decorative icons are hidden from assistive technology.

Validation: all 26 existing Node tests, TypeScript check and production build passed. The browser could inspect the design reference but could not reach this workspace's local server (`ERR_CONNECTION_REFUSED`). Visual verification of the implemented pages, physical-phone testing and real printer output remain unverified. No production deployment or live payment/rating write was performed.

## Subscription payments

Both M-Pesa and Paystack success panels use the same printer presentation. The receipt component mounts only at the existing server-confirmed success stage, then reads the authenticated payment-status endpoint for the settled amount, currency, reference and period end. It does not reuse the checkout estimate as proof of payment, or infer plan details/date fields the endpoint does not return. A zero-value successful payment is labelled as requiring no payment. SMS recovery passes the reconciled payment ID so the receipt belongs to the recovered transaction. A receipt read failure has a retry action and keeps Done available; it never sends another payment request.

Validation: TypeScript and the 26 existing tests passed; production build passed. No real subscription charge was made. Live payment-provider and visual browser verification remain pending.
