import { create } from 'zustand';
import type { CreatePurchaseCostData } from '@/services/purchases';
import type { MoneyOutMethod } from '@/constants/paymentMethods';

/**
 * The purchase being built.
 *
 * A store rather than page state because entering a purchase is a
 * multi-step job — add a line, go look up a supplier, come back — and
 * losing the basket on a navigation is the fastest way to make people stop
 * recording purchases at all.
 */

export interface PurchaseCartLine {
  /** Stable key: the same product in two variants is two lines. */
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseCartState {
  lines: PurchaseCartLine[];
  supplierId?: string;
  supplierName: string;
  paymentMethod: MoneyOutMethod;
  purchaseDate: string;
  additionalCosts: CreatePurchaseCostData[];
  addLine: (line: Omit<PurchaseCartLine, 'key'>) => void;
  updateLine: (key: string, patch: Partial<PurchaseCartLine>) => void;
  removeLine: (key: string) => void;
  setSupplier: (supplier: { id?: string; name: string }) => void;
  setPaymentMethod: (method: MoneyOutMethod) => void;
  setPurchaseDate: (date: string) => void;
  setAdditionalCosts: (costs: CreatePurchaseCostData[]) => void;
  reset: () => void;
}

const lineKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? ''}`;

const today = () => new Date().toISOString().slice(0, 10);

export const usePurchaseCartStore = create<PurchaseCartState>((set) => ({
  lines: [],
  supplierId: undefined,
  supplierName: '',
  paymentMethod: 'cash',
  purchaseDate: today(),
  additionalCosts: [],

  // Re-adding the same product tops up the quantity rather than creating a
  // second line, and takes the newer unit cost — the price you were just
  // quoted is the one you meant.
  addLine: (line) =>
    set((state) => {
      const key = lineKey(line.productId, line.variantId);
      const existing = state.lines.find((l) => l.key === key);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + line.quantity, unitCost: line.unitCost } : l
          ),
        };
      }
      return { lines: [...state.lines, { ...line, key }] };
    }),

  updateLine: (key, patch) =>
    set((state) => ({ lines: state.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) })),

  removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

  setSupplier: ({ id, name }) => set({ supplierId: id, supplierName: name }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPurchaseDate: (purchaseDate) => set({ purchaseDate }),
  setAdditionalCosts: (additionalCosts) => set({ additionalCosts }),

  reset: () =>
    set({
      lines: [],
      supplierId: undefined,
      supplierName: '',
      paymentMethod: 'cash',
      purchaseDate: today(),
      additionalCosts: [],
    }),
}));

/** Products total, extra costs, and the two added together. */
export const purchaseTotals = (
  lines: PurchaseCartLine[],
  additionalCosts: CreatePurchaseCostData[]
) => {
  const productsTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  const additionalCostsTotal = additionalCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  return { productsTotal, additionalCostsTotal, grandTotal: productsTotal + additionalCostsTotal };
};
