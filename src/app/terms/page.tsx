import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Terms of Service – Smart Duka',
  description:
    'The agreement covering your use of Smart Duka: subscriptions and billing, staff seats, your data, availability, and how either side can end the agreement.',
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = '26 July 2026';

/**
 * Terms of service. Linked from registration (where the user agrees to them)
 * and from the site footer — both of which previously pointed at `href="#"`.
 *
 * The billing section deliberately spells out prorated postpaid seats and
 * where payment happens, because both changed: seats used to demand a full
 * period up front via an in-app M-Pesa push, and now accrue prorated onto the
 * next invoice, paid on the web.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SiteNav />

      <main className="max-w-3xl mx-auto px-4 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-3" style={{ color: '#0F172A' }}>
          Terms of Service
        </h1>
        <p className="text-sm mb-10" style={{ color: '#64748B' }}>
          Last updated {LAST_UPDATED}
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-8">
          <Section title="1. The agreement">
            <P>
              These terms cover your use of Smart Duka — the mobile app, the web app, and this website. By
              creating an account you agree to them. If you are creating an account on behalf of a business,
              you confirm you are authorised to accept these terms for that business.
            </P>
          </Section>

          <Section title="2. Your account">
            <P>
              You are responsible for keeping your password private and for everything done under your
              account. Shop owners are responsible for the staff accounts they create, including the
              permissions they grant them.
            </P>
            <P>
              Staff accounts are limited to one signed-in device at a time. Owners may sign a staff member
              out remotely at any time.
            </P>
          </Section>

          <Section title="3. Free trial">
            <P>
              New shops get a free trial. Nothing is charged during it and no payment details are required
              to start it. When the trial ends, continued access requires a paid subscription.
            </P>
          </Section>

          <Section title="4. Subscriptions and billing">
            <Bullets
              items={[
                'Subscriptions are billed monthly or yearly in advance, in Kenyan Shillings, and renew until cancelled.',
                'Prices depend on your plan and on how many people use the shop. Current prices are shown on the pricing page.',
                'Subscriptions are purchased and managed on the web. The mobile app does not sell subscriptions.',
                'Adding a team member mid-period does not require a payment at the time. The cost of the extra seat is prorated for the days remaining in your current period and added to your next invoice.',
                'Removing a team member mid-period credits the unused part of that seat against your next invoice. Credits reduce an invoice but are never paid out as cash.',
                'We will email a reminder before each renewal.',
              ]}
            />
          </Section>

          <Section title="5. If payment is late">
            <P>
              When a subscription ends without renewal, your shop keeps working for a short grace period.
              After that, the owner&apos;s access is paused and the shop cannot record new sales — but your
              data is never deleted for non-payment, and everything returns as soon as you renew.
            </P>
            <P>
              If you need a little longer, contact support before your grace period ends. We would rather
              extend it than see a shop stop trading.
            </P>
          </Section>

          <Section title="6. Cancelling">
            <P>
              You can cancel at any time. Cancellation stops future renewals; you keep access until the end
              of the period you have already paid for. We do not refund part-used periods.
            </P>
            <P>
              You can close your account entirely from the app or from{' '}
              <Link href="/delete-account" className="underline" style={{ color: '#0F766E' }}>
                this page
              </Link>
              . See the{' '}
              <Link href="/privacy" className="underline" style={{ color: '#0F766E' }}>
                Privacy Policy
              </Link>{' '}
              for what is deleted and what is retained as accounting records.
            </P>
          </Section>

          <Section title="7. Your data is yours">
            <P>
              You own the business data you enter. We store and process it to provide the service, as
              described in the Privacy Policy. You can export your sales data at any time from Reports.
            </P>
          </Section>

          <Section title="8. Acceptable use">
            <P>You agree not to:</P>
            <Bullets
              items={[
                'Use Smart Duka for anything unlawful, or to record transactions you know to be fraudulent.',
                'Share one paid account across separate businesses to avoid paying for seats.',
                'Attempt to bypass subscription, seat, or permission checks, or access another shop’s data.',
                'Resell or rebrand the service without a written agreement with us.',
              ]}
            />
            <P>
              We may suspend an account that does any of these, and will tell you why.
            </P>
          </Section>

          <Section title="9. Payments through M-Pesa">
            <P>
              Payments you collect from your own customers go directly to your own M-Pesa till using
              credentials you supply. Smart Duka records those payments; it never holds your money. You are
              responsible for keeping your M-Pesa credentials accurate and for any tax on your sales.
            </P>
          </Section>

          <Section title="10. Availability">
            <P>
              We work hard to keep Smart Duka running, and the app is built to keep recording sales while
              offline. Even so, we cannot promise uninterrupted service — connectivity, Safaricom&apos;s
              systems, and our hosting providers are all outside our full control. Keep your own record of
              anything critical.
            </P>
          </Section>

          <Section title="11. Limits on liability">
            <P>
              Smart Duka is provided as-is. To the extent the law allows, we are not liable for lost
              profits, lost sales, or indirect losses. Where liability cannot be excluded, it is limited to
              the subscription fees you paid us in the three months before the claim.
            </P>
            <P>Nothing here limits rights you have under Kenyan consumer law.</P>
          </Section>

          <Section title="12. Changes">
            <P>
              We may update these terms. If a change materially affects you, we will notify shop owners in
              the app before it takes effect. Continuing to use Smart Duka after that means you accept the
              updated terms.
            </P>
          </Section>

          <Section title="13. Governing law">
            <P>
              These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction over
              any dispute.
            </P>
          </Section>

          <Section title="14. Contact">
            <P>
              Questions about these terms:{' '}
              <a href="mailto:support@smartduka.co.ke" className="underline" style={{ color: '#0F766E' }}>
                support@smartduka.co.ke
              </a>
              .
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
