'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
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

export default function StaffInventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ products: Product[]; totalPages: number }>({
    queryKey: ['staff-products', page, search],
    queryFn: async () => {
      const res = await api.get(`/products?page=${page}&limit=15&search=${encodeURIComponent(search)}`);
      return {
        products: res.data.data || [],
        totalPages: res.data.pagination?.pages || 1,
      };
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
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Products</h1>
        <p className="text-gray-500 text-sm mt-1">Browse available products and stock levels</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No products found.</p>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
                            <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
                          </div>
                          <p className="font-medium" style={{ color: '#0F172A' }}>{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge color="gray">{p.category || 'General'}</Badge></td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#0F766E' }}>KES {p.sellingPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{p.quantity} {p.unitOfMeasure || 'unit'}</td>
                      <td className="px-4 py-3">{stockStatus(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >Previous</button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
