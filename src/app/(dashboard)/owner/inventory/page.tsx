'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Table, { type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useMoney } from '@/lib/money';

interface Product {
  _id: string;
  name: string;
  category: string;
  sellingPrice: number;
  quantity: number;
  unitOfMeasure: string;
  lowStockAlert: number;
}

interface ProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function InventoryPage() {
  const fmt = useMoney();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', page, search],
    queryFn: async () => {
      const res = await api.get(`/products?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      return {
        products: res.data.data || [],
        totalPages: res.data.pagination?.pages || 1,
        currentPage: res.data.pagination?.page || 1,
        total: res.data.pagination?.total || 0,
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || 'Failed to delete product', 'error');
    },
  });

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;

  const stockStatus = (p: Product) => {
    if (p.quantity === 0) return <Badge color="red">Out of Stock</Badge>;
    if (p.quantity <= p.lowStockAlert) return <Badge color="yellow">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFBF1' }}>
            <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
          </div>
          <span className="font-medium" style={{ color: '#0F172A' }}>{p.name}</span>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge color="gray">{p.category || 'General'}</Badge> },
    {
      key: 'sellingPrice',
      header: 'Price',
      render: (p) => <span className="font-semibold tabular-nums" style={{ color: '#0F172A' }}>{fmt(p.sellingPrice)}</span>,
    },
    { key: 'quantity', header: 'Stock', render: (p) => <span className="tabular-nums">{p.quantity} {p.unitOfMeasure || 'unit'}</span> },
    { key: 'status', header: 'Status', render: stockStatus },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1">
          <Link href={`/owner/inventory/${p._id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edit product">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="hover:bg-red-50" aria-label="Delete product" onClick={() => setDeleteId(p._id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products and stock levels</p>
        </div>
        <Link href="/owner/inventory/new" className="shrink-0">
          <Button>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* Search & filters */}
      <Card padding="sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-control border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <Table<Product>
          columns={columns}
          data={products}
          keyExtractor={(p) => p._id}
          loading={isLoading}
          emptyMessage="No products found. Add your first product!"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
