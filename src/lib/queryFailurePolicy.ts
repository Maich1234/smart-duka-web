import type { Query } from '@tanstack/react-query';

/** A feature with its own error UI must not also alarm the whole dashboard. */
export function shouldReportQueryFailure(query: Query): boolean {
  return query.isActive() && query.state.status === 'error' && query.meta?.errorHandledLocally !== true;
}

export function queryFailureLabel(query: Query): string {
  const labels: Record<string, string> = {
    activeShift: 'Shift status', shop: 'Shop settings', subscription: 'Subscription status',
    'owner-dashboard': 'Dashboard', 'staff-dashboard': 'Dashboard',
  };
  return labels[String(query.queryKey[0])] || 'Page information';
}
