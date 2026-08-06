import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/marketing/SiteNav';
import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy – Dukana',
  description:
    'How Dukana collects, uses, shares, and retains your data — including business data sent to Google Gemini for AI insights, and what happens when you close your account.',
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = '26 July 2026';

/**
 * The privacy policy.
 *
 * Google Play requires a live, publicly reachable privacy policy URL, and the
 * Play Console Data Safety declaration must match what this page says. Before
 * this existed, the footer and the registration screen both linked `href="#"`
 * — an automatic rejection at review.
 *
 * Two disclosures here are load-bearing and must not be quietly dropped:
 *
 *  1. **Google Gemini.** Business data is sent to a third party for AI
 *     insights. That is a "shared with third parties" declaration in Data
 *     Safety and has to be stated here too.
 *  2. **Bookkeeping retention after account closure.** Sales, purchases,
 *     expenses, and payment records survive account deletion with personal
 *     identifiers detached. Stating it here is what makes that retention
 *     lawful rather than silent.
 *
 * If either the data collected or the third parties change, this page and the
 * Data Safety form have to change together.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SiteNav />

      <main className="max-w-3xl mx-auto px-4 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-3" style={{ color: '#0F172A' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: '#64748B' }}>
          Last updated {LAST_UPDATED}
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-8">
          <Section title="Who we are">
            <P>
              Dukana is a point-of-sale and shop-management service for retail businesses in Kenya and
              East Africa. This policy covers the Dukana mobile app, the Dukana web app, and this
              website.
            </P>
            <P>
              If you have a question about anything here, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline" style={{ color: '#0F766E' }}>
                {SUPPORT_EMAIL}
              </a>
              .
            </P>
          </Section>

          <Section title="What we collect">
            <P>We collect only what the service needs to work:</P>
            <Bullets
              items={[
                'Account details — your name, email address, phone number, and password (stored only as a salted hash, never in readable form).',
                'Shop details — business name, address, county and sub-county, currency, tax rate, and logo.',
                'Business records you enter — products, stock levels, sales, purchases, suppliers, expenses, and staff accounts.',
                'Financial transaction data — M-Pesa receipt numbers, amounts, payer phone numbers, and payment status for sales and subscription payments.',
                'Device information — a device identifier, platform, and push-notification token, used to deliver alerts and to enforce one-device-per-staff sign-in.',
                'Diagnostic information — error reports and basic usage timings, used to fix crashes.',
              ]}
            />
            <P>
              We do <strong>not</strong> collect your customers&apos; names, ID numbers, or addresses. We do
              not track your location in the background, and we do not read your SMS messages — where an
              M-Pesa confirmation is used to recover a payment, you paste the message yourself.
            </P>
          </Section>

          <Section title="How we use it">
            <Bullets
              items={[
                'To run your shop: recording sales, tracking stock, producing reports and receipts.',
                'To take payment for your subscription, and to bill for staff seats.',
                'To send you alerts you asked for — low stock, daily summaries, shift reconciliation, renewal reminders.',
                'To keep accounts secure: rate-limiting sign-ins, detecting reused refresh tokens, and enforcing one active device per staff account.',
                'To support you when you contact us.',
              ]}
            />
            <P>We do not sell your data, and we do not use it to build advertising profiles.</P>
          </Section>

          <Section title="Who we share it with">
            <P>Only the providers needed to deliver the service:</P>
            <Bullets
              items={[
                'Safaricom (M-Pesa / Daraja) — to request and confirm payments. They receive the payer phone number and amount.',
                'Google Gemini — to generate AI business insights and answer your questions in Ask Dukana. See below.',
                'Google Firebase — to deliver push notifications.',
                'Vercel and MongoDB Atlas — hosting and database infrastructure.',
                'Cloudinary — to store shop logos you upload.',
              ]}
            />
          </Section>

          <Section title="AI features and Google Gemini">
            <P>
              Dukana&apos;s AI insights and the Ask Dukana assistant work by sending a{' '}
              <strong>summary of your business data</strong> to Google Gemini: aggregated sales totals,
              stock levels, expenses, and staff performance figures. This is a transfer of your business
              data to a third party, so we want to be exact about it:
            </P>
            <Bullets
              items={[
                'No customer personal data is ever included.',
                'AI features are off unless your shop has an active subscription, and an owner can switch Dukana AI off entirely from Profile at any time.',
                'When it is off, nothing is sent to Gemini at all.',
              ]}
            />
            <P>
              The app shows the same summary to you before you turn the feature on, from the &quot;What data
              does Gemini see?&quot; link next to the switch.
            </P>
          </Section>

          <Section title="Closing your account, and what we keep">
            <P>
              You can close your account from the app (Profile → Delete my account) or from{' '}
              <Link href="/delete-account" className="underline" style={{ color: '#0F766E' }}>
                this page
              </Link>
              . Closure is scheduled 14 days ahead so a mistaken or malicious request can be undone; your
              account works normally until then and one tap cancels it.
            </P>
            <P>
              After 14 days we permanently delete your user record, your password hash, and all sign-in
              sessions. If you are a shop owner, we also delete the shop, its subscription, and every staff
              account belonging to it — so please make sure that is what you intend.
            </P>
            <P>
              <strong>What we keep:</strong> completed sales, purchases, expenses, and payment records are
              retained as business accounting records, with personal identifiers detached from them. A shop
              cannot lawfully erase its own tax and bookkeeping history because an app account was closed,
              and these records may be required by the Kenya Revenue Authority. They are no longer linked to
              you personally, and they are not used for any other purpose.
            </P>
          </Section>

          <Section title="Offline data on your device">
            <P>
              So the app keeps working without a signal, Dukana stores a copy of your recent products
              and any sales waiting to sync in a private database on your device. It is removed when you
              sign out or uninstall the app.
            </P>
          </Section>

          <Section title="Your rights">
            <Bullets
              items={[
                'See and correct your account details from Profile in the app.',
                'Export your sales data from Reports.',
                'Close your account and have your personal data deleted, subject to the bookkeeping retention above.',
                'Turn off push notifications and AI features independently.',
                `Ask us what we hold about you, by emailing ${SUPPORT_EMAIL}.`,
              ]}
            />
            <P>
              These rights are provided under Kenya&apos;s Data Protection Act, 2019, and we will respond to
              any request within 30 days.
            </P>
          </Section>

          <Section title="Children">
            <P>
              Dukana is a business tool and is not directed at children. We do not knowingly collect
              data from anyone under 18.
            </P>
          </Section>

          <Section title="Changes to this policy">
            <P>
              If we change what we collect or who we share it with, we will update this page and its
              &quot;last updated&quot; date, and notify shop owners in the app before the change takes
              effect.
            </P>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-relaxed" style={{ color: '#334155' }}>
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-relaxed" style={{ color: '#334155' }}>
          <span aria-hidden className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#0F766E' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
