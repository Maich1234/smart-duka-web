'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';

// Deliberately a bare axios call, same reasoning as /r/[token]/page.tsx: this
// page has no login of its own and must never attach the normal session
// Authorization header. The webview token in the URL *is* the auth — it's
// short-lived and single-purpose (see backend utils/webviewToken.js) — and
// nothing else on the page needs the regular @/lib/api client.

interface SetupStatus {
  hasProducts: boolean;
  hasSales: boolean;
  hasMpesa: boolean;
  hasStaff: boolean;
}

interface Step {
  key: keyof SetupStatus;
  title: string;
  description: string;
  route: string;
  helpSlug?: string;
}

const STEPS: Step[] = [
  {
    key: 'hasProducts',
    title: 'Add your first product',
    description: 'Build your catalogue so items show up on the Sales screen.',
    route: '/(owner)/inventory/new',
    helpSlug: 'adding-products',
  },
  {
    key: 'hasSales',
    title: 'Make your first sale',
    description: 'Ring up a sale and watch your reports update automatically.',
    route: '/(owner)/sales',
    helpSlug: 'recording-sales',
  },
  {
    key: 'hasMpesa',
    title: 'Connect M-Pesa',
    description: 'Add your Paybill or Till so customers can pay straight to your account.',
    route: '/(owner)/payments',
  },
  {
    key: 'hasStaff',
    title: 'Invite your team',
    description: 'Give staff their own logins with only the permissions they need.',
    route: '/(owner)/staff',
    helpSlug: 'staff-permissions',
  },
];

/** The fixed message vocabulary the native wrapper (app/(owner)/setup-guide.tsx) understands. */
function postToApp(message: { type: 'navigate'; route: string }) {
  const bridge = (window as unknown as { ReactNativeWebView?: { postMessage: (s: string) => void } }).ReactNativeWebView;
  bridge?.postMessage(JSON.stringify(message));
}

function SetupGuideContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing link. Reopen the Setup Guide from the app.');
      return;
    }
    axios
      .get(`${API_BASE_URL}/setup/status`, { params: { token } })
      .then((res) => setStatus(res.data.data))
      .catch((err) => {
        const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(message || 'Could not load your setup status. Reopen the Setup Guide from the app.');
      });
  }, [token]);

  if (error) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
        <AlertCircle style={{ width: 32, height: 32, color: '#B91C1C', margin: '0 auto 12px' }} />
        <p style={{ color: '#334155', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: 14 }}>Loading your setup status…</p>
      </div>
    );
  }

  const doneCount = STEPS.filter((s) => status[s.key]).length;
  const allDone = doneCount === STEPS.length;

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Get your shop running</h1>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        {allDone ? 'Every step is done — your shop is fully set up.' : `${doneCount} of ${STEPS.length} done`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((step) => {
          const done = status[step.key];
          return (
            <div
              key={step.key}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: 16,
                backgroundColor: done ? '#F0FDFA' : '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {done ? (
                  <CheckCircle2 style={{ width: 20, height: 20, color: '#0F766E', flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <Circle style={{ width: 20, height: 20, color: '#CBD5E1', flexShrink: 0, marginTop: 1 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{step.title}</p>
                  <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{step.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    {!done && (
                      <button
                        onClick={() => postToApp({ type: 'navigate', route: step.route })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#FFFFFF',
                          backgroundColor: '#0F766E',
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        Do this now <ChevronRight style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                    {step.helpSlug && (
                      <Link
                        href={`/help/${step.helpSlug}`}
                        style={{ fontSize: 12.5, color: '#0F766E', textDecoration: 'underline' }}
                      >
                        Learn more
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SetupGuideEmbedPage() {
  return (
    <Suspense fallback={null}>
      <SetupGuideContent />
    </Suspense>
  );
}
