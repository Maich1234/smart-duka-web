'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import {
  disconnectMpesa,
  getPaymentConfig,
  saveMpesaConfig,
  type SaveMpesaConfigPayload,
} from '@/services/paymentConfig';

/**
 * The Daraja credential editor, shown once the owner has passed OTP.
 *
 * Secrets come back masked and are only sent when actually retyped — so
 * editing the business name doesn't require re-entering three API keys, and
 * a blank secret field means "leave it alone" rather than "clear it".
 */
export default function MpesaConfigForm({
  verificationToken,
  onDone,
  onTokenExpired,
}: {
  verificationToken: string;
  onDone: () => void;
  /** The token is short-lived; a 401 means re-verify rather than "try again". */
  onTokenExpired: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SaveMpesaConfigPayload>({
    environment: 'sandbox',
    businessName: '',
    shortcode: '',
  });
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const { data: config, isLoading, error: loadError } = useQuery({
    queryKey: ['paymentConfig'],
    queryFn: () => getPaymentConfig(verificationToken),
    retry: false,
  });

  useEffect(() => {
    if ((loadError as { response?: { status?: number } })?.response?.status === 401) onTokenExpired();
  }, [loadError, onTokenExpired]);

  useEffect(() => {
    if (config && !seeded) {
      setForm({
        environment: config.environment ?? 'sandbox',
        businessName: config.businessName ?? '',
        shortcode: config.shortcode ?? '',
        initiatorName: config.initiatorName ?? '',
      });
      setSeeded(true);
    }
  }, [config, seeded]);

  const update = (patch: Partial<SaveMpesaConfigPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleError = (err: unknown, fallback: string) => {
    const e = err as { response?: { status?: number; data?: { message?: string } } };
    // 401 here means the verification token aged out, not that the session
    // is gone — re-prompt for a code rather than showing a dead end.
    if (e?.response?.status === 401) return onTokenExpired();
    setError(e?.response?.data?.message || fallback);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      // Only send secrets that were actually typed. Empty means unchanged.
      const payload: SaveMpesaConfigPayload = {
        environment: form.environment,
        businessName: form.businessName.trim(),
        shortcode: form.shortcode.trim(),
      };
      if (form.consumerKey?.trim()) payload.consumerKey = form.consumerKey.trim();
      if (form.consumerSecret?.trim()) payload.consumerSecret = form.consumerSecret.trim();
      if (form.passkey?.trim()) payload.passkey = form.passkey.trim();
      if (form.initiatorName?.trim()) payload.initiatorName = form.initiatorName.trim();
      if (form.securityCredential?.trim()) payload.securityCredential = form.securityCredential.trim();
      return saveMpesaConfig(payload, verificationToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-status'] });
      queryClient.invalidateQueries({ queryKey: ['paymentConfig'] });
      onDone();
    },
    onError: (err) => handleError(err, 'Could not save those credentials.'),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectMpesa(verificationToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-status'] });
      queryClient.invalidateQueries({ queryKey: ['paymentConfig'] });
      onDone();
    },
    onError: (err) => handleError(err, 'Could not disconnect.'),
  });

  if (isLoading) {
    return <Card><div className="flex justify-center py-8"><Spinner /></div></Card>;
  }

  const shortcodeValid = /^\d{5,7}$/.test(form.shortcode.trim());
  const canSave = form.businessName.trim().length > 0 && shortcodeValid && !saveMutation.isPending;

  return (
    <Card>
      <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>M-Pesa Business credentials</h3>
      <p className="text-xs text-gray-500 mb-5">
        From your Daraja developer portal.{' '}
        <a
          href="https://developer.safaricom.co.ke/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline inline-flex items-center gap-0.5"
          style={{ color: '#0F766E' }}
        >
          Open Daraja <ExternalLink className="w-3 h-3" />
        </a>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Environment</label>
          <div className="flex gap-2">
            {(['sandbox', 'production'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => update({ environment: env })}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors"
                style={{
                  borderColor: form.environment === env ? '#0F766E' : '#E5E7EB',
                  backgroundColor: form.environment === env ? '#F0FDFA' : 'white',
                  color: form.environment === env ? '#0F766E' : '#64748B',
                }}
              >
                {env}
              </button>
            ))}
          </div>
          {form.environment === 'sandbox' && (
            <p className="mt-1.5 text-xs text-amber-600">
              Sandbox takes test payments only — no real money moves.
            </p>
          )}
        </div>

        <Input
          label="Business name"
          hint="Shown on the customer's M-Pesa prompt"
          value={form.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
        />
        <Input
          label="Shortcode"
          inputMode="numeric"
          placeholder="e.g. 174379"
          error={form.shortcode && !shortcodeValid ? 'Shortcodes are 5 to 7 digits' : undefined}
          value={form.shortcode}
          onChange={(e) => update({ shortcode: e.target.value.replace(/\D/g, '') })}
        />

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">API credentials</p>
          <div className="space-y-4">
            <Input
              label="Consumer key"
              type="password"
              autoComplete="off"
              placeholder={config?.consumerKeyMasked ?? 'Paste from Daraja'}
              hint={config?.consumerKeySet ? 'Already set — leave blank to keep it' : undefined}
              value={form.consumerKey ?? ''}
              onChange={(e) => update({ consumerKey: e.target.value })}
            />
            <Input
              label="Consumer secret"
              type="password"
              autoComplete="off"
              placeholder={config?.consumerSecretMasked ?? 'Paste from Daraja'}
              hint={config?.consumerSecretSet ? 'Already set — leave blank to keep it' : undefined}
              value={form.consumerSecret ?? ''}
              onChange={(e) => update({ consumerSecret: e.target.value })}
            />
            <Input
              label="Passkey"
              type="password"
              autoComplete="off"
              placeholder={config?.passkeyMasked ?? 'Paste from Daraja'}
              hint={config?.passkeySet ? 'Already set — leave blank to keep it' : undefined}
              value={form.passkey ?? ''}
              onChange={(e) => update({ passkey: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">For refunds</p>
          <p className="text-xs text-gray-500 mb-3">
            Optional. Without these you can still refund in cash, just not reverse an M-Pesa payment.
          </p>
          <div className="space-y-4">
            <Input
              label="Initiator name"
              autoComplete="off"
              hint="The Daraja API operator username"
              value={form.initiatorName ?? ''}
              onChange={(e) => update({ initiatorName: e.target.value })}
            />
            <Input
              label="Security credential"
              type="password"
              autoComplete="off"
              placeholder={config?.securityCredentialMasked ?? 'Generated on the Daraja portal'}
              hint={config?.securityCredentialSet ? 'Already set — leave blank to keep it' : undefined}
              value={form.securityCredential ?? ''}
              onChange={(e) => update({ securityCredential: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
          {config?.enabled ? (
            confirmDisconnect ? (
              <span className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate()}
                >
                  Confirm disconnect
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(false)}>Keep</Button>
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(true)}>
                Disconnect M-Pesa
              </Button>
            )
          ) : (
            <span />
          )}

          <span className="flex gap-3">
            <Button variant="outline" onClick={onDone}>Cancel</Button>
            <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Save credentials
            </Button>
          </span>
        </div>
      </div>
    </Card>
  );
}
