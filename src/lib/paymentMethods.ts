import { Banknote, Smartphone, Landmark, CreditCard, Clock, Tag, Wallet, type LucideIcon } from 'lucide-react';

/**
 * The till's payment buttons — shop-defined, not a fixed list.
 *
 * Mirrors constants/paymentMethods.ts in the mobile app and
 * src/constants/salePaymentMethods.js in the backend. See the backend file for
 * why money-in is configurable: Kenyan shops take payment on Pochi la Biashara,
 * a personal number, a till, a paybill, Airtel Money or a bank account, and
 * 'cash' | 'mpesa' | 'card' forced most of them to lie about it.
 *
 * Only 'mpesa' carries behaviour: with M-Pesa Business connected it can push an
 * STK prompt; without credentials it records and prints like any other button.
 */

export const CASH_METHOD_KEY = 'cash';
export const MPESA_METHOD_KEY = 'mpesa';

export type MethodIcon = 'cash' | 'phone' | 'bank' | 'card' | 'clock' | 'tag' | 'wallet';

export interface ShopPaymentMethod {
  key: string;
  label: string;
  icon?: MethodIcon;
  enabled?: boolean;
  order?: number;
}

/** What a shop starts with, and the fallback for shops predating this setting. */
export const DEFAULT_SALE_METHODS: ShopPaymentMethod[] = [
  { key: 'cash', label: 'Cash', icon: 'cash', enabled: true },
  { key: 'mpesa', label: 'M-PESA', icon: 'phone', enabled: true },
];

/** Ready-made buttons offered in the manager, so nobody has to invent a key. */
export const SUGGESTED_SALE_METHODS: ShopPaymentMethod[] = [
  { key: 'airtel_money', label: 'Airtel Money', icon: 'phone' },
  { key: 'bank', label: 'Bank Transfer', icon: 'bank' },
  { key: 'card', label: 'Card', icon: 'card' },
  { key: 'cheque', label: 'Cheque', icon: 'bank' },
  { key: 'credit', label: 'Credit (Deni)', icon: 'clock' },
  { key: 'voucher', label: 'Voucher', icon: 'tag' },
];

const ICONS: Record<MethodIcon, LucideIcon> = {
  cash: Banknote,
  phone: Smartphone,
  bank: Landmark,
  card: CreditCard,
  clock: Clock,
  tag: Tag,
  wallet: Wallet,
};

export const methodIcon = (method?: ShopPaymentMethod): LucideIcon =>
  ICONS[(method?.icon ?? 'wallet') as MethodIcon] ?? Wallet;

/**
 * The buttons to render. Falls back to Cash + M-PESA whenever the shop has no
 * list — old shops, and any response predating this field.
 */
export const resolveSaleMethods = (
  methods?: ShopPaymentMethod[] | null
): ShopPaymentMethod[] => {
  const list = methods?.length ? methods : DEFAULT_SALE_METHODS;
  return list
    .filter((m) => m.enabled !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/** Turn a typed label into a valid key: "Airtel Money" → "airtel_money". */
export const slugifyMethodKey = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

/** Display label for a sale, preferring the label snapshotted at sale time. */
export const saleMethodLabel = (
  sale: { paymentMethod: string; paymentMethodLabel?: string },
  methods?: ShopPaymentMethod[] | null
): string =>
  sale.paymentMethodLabel
  || methods?.find((m) => m.key === sale.paymentMethod)?.label
  || sale.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
