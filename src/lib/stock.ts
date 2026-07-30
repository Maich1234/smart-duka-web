/**
 * Stock arithmetic for the till.
 *
 * The server refuses to oversell (pricingEngine's checkAndDeductStock throws
 * "Insufficient stock"), so the database was never at risk — but the till let
 * you build a basket the server would then reject, and only said so at
 * checkout, after the customer was already waiting. These keep the cart
 * inside what's actually on the shelf.
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
