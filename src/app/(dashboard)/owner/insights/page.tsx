'use client';

import { useQuery } from '@tanstack/react-query';
import { getAiInsight } from '@/services/aiInsight';
import { useAiAccess } from '@/hooks/useAiAccess';
import Spinner from '@/components/ui/Spinner';
import {
  HealthScoreCard,
  AiNarrativeCard,
  AlertsList,
  TrendSummary,
  ReportsShortcut,
  UpsellCard,
  AiDisabledCard,
} from '@/components/insights/InsightSections';

export default function InsightsPage() {
  // Subscription state, plan feature, and the shop's own Smart Duka AI
  // toggle. Matches the backend's requireActiveSubscription + requireFeature
  // + requireAiEnabled on GET /ai/insight.
  const { hasAiAccess: hasAiInsights, state: aiAccessState, isLoading: isSubscriptionLoading } = useAiAccess();

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
        aiAccessState === 'disabled' ? <AiDisabledCard /> : <UpsellCard />
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
