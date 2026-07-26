import Link from 'next/link';
import { FileText, ShieldCheck, UserX, ChevronRight } from 'lucide-react';

const LINKS = [
  { href: '/terms', label: 'Terms of Service', icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/delete-account', label: 'Delete my account', icon: UserX, danger: true },
];

/**
 * Legal documents and the account-closure route, from Profile.
 *
 * Someone who agreed at signup should be able to re-read what they agreed to
 * without hunting for it, and Google Play requires the privacy policy to be
 * reachable from inside the product rather than only from the store listing.
 *
 * No checkbox here on purpose: consent was captured once at registration and
 * recorded server-side against a version. An untick on this screen would have
 * no coherent meaning — it can't retract a signed agreement, and closing the
 * account is the actual way out, which is why that link sits alongside.
 */
export default function LegalLinks() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <h2 className="px-6 pt-5 pb-3 text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748B' }}>
        Legal
      </h2>
      {LINKS.map(({ href, label, icon: Icon, danger }, index) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors ${
            index > 0 ? 'border-t border-gray-100' : ''
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" style={{ color: danger ? '#DC2626' : '#64748B' }} />
          <span className="flex-1 text-sm" style={{ color: danger ? '#DC2626' : '#0F172A' }}>
            {label}
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-gray-300" />
        </Link>
      ))}
    </div>
  );
}
