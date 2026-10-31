import LandingPage from '@/components/marketing/LandingPage';
import { JsonLd } from '@/components/marketing/JsonLd';
import { publicMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/site';

export const metadata = publicMetadata(
  'DuQana | POS and Inventory Software for Kenyan Shops',
  'Manage sales, stock, M-Pesa payments, staff and customer credit with DuQana. POS software for Kenyan shops, with receipts, quotations and business reports.',
  '/',
);

export default function HomePage() {
  return <>
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, alternateName: 'DuQana POS', url: SITE_URL,
        description: 'POS and inventory software for Kenyan shops.',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 }, email: SUPPORT_EMAIL, telephone: SUPPORT_PHONE },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, alternateName: 'DuQana POS', url: SITE_URL, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en-KE' },
      { '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL, name: 'DuQana | POS and Inventory Software for Kenyan Shops',
        isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#app` }, inLanguage: 'en-KE' },
      { '@type': 'WebApplication', '@id': `${SITE_URL}/#app`, name: SITE_NAME, url: SITE_URL, applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser',
        description: 'Record shop sales, track inventory and purchases, manage staff access, and issue receipts and quotations with DuQana.',
        featureList: ['Sales and barcode scanning', 'Inventory and purchase records', 'Cash and M-Pesa payment recording', 'Staff permissions', 'Customer credit and repayments', 'Receipts, quotations and business reports'],
        provider: { '@id': `${SITE_URL}/#organization` } },
    ] }} />
    <LandingPage />
  </>;
}
