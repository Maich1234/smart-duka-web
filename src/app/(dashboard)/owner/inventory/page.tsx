'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

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
  const queryClient = useQueryClient();
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
  });

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;

  const stockStatus = (p: Product) => {
    if (p.quantity === 0) return <Badge color="red">Out of Stock</Badge>;
    if (p.quantity <= p.lowStockAlert) return <Badge color="yellow">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No products found. Add your first product!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
                            <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
                          </div>
                          <span className="font-medium" style={{ color: '#0F172A' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="gray">{p.category || 'General'}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#0F172A' }}>
                        KES {p.sellingPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.quantity} {p.unitOfMeasure || 'unit'}
                      </td>
                      <td className="px-4 py-3">{stockStatus(p)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/owner/inventory/${p._id}/edit`}>
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F766E] hover:bg-[#CCFBF1] transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

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
