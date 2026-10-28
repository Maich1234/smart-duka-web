import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { shouldReportQueryFailure, queryFailureLabel } from '../src/lib/queryFailurePolicy.ts';

test('locally handled plan rejection does not warn that successful sales data is incomplete', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const observer = new QueryObserver(client, { queryKey: ['depletion'], meta: { errorHandledLocally: true }, queryFn: async () => { throw Object.assign(new Error('Not in plan'), { response: { status: 403 } }); } });
  const off = observer.subscribe(() => {});
  try {
    await observer.refetch();
    client.setQueryData(['owner-dashboard'], { todaySalesTotal: 80 });
    assert.equal(client.getQueryCache().getAll().filter(shouldReportQueryFailure).length, 0);
    assert.equal(client.getQueryData(['owner-dashboard']).todaySalesTotal, 80);
  } finally { off(); client.clear(); }
});

test('genuine unresolved failure stays visible, is named, and clears after successful retry', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let fail = true;
  const observer = new QueryObserver(client, { queryKey: ['activeShift'], queryFn: async () => { if (fail) throw new Error('Service unavailable'); return { enabled: true }; } });
  const off = observer.subscribe(() => {});
  try {
    await observer.refetch();
    const failed = client.getQueryCache().getAll().filter(shouldReportQueryFailure);
    assert.equal(failed.length, 1);
    assert.equal(queryFailureLabel(failed[0]), 'Shift status');
    fail = false;
    await observer.refetch();
    assert.equal(client.getQueryCache().getAll().filter(shouldReportQueryFailure).length, 0);
  } finally { off(); client.clear(); }
});
