export type CreditAttempt = {
  key: string;
  createdAt: number;
  customerName: string;
  data: { items: object[]; paymentMethod: 'credit'; customerId: string; requireCreditBooking: true };
};

export function parsePendingCreditSale(raw: string): CreditAttempt {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid pending sale');
  const p = value as Partial<CreditAttempt>;
  if (typeof p.key !== 'string' || !p.key || p.key.length > 128 ||
      typeof p.createdAt !== 'number' || !Number.isFinite(p.createdAt) || p.createdAt <= 0 ||
      typeof p.customerName !== 'string' || !p.customerName ||
      !p.data || p.data.paymentMethod !== 'credit' || p.data.requireCreditBooking !== true || typeof p.data.customerId !== 'string' || !p.data.customerId ||
      !Array.isArray(p.data.items) || !p.data.items.length || p.data.items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('Invalid pending sale');
  }
  return p as CreditAttempt;
}

export function mayRetryCreditSale(createdAt: number, now: number): boolean {
  return now >= createdAt && now - createdAt < 72 * 60 * 60 * 1000;
}
