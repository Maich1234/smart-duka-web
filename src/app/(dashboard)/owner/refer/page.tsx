'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Copy, Check, Users } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface ReferralData {
  code: string;
  shareUrl: string;
  enabled: boolean;
  perReferralPercent: number;
  discountPercentBanked: number;
  referrals: { shopName: string; status: 'pending' | 'converted'; joinedAt: string }[];
}

export default function ReferPage() {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shop', 'referrals'],
    queryFn: async () => (await api.get('/shop/referrals')).data.data as ReferralData,
  });

  const copy = async (value: string, which: 'code' | 'link') => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!data?.enabled) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#0F172A' }}>Refer &amp; Earn</h1>
        <Card className="mt-6 text-center py-12">
          <Gift className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">The referral program isn&apos;t live yet — check back soon.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#0F172A' }}>Refer &amp; Earn</h1>
      <p className="text-gray-500 text-sm mb-6">
        Invite other shop owners to Dukana. When someone you invite becomes a paying customer, you get{' '}
        {data.perReferralPercent}% off your next subscription payment.
      </p>

      <Card className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your referral code</p>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 px-4 py-3 rounded-xl border text-lg font-bold tracking-widest text-center" style={{ borderColor: '#e2e8f0', color: '#0F172A' }}>
            {data.code}
          </div>
          <Button variant="outline" onClick={() => copy(data.code, 'code')} aria-label="Copy code">
            {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Or share your link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 rounded-xl border text-sm truncate bg-gray-50" style={{ borderColor: '#e2e8f0', color: '#0F172A' }}>
            {data.shareUrl}
          </div>
          <Button variant="outline" onClick={() => copy(data.shareUrl, 'link')} aria-label="Copy link">
            {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Discount banked for your next payment</p>
        <p className="text-3xl font-extrabold" style={{ color: '#0F766E' }}>{data.discountPercentBanked}%</p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">People you&apos;ve referred</p>
        </div>
        {data.referrals.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No referrals yet — share your code to get started.</p>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium" style={{ color: '#0F172A' }}>{r.shopName}</span>
                <Badge color={r.status === 'converted' ? 'teal' : 'gray'}>
                  {r.status === 'converted' ? 'Converted' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
