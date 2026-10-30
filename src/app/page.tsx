import LandingPage from '@/components/marketing/LandingPage';
import { JsonLd } from '@/components/marketing/JsonLd';
import { publicMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata = publicMetadata(
  'POS and Inventory Software for Kenyan Shops | DuQana',
  'Manage sales, stock, M-Pesa payments, staff and customer credit with DuQana. POS software for Kenyan shops, with receipts, quotations and business reports.',
  '/',
);

export default function HomePage() {
  return <>
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icons/icon-512.png`, email: SUPPORT_EMAIL },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en-KE' },
    ] }} />
    <LandingPage />
  </>;
}
