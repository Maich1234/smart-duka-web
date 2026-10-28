export interface CreditSettings {
  enabled: boolean;
  defaultCreditLimit: number;
  defaultCollectionPeriodDays: number;
  productPolicy: 'ALL_PRODUCTS' | 'SELECTED_PRODUCTS';
  overduePolicy: 'BLOCK' | 'ALLOW';
}

export function parseCreditLimit(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value <= 10_000_000 ? value : null;
}

export function parseCollectionDays(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value <= 365 ? value : null;
}
