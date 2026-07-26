import type { Metadata } from 'next';

/**
 * Public receipt pages must never be indexed.
 *
 * Each URL is a per-sale token meant for the one customer who scanned that
 * printed receipt. The page shows shop name, line items, and amounts, so an
 * indexed receipt publishes a shop's takings one transaction at a time.
 * robots.txt already disallows /r/ — this is the per-page instruction that
 * also covers a crawler arriving from a shared link rather than the root.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
