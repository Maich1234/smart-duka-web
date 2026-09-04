/**
 * Stock arithmetic for the till.
 *
 * The server allows overselling on purpose — a shop can sell stock that's
 * physically on the shelf but not yet purchased into the system, and the
 * owner is alerted whenever a sale takes something below zero. These helpers
 * no longer cap what the till lets you add; they surface what's on hand so
 * the checkout confirmation (see negativeStockAfter) can warn before the
 * sale is sent.
 */

export interface StockedProduct {
  quantity: number;
  trackInventory: boolean;
  productType: string;
  variants?: { _id?: string; quantity: number }[];
}

/** Products whose own quantity is meaningless — stock lives elsewhere. */
const UNTRACKED_TYPES = ['bundle', 'service'];

/**
 * How many units may still be added, given what's already in the cart.
 * `Infinity` for anything the shop doesn't count (services, bundles, and
 * products with stock tracking switched off).
 */
export function availableToAdd(
  product: StockedProduct,
  variantId: string | undefined,
  alreadyInCart: number
): number {
  if (!product.trackInventory || UNTRACKED_TYPES.includes(product.productType)) {
    return Infinity;
  }
  const onHand = variantId
    ? (product.variants?.find((v) => v._id === variantId)?.quantity ?? 0)
    : product.quantity;
  return Math.max(0, onHand - alreadyInCart);
}

/**
 * How far this line would push the product/variant below zero, or null if
 * it wouldn't. Used to warn before checkout — selling past what's on hand is
 * allowed (see saleController's createSale), the shop owner is alerted after
 * the fact.
 */
export function negativeStockAfter(
  product: StockedProduct,
  variantId: string | undefined,
  quantity: number
): number | null {
  if (!product.trackInventory || UNTRACKED_TYPES.includes(product.productType)) return null;
  const onHand = variantId
    ? (product.variants?.find((v) => v._id === variantId)?.quantity ?? 0)
    : product.quantity;
  const resulting = onHand - quantity;
  return resulting < 0 ? resulting : null;
}

/** Weighted goods sell in fractions; everything else in whole units. */
export const stepFor = (productType: string): number =>
  productType === 'weighted' || productType === 'refillable' ? 0.1 : 1;

/**
 * Clamp a quantity into [step, max]. Floating point makes 0.1 + 0.2 into
 * 0.30000000000000004, so fractional results are rounded to one place.
 */
export function clampQty(value: number, step: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return step;
  const bounded = Math.min(Math.max(value, step), max);
  return step < 1 ? Math.round(bounded * 10) / 10 : Math.floor(bounded);
}
