import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { createPublicQueryClient } from '../src/lib/publicQueryClient.ts';
import { fetchJson } from '../src/lib/fetchJson.ts';

// Models the public child mounting its query before the parent restores auth
// and clears the private cache. The public observer must still settle.
test('public quotation completes when auth hydration clears private queries', async () => {
  const privateClient = new QueryClient();
  const publicClient = createPublicQueryClient();
  let finish;
  let publicSignal;
  const observer = new QueryObserver(publicClient, {
    queryKey: ['public-quotation', 'example'],
    queryFn: ({ signal }) => {
      publicSignal = signal;
      return new Promise(resolve => { finish = resolve; });
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    privateClient.setQueryData(['private-shop'], { secret: true });
    privateClient.clear();
    assert.equal(privateClient.getQueryCache().getAll().length, 0);
    assert.equal(publicSignal.aborted, false);
    finish({ quoteNumber: 'Q1' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(observer.getCurrentResult().status, 'success');
    assert.equal(observer.getCurrentResult().data.quoteNumber, 'Q1');
  } finally { unsubscribe(); publicClient.clear(); privateClient.clear(); }
});

test('public quotation still reports timeout after private cache is cleared', { timeout: 2000 }, async () => {
  const original = globalThis.fetch;
  const privateClient = new QueryClient();
  const publicClient = createPublicQueryClient();
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const observer = new QueryObserver(publicClient, {
    queryKey: ['public-quotation', 'stalled'],
    queryFn: ({ signal }) => fetchJson('https://example.test', { signal, timeoutMs: 10 }),
  });
  let unsubscribe;
  try {
    await new Promise(resolve => {
      unsubscribe = observer.subscribe(result => { if (result.isError) resolve(); });
      privateClient.clear();
    });
    assert.match(observer.getCurrentResult().error.message, /taking too long/);
    assert.equal(observer.getCurrentResult().fetchStatus, 'idle');
  } finally { unsubscribe?.(); publicClient.clear(); privateClient.clear(); globalThis.fetch = original; }
});
