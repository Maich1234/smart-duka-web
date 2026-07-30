'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductForm, {
  EMPTY_PRODUCT_FORM,
  toPayload,
  validate,
  type ProductFormState,
} from '@/components/inventory/ProductForm';
import { createProduct, getProducts } from '@/services/products';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Only needed to populate the bundle picker, so it's fetched unconditionally
  // but cheaply — the list is already cached by the inventory page.
  const { data: productsData } = useQuery({
    queryKey: ['products', ''],
    queryFn: () => getProducts({ search: '' }),
  });

  const mutation = useMutation({
    mutationFn: () => createProduct(toPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/owner/inventory');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setServerError(err?.response?.data?.message || 'Could not create the product.');
    },
  });

  const handleSave = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setServerError('');
    mutation.mutate();
  };

  return (
    <ProductForm
      form={form}
      setForm={setForm}
      errors={errors}
      onSave={handleSave}
      saving={mutation.isPending}
      availableProducts={productsData?.data ?? []}
      serverError={serverError}
    />
  );
}
