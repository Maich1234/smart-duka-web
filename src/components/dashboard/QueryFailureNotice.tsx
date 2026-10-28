'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { shouldReportQueryFailure, queryFailureLabel } from '@/lib/queryFailurePolicy';

/** Makes failed active reads visible on screens that otherwise default to empty data. */
export default function QueryFailureNotice() {
  const client = useQueryClient();
  const [labels, setLabels] = useState('');
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    const update = () => setLabels([...new Set(client.getQueryCache().getAll().filter(shouldReportQueryFailure).map(queryFailureLabel))].sort().join(', '));
    update();
    return client.getQueryCache().subscribe(update);
  }, [client]);
  if (!labels) return null;
  return <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>Could not load: {labels}. Retry to update this information.</p><Button variant="outline" loading={retrying} onClick={async () => { setRetrying(true); try { await client.refetchQueries({ predicate: shouldReportQueryFailure, type: 'active' }); } finally { setRetrying(false); } }}>Retry loading</Button></div>;
}
