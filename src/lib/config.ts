// Single source of truth for the backend host. Previously this URL was
// hardcoded in two places (lib/api.ts and the public receipt page), so
// pointing the app at a different backend meant editing code and shipping a
// build. Set NEXT_PUBLIC_API_BASE_URL in the environment to override; the
// fallback keeps existing deployments working without any config change.
//
// NEXT_PUBLIC_* is inlined by Next at build time, not read at runtime — a
// change requires a rebuild, which is why the fallback still points at
// production rather than throwing.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smart-duka-backend-iota.vercel.app/api/v1';
