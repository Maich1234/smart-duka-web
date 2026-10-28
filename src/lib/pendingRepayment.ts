import type { RecordPaymentData } from '../services/credit';
export type PendingRepayment = { key: string; customerId: string; data: RecordPaymentData; createdAt: number };
export type PendingRead = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'pending'; value: PendingRepayment };
export function parsePendingRepayment(raw: string | null, customerId: string): PendingRead {
  if (raw === null) return { kind: 'empty' };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return { kind: 'invalid' };
    const p = value as Partial<PendingRepayment>;
    if (typeof p.key !== 'string' || !p.key || p.key.length > 128 || p.customerId !== customerId || !p.data ||
        typeof p.data.amount !== 'number' || !Number.isFinite(p.data.amount) || p.data.amount <= 0 ||
        typeof p.data.paymentMethod !== 'string' || !p.data.paymentMethod || p.data.paymentMethod === 'credit' ||
        (p.data.reference !== undefined && typeof p.data.reference !== 'string') ||
        typeof p.createdAt !== 'number' || !Number.isFinite(p.createdAt) || p.createdAt <= 0) return { kind: 'invalid' };
    return { kind: 'pending', value: p as PendingRepayment };
  } catch { return { kind: 'invalid' }; }
}
export function mayRetryRepayment(createdAt: number, now: number): boolean {
  return now >= createdAt && now - createdAt < 72 * 60 * 60 * 1000;
}
