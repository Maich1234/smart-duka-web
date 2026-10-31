import { publicMetadata } from '@/lib/seo';
import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteNav } from '@/components/marketing/SiteNav';
import { HELP_CATEGORIES, HELP_TOPICS } from '@/lib/helpTopics';

export const metadata = publicMetadata('Help & Learning Center – DuQana', 'Plain-language guides for running your shop with DuQana: products and stock, sales and checkout, staff permissions, M-Pesa payments, reports, and receipts.', '/help');

/**
 * The Help & Learning Center index.
 *
 * This is now the canonical Help Center. It previously existed twice: the real
 * content (14 written topics) lived in the Expo web export off the mobile
 * repo, while this page was a shell listing article *titles* with nothing
 * behind them. Consolidating here means one source of truth, a smaller mobile
 * bundle, and — because these are server-rendered with per-topic metadata —
 * help articles that work as an organic acquisition channel instead of being
 * invisible to search.
 */
export default function HelpPage() {
  const grouped = HELP_CATEGORIES.map((category) => ({
    category,
    topics: HELP_TOPICS.filter((t) => t.category === category),
  })).filter((g) => g.topics.length > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SiteNav active="/help" />

      <section className="py-16 lg:py-20" style={{ backgroundColor: '#103D38' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-teal-100">Help centre</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
            Find a DuQana guide
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Plain-language guides for the parts of DuQana that can be confusing at first. Browse by
            topic below.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-14">
        <a
          href="/help/smart-duka-ai"
          className="group flex items-center gap-4 rounded-xl border border-gray-100 p-5 mb-12 hover:shadow-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEF3C7' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#B45309' }} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold mb-1" style={{ color: '#0F172A' }}>Using DuQana AI?</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
              Read how to enable it and which business data it uses.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 text-gray-300 group-hover:text-teal-700 transition-colors" />
        </a>

        {grouped.map(({ category, topics }) => (
          <section key={category} className="mb-12">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#64748B' }}>
              {category}
            </h2>
            <div className="grid gap-3">
              {topics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/help/${topic.slug}`}
                  className="group flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-5 hover:border-teal-600 hover:shadow-sm transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#0F172A' }}>
                      {topic.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                      {topic.summary}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 mt-0.5 shrink-0 text-gray-300 group-hover:text-teal-700 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <h2 className="font-semibold mb-2" style={{ color: '#0F172A' }}>
            Still stuck?
          </h2>
          <p className="text-sm mb-4" style={{ color: '#64748B' }}>
            Tell us what you were trying to do and we&apos;ll walk you through it.
          </p>
          <Link
            href="/contact"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: '#0F766E' }}
          >
            Contact support
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
