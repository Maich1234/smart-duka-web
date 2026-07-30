import { useShop } from '@/hooks/useShop';

/**
 * Money formatting that respects the shop's currency.
 *
 * The app sells in Kenya, Uganda, Tanzania, Rwanda, Ethiopia, Burundi, South
 * Sudan and the US, and the shop picks its currency in Profile — but almost
 * every screen used to print a hardcoded "KES", so a Kampala shop saw its
 * shilling totals labelled as Kenyan ones.
 *
 * Intl gets the grouping and symbol right per currency; the en-KE locale is
 * kept because these are all comma-grouped, dot-decimal markets.
 */
export function formatMoney(amount: number | undefined | null, currency = 'KES'): string {
  const value = amount ?? 0;
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    // An unknown currency code shouldn't blank out a total.
    return `${currency} ${value.toLocaleString()}`;
  }
}

/** The same thing, bound to the current shop. */
export function useMoney() {
  const { currency } = useShop();
  return (amount: number | undefined | null) => formatMoney(amount, currency);
}
