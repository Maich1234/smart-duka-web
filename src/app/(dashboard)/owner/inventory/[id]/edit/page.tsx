'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import ProductForm, {
  EMPTY_PRODUCT_FORM,
  productToForm,
  toPayload,
  validate,
  type ProductFormState,
} from '@/components/inventory/ProductForm';
import { getProduct, getProducts, updateProduct } from '@/services/products';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [seeded, setSeeded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', ''],
    queryFn: () => getProducts({ search: '' }),
  });

  // Seed once. A background refetch must not overwrite an in-progress edit.
  useEffect(() => {
    if (product && !seeded) {
      setForm(productToForm(product));
      setSeeded(true);
    }
  }, [product, seeded]);

  const mutation = useMutation({
    mutationFn: () => updateProduct(id, toPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['priceHealth'] });
      queryClient.invalidateQueries({ queryKey: ['aiInsight'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      router.push('/owner/inventory');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setServerError(err?.response?.data?.message || 'Could not save the product.');
    },
  });

  const handleSave = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setServerError('');
    mutation.mutate();
  };

  if (isError) return <div className="space-y-4 p-6" role="alert"><p>Could not load this product. It may be unavailable or your connection was interrupted.</p><Button onClick={() => refetch()}>Retry</Button><Button variant="outline" onClick={() => router.push('/owner/inventory')}>Back to inventory</Button></div>;

  if (isLoading || !seeded) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProductForm
      isEditing
      form={form}
      setForm={setForm}
      errors={errors}
      onSave={handleSave}
      saving={mutation.isPending}
      // A product can't contain itself.
      availableProducts={(productsData?.data ?? []).filter((p) => p._id !== id)}
      serverError={serverError}
    />
  );
}
