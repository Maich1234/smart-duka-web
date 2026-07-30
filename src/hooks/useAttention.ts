import { useMemo } from 'react';
import type { OwnerDashboardData } from '@/services/dashboard';
import { useShift } from '@/hooks/useShift';

export type AttentionSeverity = 'critical' | 'warning' | 'info';

export interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  severity: AttentionSeverity;
  /** Where to go when clicked; omitted for purely informational items. */
  href?: string;
}

const SEVERITY_ORDER: Record<AttentionSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * What genuinely needs the owner's hand today, ranked by urgency.
 *
 * Deliberately small. When it's empty the section unmounts entirely rather
 * than showing an "all clear" card — a dashboard that always has a panel
 * demanding attention teaches people to ignore the panel.
 *
 * The mobile version also surfaces unsynced offline work; web has no offline
 * queue, so that branch has no equivalent here.
 */
export function useOwnerAttention(data: OwnerDashboardData | undefined): AttentionItem[] {
  const { enabled: shiftsEnabled } = useShift();

  return useMemo(() => {
    const items: AttentionItem[] = [];

    const lowStock = data?.lowStockItems ?? [];
    if (lowStock.length > 0) {
      const critical = lowStock.filter((i) => i.quantity <= 2);
      const worst = lowStock[0];
      items.push({
        id: 'low-stock',
        title:
          lowStock.length === 1
            ? `${worst.name} is running low`
            : `${lowStock.length} products running low`,
        subtitle:
          critical.length > 0
            ? `${critical.length} nearly out — restock to avoid lost sales`
            : 'Restock soon to stay ahead',
        severity: critical.length > 0 ? 'critical' : 'warning',
        // One flagged product goes straight to it; with several, land on the
        // list rather than arbitrarily picking one.
        href: lowStock.length === 1 ? `/owner/inventory/${worst._id}/edit` : '/owner/inventory',
      });
    }

    const openShifts = data?.openShiftsCount ?? 0;
    if (shiftsEnabled && openShifts > 0) {
      items.push({
        id: 'open-shift',
        title: `${openShifts} shift${openShifts === 1 ? '' : 's'} still open`,
        subtitle: 'Close them to reconcile the cash drawer',
        severity: 'warning',
        href: '/owner/shifts',
      });
    }

    return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [data?.lowStockItems, data?.openShiftsCount, shiftsEnabled]);
}
