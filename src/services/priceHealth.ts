import api from '@/lib/api';

export interface PriceChange {
  _id: string; actorName: string | null; actor?: string; source: 'created' | 'product_edit' | 'purchase'; createdAt: string;
  changes: { key: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null }[];
}
export interface PriceIssue {
  productId: string; name: string; productType: string; unitOfMeasure?: string; variantId?: string; variantName?: string;
  sellingPrice?: number; costPrice?: number | null; stockQuantity: number; issues: string[];
  unitShortfall: number | null; potentialLoss: number | null; flexible: boolean; minPrice?: number; lastChange: PriceChange | null;
}
export interface PriceHealth {
  currency: string; generatedAt: string; digest: string;
  window: { days: number; start: string; end: string };
  summary: { affectedProducts: number; affectedPriceRows: number; zeroPriceRows: number; belowCostRows: number; missingCostRows: number; potentialLoss: number; affectedStockCostValue: number; excludedBundles: number };
  realised: { recordedLoss: number; estimatedLoss: number; unknownCostLines: number; belowCostSaleLines: number; products: { productId?: string; variantId?: string; name: string; variantName?: string; loss: number; quantity: number; estimated: boolean }[] };
  items: PriceIssue[]; pagination: { page: number; limit: number; total: number; pages: number }; notes: string;
}
export const ISSUE_LABELS: Record<string, string> = { zero_or_missing_price: 'Zero, negative or missing selling price', below_cost: 'Selling price below cost', minimum_below_cost: 'Allowed minimum below cost', cost_not_set: 'Purchase cost needs review', missing_variants: 'No variants configured' };
export async function getPriceHealth(page = 1): Promise<PriceHealth> { return (await api.get('/products/price-health', { params: { page, limit: 20 } })).data.data; }
export async function getPriceHistory(productId: string, page = 1): Promise<{ data: PriceChange[]; pagination: { page: number; pages: number; total: number } }> { return (await api.get(`/products/${encodeURIComponent(productId)}/price-history`, { params: { page } })).data; }

export async function downloadPriceReview(): Promise<void> {
  const response = await api.get('/products/price-health/pdf', { responseType: 'blob', timeout: 120000 });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a'); a.href = url; a.download = 'duqana-price-review.pdf'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
