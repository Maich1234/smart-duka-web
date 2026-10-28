export type Promotion = { buyQty: number; freeQty: number; isActive?: boolean; label?: string };
export function saleLinePreview(type:string, promotions:Promotion[] | undefined, quantity:number, unitPrice:number) {
  let payable = quantity;
  let label: string | null = null;
  if (type !== 'bundle' && type !== 'configurable') {
    for (const promo of promotions ?? []) {
      if (promo.isActive === false || promo.buyQty <= 0 || promo.freeQty <= 0) continue;
      const bundles = Math.floor(quantity / (promo.buyQty + promo.freeQty));
      const candidate = quantity - bundles * promo.freeQty;
      if (bundles > 0 && candidate < payable) { payable = candidate; label = promo.label || `Buy ${promo.buyQty} Get ${promo.freeQty} Free`; }
    }
  }
  return { subtotal: payable * unitPrice, saved: (quantity - payable) * unitPrice, label };
}
