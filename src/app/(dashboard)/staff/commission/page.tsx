'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Card from '@/components/ui/Card';
import CommissionCard from '@/components/sales/CommissionCard';
import { useShop } from '@/hooks/useShop';
import {
  getCommissionPeriodRange,
  getMyCommission,
  type CommissionPeriod,
} from '@/services/commission';

export default function MyCommissionPage() {
  const { showStaffCommission, currency, isLoading: shopLoading } = useShop();
  const [period, setPeriod] = useState<CommissionPeriod>('today');
  const { startDate, endDate } = getCommissionPeriodRange(period);

  const { data, isLoading, error } = useQuery({
    queryKey: ['myCommission', period],
    queryFn: () => getMyCommission({ startDate, endDate }),
    enabled: showStaffCommission,
    retry: false,
  });

  // The shop flag and the server's own check can disagree briefly (a flag
  // flipped in another session), so handle both rather than trusting one.
  const forbidden = (error as AxiosError)?.response?.status === 403;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>My Commission</h1>
        <p className="text-gray-500 text-sm mt-1">What you&apos;ve earned on top of your pay</p>
      </div>

      {!shopLoading && !showStaffCommission ? (
        <Card>
          <p className="text-sm text-gray-600 py-2">
            Your shop doesn&apos;t show commission to staff.
          </p>
        </Card>
      ) : (
        <CommissionCard
          data={data}
          isLoading={isLoading}
          forbidden={forbidden}
          period={period}
          onPeriodChange={setPeriod}
          currency={currency}
        />
      )}
    </div>
  );
}
