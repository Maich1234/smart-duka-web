import type { Metadata } from 'next';
import VerifyDocument from './verify-document';
export const metadata: Metadata = { title: 'Verify a DuQana document', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <VerifyDocument />; }
