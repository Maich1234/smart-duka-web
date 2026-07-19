'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { useAiAccess } from '@/hooks/useAiAccess';

// Same hosted Help Center the mobile app links out to (constants/config.ts's
// HELP_CENTER_URL there) — one shared content source, no separate web copy.
const HELP_URL = 'https://smart-duka--01nm282g2e.expo.app/help/smart-duka-ai';

/**
 * Profile's "Smart Duka AI" card — its own section, separate from the plain
 * Shop Details form, since this one combines subscription-gated upsell with
 * an owner opt-in/out once subscribed (see hooks/useAiAccess.ts).
 */
export function SmartDukaAiCard() {
  const { state, aiEnabled } = useAiAccess();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => api.put('/shop', { aiEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopConfig'] });
      queryClient.invalidateQueries({ queryKey: ['aiInsight'] });
    },
  });

  const isSubscribed = state === 'disabled' || state === 'enabled';

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
          <Sparkles className="w-5 h-5" style={{ color: '#B45309' }} />
        </div>
        <h2 className="font-bold" style={{ color: '#0F172A' }}>Smart Duka AI</h2>
      </div>

      {!isSubscribed ? (
        <Link href="/owner/subscription" className="flex items-center justify-between gap-3 group">
          <p className="text-sm text-gray-500 max-w-sm">
            Daily insights and a business chat assistant — included with any active subscription.
          </p>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
        </Link>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Enable Smart Duka AI</p>
              <p className="text-xs text-gray-500 mt-0.5">Daily insights and a business chat assistant, powered by Gemini</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aiEnabled}
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(!aiEnabled)}
              className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
              style={{ backgroundColor: aiEnabled ? '#0F766E' : '#E5E7EB' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: aiEnabled ? 'translateX(22px)' : 'translateX(4px)' }}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center justify-between gap-3 pt-4 border-t border-gray-100 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#0F766E' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#0F172A' }}>What data does Gemini see?</p>
                <p className="text-xs text-gray-500 mt-0.5">Review what&apos;s shared and how it&apos;s stored</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
          </button>
        </div>
      )}

      <a
        href={HELP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-100 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
            <HelpCircle className="w-4 h-4" style={{ color: '#0F766E' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Help with Smart Duka AI</p>
            <p className="text-xs text-gray-500 mt-0.5">How it works, what it can do, and how to turn it on</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
      </a>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Smart Duka AI & your data" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          Smart Duka AI (powered by Google Gemini) reads a summary of your shop&apos;s sales, inventory, expenses, and aggregated staff performance to answer questions and generate insights. It never sees customer personal data.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mt-3">
          Conversations are stored securely and linked to your shop so you can revisit them later.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mt-3">
          Turning this off stops all Gemini processing for your shop immediately.
        </p>
      </Modal>
    </Card>
  );
}
