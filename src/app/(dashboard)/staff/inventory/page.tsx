'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Table, { type Column } from '@/components/ui/Table';
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

export default function StaffInventoryPage() {
  const fmt = useMoney();
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

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFBF1' }}>
            <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
          </div>
          <p className="font-medium" style={{ color: '#0F172A' }}>{p.name}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge color="gray">{p.category || 'General'}</Badge> },
    {
      key: 'sellingPrice',
      header: 'Price',
      render: (p) => <span className="font-semibold tabular-nums" style={{ color: '#0F766E' }}>{fmt(p.sellingPrice)}</span>,
    },
    { key: 'quantity', header: 'Stock', render: (p) => <span className="tabular-nums">{p.quantity} {p.unitOfMeasure || 'unit'}</span> },
    { key: 'status', header: 'Status', render: stockStatus },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Products</h1>
        <p className="text-gray-500 text-sm mt-1">Browse available products and stock levels</p>
      </div>

      <Input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search products…"
        icon={<Search className="w-4 h-4" />}
      />

      <Card padding="none" className="overflow-hidden">
        <Table<Product>
          columns={columns}
          data={products}
          keyExtractor={(p) => p._id}
          loading={isLoading}
          emptyMessage="No products found."
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-control border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >Previous</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-control border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
