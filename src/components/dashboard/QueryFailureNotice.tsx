'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';

/** Makes failed active reads visible on screens that otherwise default to empty data. */
export default function QueryFailureNotice() {
  const client = useQueryClient();
  const [count, setCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    const update = () => setCount(client.getQueryCache().getAll().filter(q => q.isActive() && q.state.status === 'error').length);
    update();
    return client.getQueryCache().subscribe(update);
  }, [client]);
  if (!count) return null;
  return <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>Some information could not be loaded. Figures and lists below may be incomplete. Check your connection and retry.</p><Button variant="outline" loading={retrying} onClick={async () => { setRetrying(true); try { await client.refetchQueries({ predicate: q => q.isActive() && q.state.status === 'error', type: 'active' }); } finally { setRetrying(false); } }}>Retry loading</Button></div>;
}
