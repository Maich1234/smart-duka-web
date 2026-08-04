import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Smartphone, Mail, Users } from 'lucide-react';
import { SiteNav } from '@/components/marketing/SiteNav';

export const metadata: Metadata = {
  title: 'Delete your Dukana account',
  description:
    'How to permanently close your Dukana account and what happens to your data, including the 14-day cancellation window.',
  alternates: { canonical: '/delete-account' },
};

/**
 * The public account-deletion page.
 *
 * Google Play requires a deletion route reachable **without installing the app
 * or signing in** — this URL is submitted in the Play Console listing
 * alongside the in-app flow. So it must stay publicly accessible and must not
 * be moved behind auth.
 *
 * It explains the process and offers both paths (in-app, or by email for
 * someone who has lost access to their device). It intentionally does not
 * accept a password on an unauthenticated page: taking credentials here would
 * be a phishing-shaped pattern and a real account-takeover vector.
 */
export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SiteNav />

      <main className="max-w-3xl mx-auto px-4 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>
          Delete your Dukana account
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: '#475569' }}>
          You can close your account and have your personal data deleted at any time. Here&apos;s exactly
          what happens.
        </p>

        <div
          className="flex gap-4 rounded-xl p-5 mb-8 border-l-4"
          style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626' }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>
              If you are a shop owner, this closes your whole shop
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#7F1D1D' }}>
              Deleting an owner account also deletes the shop and every staff account in it. Everyone loses
              access. If you only want to stop paying, cancel your subscription instead — your data stays.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#0F172A' }}>
              Option 1 — from your account (fastest)
            </h2>
            <div className="flex gap-4 mb-4">
              <Smartphone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
              <ol className="space-y-2 leading-relaxed" style={{ color: '#334155' }}>
                <li>
                  1. Sign in — on the Dukana app, or{' '}
                  <Link href="/login" className="font-semibold underline" style={{ color: '#0F766E' }}>
                    here on the web
                  </Link>
                  .
                </li>
                <li>2. Go to <strong>Profile</strong>.</li>
                <li>3. Scroll to the bottom and choose <strong>Delete my account</strong>.</li>
                <li>4. Enter your password and type <strong>DELETE</strong> to confirm.</li>
              </ol>
            </div>
            {/* Staff closures are owner-approved, so this page must not promise
                a same-day deletion to a cashier who reads it. */}
            <div
              className="flex gap-4 rounded-xl p-5 mt-4"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Users className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#B45309' }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: '#78350F' }}>
                  If you work for a shop, your owner approves it first
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>
                  Staff accounts are issued by a shop, so the request goes to the shop owner before the
                  14-day countdown starts. Your account keeps working normally while it waits, and you can
                  withdraw the request at any time. If the owner doesn&apos;t respond within 14 days it
                  goes ahead without them — an unanswered request can&apos;t block you indefinitely. Your
                  sales and shift records stay with the shop as its bookkeeping either way.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#0F172A' }}>
              Option 2 — by email
            </h2>
            <div className="flex gap-4">
              <Mail className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
              <div className="space-y-3 leading-relaxed" style={{ color: '#334155' }}>
                <p>
                  If you can&apos;t sign in — lost phone, forgotten password — email{' '}
                  <a href="mailto:support@smartduka.co.ke" className="underline font-medium" style={{ color: '#0F766E' }}>
                    support@smartduka.co.ke
                  </a>{' '}
                  from the address on your account with the subject{' '}
                  <strong>&quot;Delete my account&quot;</strong>.
                </p>
                <p className="text-sm" style={{ color: '#64748B' }}>
                  We&apos;ll verify you own the account before doing anything, and respond within 30 days —
                  usually within two business days. We will never ask for your password by email.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>
              You have 14 days to change your mind
            </h2>
            <p className="leading-relaxed mb-3" style={{ color: '#334155' }}>
              Nothing is deleted straight away. Your account keeps working normally for 14 days, and the app
              shows a reminder with a <strong>Keep my account</strong> button. One tap cancels the closure
              and nothing is lost. We also send a reminder push notification in the final few days.
            </p>
            <p className="leading-relaxed" style={{ color: '#334155' }}>
              After 14 days the deletion is permanent and cannot be reversed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>
              What gets deleted
            </h2>
            <ul className="space-y-2 mb-5">
              {[
                'Your name, email address, and phone number',
                'Your password',
                'All sign-in sessions and devices',
                'Your push-notification tokens',
                'For owners: the shop, its settings and logo, its subscription, and all staff accounts',
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed" style={{ color: '#334155' }}>
                  <span aria-hidden className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#DC2626' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>
              What we keep, and why
            </h2>
            <p className="leading-relaxed mb-3" style={{ color: '#334155' }}>
              Completed sales, purchases, expenses, and payment records are kept as business accounting
              records, with your personal details detached from them. A business cannot lawfully erase its
              own tax history because an app account was closed, and these records may be required by the
              Kenya Revenue Authority.
            </p>
            <p className="leading-relaxed" style={{ color: '#334155' }}>
              They are no longer linked to you personally, and they are not used for anything else. Full
              detail is in our{' '}
              <Link href="/privacy" className="underline" style={{ color: '#0F766E' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
