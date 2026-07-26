import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { SiteNav } from '@/components/marketing/SiteNav';
import { HELP_TOPICS, getHelpTopic } from '@/lib/helpTopics';

type Params = { slug: string };

/** Statically renders every help topic at build time — no runtime lookup, and
 *  each article is a real crawlable URL. */
export function generateStaticParams(): Params[] {
  return HELP_TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  if (!topic) return { title: 'Help – Smart Duka' };

  return {
    title: `${topic.title} – Smart Duka Help`,
    description: topic.summary,
    keywords: topic.keywords,
    alternates: { canonical: `/help/${topic.slug}` },
    openGraph: {
      title: topic.title,
      description: topic.summary,
      type: 'article',
    },
  };
}

export default async function HelpTopicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  if (!topic) notFound();

  const related = (topic.relatedSlugs ?? [])
    .map((s) => getHelpTopic(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SiteNav active="/help" />

      <main className="max-w-3xl mx-auto px-4 py-10 lg:py-14">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:underline"
          style={{ color: '#0F766E' }}
        >
          <ArrowLeft className="w-4 h-4" />
          All help topics
        </Link>

        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#64748B' }}>
          {topic.category}
        </p>
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight" style={{ color: '#0F172A' }}>
          {topic.title}
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: '#475569' }}>
          {topic.summary}
        </p>

        <article className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
          {topic.sections.map((section, index) => (
            <section key={index} className={index > 0 ? 'mt-8' : undefined}>
              {section.heading && (
                <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>
                  {section.heading}
                </h2>
              )}

              {section.paragraphs?.map((paragraph, i) => (
                <p key={i} className="leading-relaxed mb-3 last:mb-0" style={{ color: '#334155' }}>
                  {paragraph}
                </p>
              ))}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed" style={{ color: '#334155' }}>
                      <span aria-hidden className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#0F766E' }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.example && (
                <div
                  className="mt-4 rounded-lg p-4 text-sm leading-relaxed border-l-4"
                  style={{ backgroundColor: '#F1F5F9', borderColor: '#0F766E', color: '#334155' }}
                >
                  <span className="font-semibold">Example: </span>
                  {section.example}
                </div>
              )}
            </section>
          ))}
        </article>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#64748B' }}>
              Related
            </h2>
            <div className="grid gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/help/${r.slug}`}
                  className="group flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-teal-600 transition-colors"
                >
                  <span className="flex-1 font-medium" style={{ color: '#0F172A' }}>{r.title}</span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-gray-300 group-hover:text-teal-700 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6 text-center">
          <p className="text-sm mb-4" style={{ color: '#64748B' }}>
            Didn&apos;t answer your question?
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
    </div>
  );
}
