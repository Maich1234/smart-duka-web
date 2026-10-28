import { QueryClient } from '@tanstack/react-query';

/** Public reads must survive auth hydration/logout clearing the private cache.
 * Create per mounted public page; never put authenticated queries here. */
export function createPublicQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { networkMode: 'always', retry: false } },
  });
}
