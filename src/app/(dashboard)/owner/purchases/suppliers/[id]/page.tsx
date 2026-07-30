'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import SupplierFormModal from '@/components/purchases/SupplierFormModal';
import { getSupplier } from '@/services/suppliers';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currency } = useShop();
  const user = useAuthStore((s) => s.user);
  const canEdit = hasPermission(user, 'edit_purchases');
  // Money is stripped from the API response for staff without this, so it
  // has to gate the display too rather than rendering NaN.
  const canSeePrices = hasPermission(user, 'view_purchase_prices');
  const [editing, setEditing] = useState(false);

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id),
  });

  const fmt = (n?: number) =>
    n == null ? '—' : `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/purchases/suppliers">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
            {supplier?.name ?? 'Supplier'}
          </h1>
        </div>
        {supplier && canEdit && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError || !supplier ? (
        <Card><p className="text-sm text-gray-500 py-4 text-center">Couldn&apos;t load this supplier.</p></Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {supplier.phone && (
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {supplier.phone}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {supplier.email}
                </span>
              )}
              {supplier.location && (
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" /> {supplier.location}
                </span>
              )}
              {!supplier.isActive && <Badge color="gray">Removed</Badge>}
            </div>
            {supplier.notes && (
              <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">{supplier.notes}</p>
            )}
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Purchases</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {supplier.stats.purchaseCount}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total spend</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {canSeePrices ? fmt(supplier.stats.totalSpend) : '—'}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {canSeePrices ? fmt(supplier.stats.averagePurchaseCost) : '—'}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Last bought</p>
              <p className="text-sm font-bold mt-1" style={{ color: '#0F172A' }}>
                {supplier.stats.lastPurchaseDate
                  ? format(new Date(supplier.stats.lastPurchaseDate), 'd MMM yyyy')
                  : 'Never'}
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Recent purchases</h2>
            {supplier.recentPurchases.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing bought from them yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {supplier.recentPurchases.map((purchase) => (
                  <Link
                    key={purchase._id}
                    href={`/owner/purchases/${purchase._id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-600">
                      {format(new Date(purchase.createdAt), 'd MMM yyyy')}
                    </span>
                    <span className="flex items-center gap-3">
                      {purchase.status !== 'completed' && (
                        <Badge color="yellow">{purchase.status.replace(/_/g, ' ')}</Badge>
                      )}
                      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                        {canSeePrices ? fmt(purchase.grandTotal) : '—'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {editing && supplier && (
        <SupplierFormModal isOpen supplier={supplier} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
