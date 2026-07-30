'use client';

import Link from 'next/link';
import { BarChart3, Package, Receipt, ShoppingBag, ShoppingCart, type LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

interface Action {
  href: string;
  icon: LucideIcon;
  label: string;
}

/**
 * The four things an owner opens the dashboard to do. Purchasing only appears
 * when the shop has it switched on.
 */
export default function QuickActions({ purchasingEnabled }: { purchasingEnabled: boolean }) {
  const actions: Action[] = [
    { href: '/owner/sales', icon: ShoppingCart, label: 'New sale' },
    { href: '/owner/expenses', icon: Receipt, label: 'Log expense' },
    { href: '/owner/inventory/new', icon: Package, label: 'Add product' },
    ...(purchasingEnabled
      ? [{ href: '/owner/purchases/new', icon: ShoppingBag, label: 'Record purchase' }]
      : [{ href: '/owner/reports', icon: BarChart3, label: 'Reports' }]),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href}>
          <Card padding="sm" className="h-full text-center hover:border-teal-200 transition-colors">
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: '#0F766E' }} />
            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>{label}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
