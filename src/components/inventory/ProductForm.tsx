'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import VariantCommissionModal from './VariantCommissionModal';
import { usePresets } from '@/hooks/usePresets';
import { useShop } from '@/hooks/useShop';
import type { Product, ProductPayload, ProductType } from '@/services/products';

/**
 * Create/edit a product, including the things the web app could previously
 * only *sell* but never set up: variants, bundles and promotions.
 *
 * Form state is all strings — number inputs hand back strings, and coercing
 * on every keystroke makes a half-typed "1." unrepresentable. Coercion
 * happens once, in toPayload().
 */

export interface VariantForm {
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

const TYPE_OPTIONS: { value: ProductType; label: string; sub: string }[] = [
  { value: 'standard', label: 'Standard', sub: 'One fixed price' },
  { value: 'variable', label: 'Variable price', sub: 'Price is negotiated' },
  { value: 'weighted', label: 'Weighted', sub: 'Sold by weight' },
  { value: 'refillable', label: 'Refillable', sub: 'Refills tracked' },
  { value: 'service', label: 'Service', sub: 'Nothing to stock' },
  { value: 'bundle', label: 'Bundle', sub: 'Made of other products' },
  { value: 'configurable', label: 'Variants', sub: 'Sizes, colours, flavours' },
];

const CATEGORIES = [
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

const EMPTY_VARIANT: VariantForm = {
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

const isComposite = (type: ProductType) => type === 'bundle' || type === 'configurable';

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
    quantity: composite ? 0 : parseInt(form.quantity, 10) || 0,
    lowStockAlert: parseInt(form.lowStockAlert, 10) || 5,
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
      name: v.name.trim(),
      sellingPrice: parseFloat(v.sellingPrice) || 0,
      costPrice: parseFloat(v.costPrice) || 0,
      quantity: parseInt(v.quantity, 10) || 0,
      sku: v.sku.trim() || undefined,
      lowStockAlert: parseInt(v.lowStockAlert, 10) || 5,
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
  if (!form.sellingPrice || Number(form.sellingPrice) <= 0) {
    errors.sellingPrice =
      form.productType === 'bundle'
        ? 'Bundle price is required'
        : form.productType === 'configurable'
          ? 'Base price is required'
          : 'Selling price is required';
  }
  if (!form.costPrice || Number(form.costPrice) < 0) errors.costPrice = 'Cost price is required';
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
  return errors;
}

interface ProductFormProps {
  form: ProductFormState;
  setForm: (next: ProductFormState) => void;
  errors: Record<string, string>;
  onSave: () => void;
  saving?: boolean;
  isEditing?: boolean;
  /** Simple products that can be put inside a bundle. */
  availableProducts?: Product[];
  serverError?: string;
}

export default function ProductForm({
  form,
  setForm,
  errors,
  onSave,
  saving,
  isEditing,
  availableProducts = [],
  serverError,
}: ProductFormProps) {
  const { unitsOfMeasure } = usePresets();
  const { showStaffCommission, currency } = useShop();
  const [commissionIndex, setCommissionIndex] = useState<number | null>(null);

  const update = (patch: Partial<ProductFormState>) => setForm({ ...form, ...patch });
  const composite = isComposite(form.productType);

  const bundleOptions = useMemo(
    () => availableProducts.filter((p) => !isComposite(p.productType)),
    [availableProducts]
  );

  const patchVariant = (index: number, patch: Partial<VariantForm>) =>
    update({ variants: form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) });

  const patchPromotion = (index: number, patch: Partial<PromotionForm>) =>
    update({ promotions: form.promotions.map((p, i) => (i === index ? { ...p, ...patch } : p)) });

  const patchBundleItem = (index: number, patch: Partial<BundleItemForm>) =>
    update({ bundleItems: form.bundleItems.map((b, i) => (i === index ? { ...b, ...patch } : b)) });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/inventory">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditing ? 'Update this product' : 'Add a new product to your inventory'}
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
      )}

      {/* ── What kind of product ─────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>Product type</h2>
        <p className="text-xs text-gray-500 mb-4">
          Decides how the till prices and counts it. Most things are Standard.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((option) => {
            const active = form.productType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => update({ productType: option.value })}
                className="text-left p-3 rounded-xl border transition-colors"
                style={{
                  borderColor: active ? '#0F766E' : '#E5E7EB',
                  backgroundColor: active ? '#F0FDFA' : 'white',
                }}
              >
                <span className="block text-sm font-semibold" style={{ color: active ? '#0F766E' : '#0F172A' }}>
                  {option.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">{option.sub}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Basics ───────────────────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Basic information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Product name *"
              placeholder="e.g. Unga Pembe 2kg"
              value={form.name}
              error={errors.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Category *</label>
            <select
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Unit</label>
            <select
              value={form.unitOfMeasure}
              onChange={(e) => update({ unitOfMeasure: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white"
            >
              {unitsOfMeasure.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Optional"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white resize-none"
            />
          </div>
        </div>
      </Card>

      {/* ── Pricing & stock ──────────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Pricing &amp; stock</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label={`${form.productType === 'bundle' ? 'Bundle' : form.productType === 'configurable' ? 'Base' : 'Selling'} price (${currency}) *`}
            type="number"
            step="0.01"
            value={form.sellingPrice}
            error={errors.sellingPrice}
            onChange={(e) => update({ sellingPrice: e.target.value })}
          />
          <Input
            label={`Cost price (${currency}) *`}
            type="number"
            step="0.01"
            value={form.costPrice}
            error={errors.costPrice}
            onChange={(e) => update({ costPrice: e.target.value })}
          />

          {form.productType === 'variable' && (
            <>
              <Input
                label={`Minimum price (${currency})`}
                type="number"
                step="0.01"
                hint="The lowest the till will accept"
                value={form.minPrice}
                onChange={(e) => update({ minPrice: e.target.value })}
              />
              <Input
                label={`Maximum price (${currency})`}
                type="number"
                step="0.01"
                value={form.maxPrice}
                error={errors.maxPrice}
                onChange={(e) => update({ maxPrice: e.target.value })}
              />
            </>
          )}

          {!composite && (
            <>
              <Input
                label="Current stock"
                type="number"
                value={form.quantity}
                onChange={(e) => update({ quantity: e.target.value })}
              />
              <Input
                label="Low stock alert"
                type="number"
                hint="Warn when stock drops below this"
                value={form.lowStockAlert}
                onChange={(e) => update({ lowStockAlert: e.target.value })}
              />
            </>
          )}
        </div>

        {composite && (
          <p className="mt-3 text-xs text-gray-500">
            {form.productType === 'bundle'
              ? "Stock isn't tracked on a bundle — availability comes from the products inside it."
              : "Stock isn't tracked on the parent — each variant carries its own."}
          </p>
        )}

        {!composite && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Track stock</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Turn off for things you never run out of, like a service.
              </p>
            </div>
            <Toggle
              label="Track stock"
              checked={form.trackInventory}
              onChange={(next) => update({ trackInventory: next })}
            />
          </div>
        )}

        {form.productType === 'service' && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Allow price override</p>
              <p className="text-xs text-gray-500 mt-0.5">Let staff set the price at the till.</p>
            </div>
            <Toggle
              label="Allow price override"
              checked={form.allowPriceOverride}
              onChange={(next) => update({ allowPriceOverride: next })}
            />
          </div>
        )}
      </Card>

      {/* ── Bundle contents ──────────────────────────────────────────────── */}
      {form.productType === 'bundle' && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>What&apos;s in the bundle</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={bundleOptions.length === 0}
              onClick={() =>
                update({
                  bundleItems: [...form.bundleItems, { product: bundleOptions[0]?._id ?? '', quantity: '1' }],
                })
              }
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </Button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Selling the bundle takes each of these out of stock.</p>

          {bundleOptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Create a standard product first — a bundle has to be made of something.
            </p>
          ) : form.bundleItems.length === 0 ? (
            <p className="text-sm text-gray-500">No items yet.</p>
          ) : (
            <div className="space-y-2">
              {form.bundleItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={item.product}
                    onChange={(e) => patchBundleItem(index, { product: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  >
                    {bundleOptions.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => patchBundleItem(index, { quantity: e.target.value })}
                    aria-label="Quantity"
                    className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  />
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => update({ bundleItems: form.bundleItems.filter((_, i) => i !== index) })}
                    className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.bundleItems && <p className="mt-2 text-xs text-red-500">{errors.bundleItems}</p>}
        </Card>
      )}

      {/* ── Variants ─────────────────────────────────────────────────────── */}
      {form.productType === 'configurable' && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Variants</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => update({ variants: [...form.variants, { ...EMPTY_VARIANT }] })}
            >
              <Plus className="w-3.5 h-3.5" /> Add variant
            </Button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Each one has its own price and stock, and appears as a choice at the till.
          </p>

          {form.variants.length === 0 ? (
            <p className="text-sm text-gray-500">No variants yet.</p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((variant, index) => (
                <div key={index} className="p-3 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Variant name, e.g. 500ml"
                        value={variant.name}
                        onChange={(e) => patchVariant(index, { name: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove variant"
                      onClick={() => update({ variants: form.variants.filter((_, i) => i !== index) })}
                      className="w-9 h-9 mt-0.5 shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      value={variant.sellingPrice}
                      onChange={(e) => patchVariant(index, { sellingPrice: e.target.value })}
                    />
                    <Input
                      label="Cost"
                      type="number"
                      step="0.01"
                      value={variant.costPrice}
                      onChange={(e) => patchVariant(index, { costPrice: e.target.value })}
                    />
                    <Input
                      label="Stock"
                      type="number"
                      value={variant.quantity}
                      onChange={(e) => patchVariant(index, { quantity: e.target.value })}
                    />
                    <Input
                      label="SKU"
                      value={variant.sku}
                      onChange={(e) => patchVariant(index, { sku: e.target.value })}
                    />
                  </div>

                  {/* Only offered when the shop actually pays commission —
                      otherwise it's a setting with nowhere to show up. */}
                  {showStaffCommission && (
                    <button
                      type="button"
                      onClick={() => setCommissionIndex(index)}
                      className="text-xs font-semibold underline"
                      style={{ color: '#0F766E' }}
                    >
                      {variant.commissionEnabled
                        ? `Commission on · base ${currency} ${variant.commissionBasePrice || 0}, staff ${variant.commissionEmployeeSharePercent || 100}%`
                        : 'Set up commission'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {errors.variants && <p className="mt-2 text-xs text-red-500">{errors.variants}</p>}
        </Card>
      )}

      {/* ── Promotions ───────────────────────────────────────────────────── */}
      {!composite && (
        <Card>
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Promotions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Buy a number, get some free. Applied at the till.</p>
            </div>
            <Toggle
              label="Promotions"
              checked={form.hasPromotions}
              onChange={(next) =>
                update({
                  hasPromotions: next,
                  promotions: next && form.promotions.length === 0
                    ? [{ label: '', buyQty: '4', freeQty: '1', isActive: true }]
                    : form.promotions,
                })
              }
            />
          </div>

          {form.hasPromotions && (
            <div className="mt-4 space-y-2">
              {form.promotions.map((promo, index) => (
                <div key={index} className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-gray-200">
                  <input
                    value={promo.label}
                    onChange={(e) => patchPromotion(index, { label: e.target.value })}
                    placeholder="Label, e.g. Crate offer"
                    className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  />
                  <span className="text-xs text-gray-500">Buy</span>
                  <input
                    type="number"
                    min="1"
                    value={promo.buyQty}
                    onChange={(e) => patchPromotion(index, { buyQty: e.target.value })}
                    aria-label="Buy quantity"
                    className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  />
                  <span className="text-xs text-gray-500">get</span>
                  <input
                    type="number"
                    min="1"
                    value={promo.freeQty}
                    onChange={(e) => patchPromotion(index, { freeQty: e.target.value })}
                    aria-label="Free quantity"
                    className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  />
                  <span className="text-xs text-gray-500">free</span>
                  <Toggle
                    label="Promotion active"
                    checked={promo.isActive}
                    onChange={(next) => patchPromotion(index, { isActive: next })}
                  />
                  <button
                    type="button"
                    aria-label="Remove promotion"
                    onClick={() => update({ promotions: form.promotions.filter((_, i) => i !== index) })}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update({ promotions: [...form.promotions, { label: '', buyQty: '4', freeQty: '1', isActive: true }] })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add promotion
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Link href="/owner/inventory">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" />
          {isEditing ? 'Save changes' : 'Save product'}
        </Button>
      </div>

      {commissionIndex !== null && form.variants[commissionIndex] && (
        <VariantCommissionModal
          isOpen
          currency={currency}
          variant={form.variants[commissionIndex]}
          onClose={() => setCommissionIndex(null)}
          onSave={(patch) => {
            patchVariant(commissionIndex, patch);
            setCommissionIndex(null);
          }}
        />
      )}
    </div>
  );
}
