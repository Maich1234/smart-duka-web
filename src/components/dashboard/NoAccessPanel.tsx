'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import Card from '@/components/ui/Card';

/**
 * Shown in place of a page the signed-in user lacks the permission for.
 *
 * Deliberately not a redirect: bouncing someone away from a permission
 * failure is easy to turn into a loop (the destination can fail the same
 * check), and it leaves them guessing about what happened. A dead end that
 * explains itself is kinder than a silent one that moves them.
 */
export default function NoAccessPanel({ homeHref }: { homeHref: string }) {
  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <div className="text-center py-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <h1 className="font-bold text-lg mb-1" style={{ color: '#0F172A' }}>
            You don&apos;t have access to this
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Ask the shop owner to grant you the permission for this section.
          </p>
          <Link
            href={homeHref}
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#0F766E' }}
          >
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
