import Badge from '@/components/ui/Badge';
import { isQuotationExpired } from '@/utils/quotationHtml';
import type { Quotation } from '@/services/quotations';

export type QuotationDisplayStatus = 'draft' | 'declined' | 'converted' | 'expired';

/**
 * draft/declined/converted, plus 'expired' — a draft past its own
 * validUntil. The server never stores this status; it's computed at read
 * time (see Quotation model's status comment). Shared by the owner/staff
 * list and detail pages so the expiry rule lives in exactly one place.
 */
export function displayStatus(q: Quotation): QuotationDisplayStatus {
  if (q.status === 'draft' && isQuotationExpired(q.validUntil)) return 'expired';
  return q.status;
}

export default function QuotationStatusBadge({ status }: { status: QuotationDisplayStatus }) {
  const map = {
    draft: { color: 'blue' as const, label: 'Draft' },
    declined: { color: 'red' as const, label: 'Declined' },
    converted: { color: 'green' as const, label: 'Converted' },
    expired: { color: 'gold' as const, label: 'Expired' },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}
