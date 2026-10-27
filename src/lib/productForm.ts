import type { Product, ProductPayload, ProductType } from '../services/products';
export interface VariantForm {
  _id?: string;
  name: string;
  sellingPrice: string;
  costPrice: string;
  quantity: string;
  sku: string;
  lowStockAlert: string;
  commissionEnabled: boolean;
  commissionBasePrice: string;
  commissionEmployeeSharePercent: string;
}

export interface BundleItemForm {
  product: string;
  quantity: string;
}

export interface PromotionForm {
  label: string;
  buyQty: string;
  freeQty: string;
  isActive: boolean;
}

export interface ProductFormState {
  name: string;
  description: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  quantity: string;
  lowStockAlert: string;
  productType: ProductType;
  unitOfMeasure: string;
  trackInventory: boolean;
  minPrice: string;
  maxPrice: string;
  allowPriceOverride: boolean;
  bundleItems: BundleItemForm[];
  variants: VariantForm[];
  hasPromotions: boolean;
  promotions: PromotionForm[];
}

export const TYPE_OPTIONS: { value: ProductType; label: string; sub: string }[] = [
  { value: 'standard', label: 'Standard', sub: 'One fixed price' },
  { value: 'variable', label: 'Variable price', sub: 'Price is negotiated' },
  { value: 'weighted', label: 'Weighted', sub: 'Sold by weight' },
  { value: 'refillable', label: 'Refillable', sub: 'Refills tracked' },
  { value: 'service', label: 'Service', sub: 'Nothing to stock' },
  { value: 'bundle', label: 'Bundle', sub: 'Made of other products' },
  { value: 'configurable', label: 'Variants', sub: 'Sizes, colours, flavours' },
];

export const CATEGORIES = [
  'Groceries', 'Beverages', 'Household', 'Electronics',
  'Clothing', 'Health & Beauty', 'Stationery', 'Other',
];

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: '',
  description: '',
  category: '',
  sellingPrice: '',
  costPrice: '',
  quantity: '',
  lowStockAlert: '5',
  productType: 'standard',
  unitOfMeasure: 'unit',
  trackInventory: true,
  minPrice: '',
  maxPrice: '',
  allowPriceOverride: false,
  bundleItems: [],
  variants: [],
  hasPromotions: false,
  promotions: [],
};

export const EMPTY_VARIANT: VariantForm = {
  name: '',
  sellingPrice: '',
  costPrice: '',
  quantity: '0',
  sku: '',
  lowStockAlert: '5',
  commissionEnabled: false,
  commissionBasePrice: '',
  commissionEmployeeSharePercent: '100',
};

export const isComposite = (type: ProductType) => type === 'bundle' || type === 'configurable';

/** Seeds the form from an existing product, preserving fields we don't edit. */
export function productToForm(product: Product): ProductFormState {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    // Stored lowercase by the server; title-case it back for the picker.
    category: CATEGORIES.find((c) => c.toLowerCase() === product.category?.toLowerCase()) ?? product.category ?? '',
    sellingPrice: String(product.sellingPrice ?? ''),
    costPrice: String(product.costPrice ?? ''),
    quantity: String(product.quantity ?? 0),
    lowStockAlert: String(product.lowStockAlert ?? 5),
    productType: product.productType ?? 'standard',
    unitOfMeasure: product.unitOfMeasure ?? 'unit',
    trackInventory: product.trackInventory ?? true,
    minPrice: product.minPrice != null ? String(product.minPrice) : '',
    maxPrice: product.maxPrice != null ? String(product.maxPrice) : '',
    allowPriceOverride: product.allowPriceOverride ?? false,
    bundleItems: (product.bundleItems ?? []).map((b) => ({
      product: typeof b.product === 'object' ? b.product._id : b.product,
      quantity: String(b.quantity ?? 1),
    })),
    variants: (product.variants ?? []).map((v) => ({
      _id: v._id,
      name: v.name ?? '',
      sellingPrice: String(v.sellingPrice ?? ''),
      costPrice: String(v.costPrice ?? ''),
      quantity: String(v.quantity ?? 0),
      sku: v.sku ?? '',
      lowStockAlert: String(v.lowStockAlert ?? 5),
      commissionEnabled: v.commission?.enabled ?? false,
      commissionBasePrice: v.commission?.basePrice != null ? String(v.commission.basePrice) : '',
      commissionEmployeeSharePercent: String(v.commission?.employeeSharePercent ?? 100),
    })),
    hasPromotions: (product.promotions?.length ?? 0) > 0,
    promotions: (product.promotions ?? []).map((p) => ({
      label: p.label ?? '',
      buyQty: String(p.buyQty ?? ''),
      freeQty: String(p.freeQty ?? ''),
      isActive: p.isActive ?? true,
    })),
  };
}

export function toPayload(form: ProductFormState): ProductPayload {
  // Bundles and variant products carry no stock of their own — real
  // availability lives on the components or the variants.
  const composite = isComposite(form.productType);

  const payload: ProductPayload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: form.category.toLowerCase(),
    productType: form.productType,
    sellingPrice: parseFloat(form.sellingPrice) || 0,
    costPrice: parseFloat(form.costPrice) || 0,
    quantity: composite ? 0 : Math.max(0, (form.productType === 'weighted' || form.productType === 'refillable' ? Number(form.quantity) : parseInt(form.quantity, 10)) || 0),
    lowStockAlert: Math.max(0, form.lowStockAlert.trim() === '' ? 5 : Number(form.lowStockAlert)),
    trackInventory: composite ? false : form.trackInventory,
    unitOfMeasure: form.unitOfMeasure || 'unit',
  };

  if (form.productType === 'variable') {
    if (form.minPrice) payload.minPrice = parseFloat(form.minPrice);
    if (form.maxPrice) payload.maxPrice = parseFloat(form.maxPrice);
  }
  if (form.productType === 'service') {
    payload.allowPriceOverride = form.allowPriceOverride;
  }
  if (form.productType === 'bundle') {
    payload.bundleItems = form.bundleItems
      .filter((b) => b.product)
      .map((b) => ({ product: b.product, quantity: parseFloat(b.quantity) || 1 }));
  }
  if (form.productType === 'configurable') {
    payload.variants = form.variants.map((v) => ({
      ...(v._id ? { _id: v._id } : {}),
      name: v.name.trim(),
      sellingPrice: parseFloat(v.sellingPrice) || 0,
      costPrice: parseFloat(v.costPrice) || 0,
      quantity: Math.max(0, parseInt(v.quantity, 10) || 0),
      sku: v.sku.trim() || undefined,
      lowStockAlert: v.lowStockAlert.trim() === '' ? 5 : Number(v.lowStockAlert),
      commission: v.commissionEnabled
        ? {
            enabled: true,
            basePrice: parseFloat(v.commissionBasePrice) || 0,
            employeeSharePercent: parseFloat(v.commissionEmployeeSharePercent) || 100,
          }
        : { enabled: false },
    }));
  }
  // Sent even when empty, so clearing every promotion actually removes them.
  if (!composite) {
    payload.promotions = form.hasPromotions
      ? form.promotions
          .filter((p) => p.buyQty && p.freeQty)
          .map((p) => ({
            label: p.label.trim(),
            buyQty: parseInt(p.buyQty, 10) || 1,
            freeQty: parseInt(p.freeQty, 10) || 1,
            isActive: p.isActive,
          }))
      : [];
  }

  return payload;
}

export function validate(form: ProductFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Product name is required';
  if (!form.category) errors.category = 'Category is required';
  if (!form.sellingPrice || !Number.isFinite(Number(form.sellingPrice)) || Number(form.sellingPrice) <= 0) {
    errors.sellingPrice =
      form.productType === 'bundle'
        ? 'Bundle price is required'
        : form.productType === 'configurable'
          ? 'Base price is required'
          : 'Selling price is required';
  }
  if (!form.costPrice || !Number.isFinite(Number(form.costPrice)) || Number(form.costPrice) < 0) errors.costPrice = 'Cost price is required';
  if (form.productType === 'bundle' && form.bundleItems.length === 0) {
    errors.bundleItems = 'Add at least one item to the bundle';
  }
  if (form.productType === 'configurable') {
    if (form.variants.length === 0) errors.variants = 'Add at least one variant';
    else if (form.variants.some((v) => !v.name.trim() || !v.sellingPrice)) {
      errors.variants = 'Every variant needs a name and a price';
    }
  }
  if (form.productType === 'variable' && form.minPrice && form.maxPrice) {
    if (Number(form.minPrice) > Number(form.maxPrice)) {
      errors.maxPrice = 'Maximum must be at least the minimum';
    }
  }
  if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 0) errors.quantity = 'Enter a valid stock quantity';
  return errors;
}

