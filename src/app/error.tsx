'use client';
import Link from 'next/link';
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-lg space-y-4 p-8" role="alert"><h1 className="text-xl font-semibold">This page could not be displayed</h1><p>Please try again. If the problem continues, return home and contact support.</p><button onClick={reset} className="rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white">Try again</button><Link href="/" className="ml-4 text-teal-700 underline">Go home</Link></main>;
}
