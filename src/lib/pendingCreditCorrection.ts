export type CreditCorrection = { key: string; createdAt: number } & (
  { kind: 'opening'; target: string; amount: number; note: string } |
  { kind: 'reverse'; target: string; reason: string }
);
export function parseCreditCorrection(raw: string, kind: CreditCorrection['kind'], target: string): CreditCorrection {
  const p = JSON.parse(raw);
  if (!p || p.kind !== kind || p.target !== target || typeof p.key !== 'string' || !p.key || p.key.length > 128 ||
      typeof p.createdAt !== 'number' || !Number.isFinite(p.createdAt) || p.createdAt <= 0) throw new Error('Invalid saved correction');
  if (kind === 'opening' && (!Number.isFinite(p.amount) || p.amount <= 0 || p.amount > 10000000 || Math.abs(Math.round(p.amount * 100) - p.amount * 100) > 0.000001 || typeof p.note !== 'string' || p.note.length > 300)) throw new Error('Invalid opening balance');
  if (kind === 'reverse' && (typeof p.reason !== 'string' || p.reason.trim().length < 3 || p.reason.length > 300)) throw new Error('Invalid reversal');
  return p;
}
export function canRetryCorrection(p: CreditCorrection, now = Date.now()): boolean {
  return now >= p.createdAt && now - p.createdAt < 72 * 60 * 60 * 1000;
}
