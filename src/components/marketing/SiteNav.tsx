import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/help', label: 'Help' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact Us' },
];

/**
 * Marketing-site header. Extracted so the Help Center, privacy policy, and
 * terms pages share one nav instead of each copying it — the previous
 * duplicates were how /privacy and /terms ended up as `href="#"` dead links
 * in the footer with no pages behind them.
 */
export function SiteNav({ active }: { active?: string }) {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#0F172A' }}>Smart Duka</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active === link.href
                    ? 'text-sm font-semibold transition-colors'
                    : 'text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors'
                }
                style={active === link.href ? { color: '#0F766E' } : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{ color: '#0F766E', borderColor: '#0F766E' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: '#0F766E' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
