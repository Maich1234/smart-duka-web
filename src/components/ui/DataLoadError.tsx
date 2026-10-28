'use client';
import Button from './Button';
export default function DataLoadError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5"><h1 className="font-semibold text-slate-900">Could not load {label}</h1><p className="text-sm text-slate-600">Check your connection and try again. Unavailable data is not shown as zero.</p><Button onClick={onRetry} variant="outline">Retry</Button></div>;
}
