import type { Metadata } from 'next';

/**
 * Public quotation pages must never be indexed.
 *
 * Each URL is a per-quotation token meant for the one customer it was shared
 * with. The page shows shop name, customer name and pricing, so an indexed
 * quotation publishes a shop's pricing and a customer's details one link at a
 * time. robots.txt already disallows everything — this is the per-page
 * instruction that also covers a crawler arriving from a shared link rather
 * than the root, mirroring src/app/r/[token]/layout.tsx.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PublicQuotationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
