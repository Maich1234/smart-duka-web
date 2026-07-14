'use client';

import { useQuery } from '@tanstack/react-query';
import { getAiInsight } from '@/services/aiInsight';
import { useSubscription } from '@/hooks/useSubscription';
import Spinner from '@/components/ui/Spinner';
import {
  HealthScoreCard,
  AiNarrativeCard,
  AlertsList,
  TrendSummary,
  ReportsShortcut,
  UpsellCard,
} from '@/components/insights/InsightSections';

export default function InsightsPage() {
  const { access, isLoading: isSubscriptionLoading } = useSubscription();
  // AI insights are available to any active subscription (trial, paid, or
  // grace) — no plan-tier gate. Matches the backend's requireActiveSubscription.
  const hasAiInsights = access?.state === 'trialing' || access?.state === 'active' || access?.state === 'grace';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['aiInsight'],
    queryFn: getAiInsight,
    enabled: hasAiInsights,
    staleTime: 5 * 60_000,
  });

  const insight = data?.data.insight;
  const snapshot = data?.data.snapshot;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Insights</h1>
        <p className="text-gray-500 text-sm mt-1">Your business, explained</p>
      </div>

      {isSubscriptionLoading || (hasAiInsights && isLoading) ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !hasAiInsights ? (
        <UpsellCard />
      ) : insight && snapshot ? (
        <div className="space-y-5">
          <HealthScoreCard health={snapshot.health} />
          <AiNarrativeCard insight={insight} cachedNote={isFetching ? 'Refreshing…' : undefined} />
          <AlertsList alerts={snapshot.alerts} />
          <TrendSummary trend={snapshot.trend} />
          <ReportsShortcut />
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400">Couldn&apos;t load insights. Try refreshing the page.</p>
        </div>
      )}
    </div>
  );
}
