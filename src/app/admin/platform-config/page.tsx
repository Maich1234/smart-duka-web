'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { KeyRound, CreditCard, Zap, Lock } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import PlatformConfigVerificationModal from '@/components/admin/PlatformConfigVerificationModal';

interface PlatformConfigData {
  mpesa: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    businessName: string;
    shortcode: string;
    consumerKeyConfigured: boolean;
    consumerSecretConfigured: boolean;
    passkeyConfigured: boolean;
    configuredAt: string | null;
  };
  paystack: {
    enabled: boolean;
    publicKey: string;
    secretKeyConfigured: boolean;
    configuredAt: string | null;
  };
  immediateSeatBilling: boolean;
  gracePeriodDays: number;
  reminderDaysBefore: number[];
}

interface FormValues {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  businessName: string;
  shortcode: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  paystackEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  immediateSeatBilling: boolean;
  gracePeriodDays: number;
  reminderDaysBefore: string;
}

// Nothing this page GETs is ever a secret (see adminPlatformConfigController.js
// — actual credential values never leave the server), so the page itself loads
// freely. Only *writing* a new credential is gated, and only on demand: no code
// is ever sent just from visiting.
const CREDENTIAL_FIELDS = ['consumerKey', 'consumerSecret', 'passkey', 'paystackSecretKey'] as const;

export default function PlatformConfigPage() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Held in state only — persisting it would defeat the point of
  // re-verifying each session. Null until the admin actually asks to edit
  // a credential; most visits to this page never need it at all.
  const [configToken, setConfigToken] = useState<string | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  // Values queued when Save was clicked before a token was held — submitted
  // automatically the moment verification succeeds, so the admin doesn't
  // have to click Save twice.
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform-config'],
    queryFn: async () => (await adminApi.get('/platform-config')).data as { data: PlatformConfigData },
  });
  const config = data?.data;

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (!config) return;
    reset({
      enabled: config.mpesa.enabled,
      environment: config.mpesa.environment,
      businessName: config.mpesa.businessName,
      shortcode: config.mpesa.shortcode,
      consumerKey: '',
      consumerSecret: '',
      passkey: '',
      paystackEnabled: config.paystack.enabled,
      paystackPublicKey: config.paystack.publicKey,
      paystackSecretKey: '',
      immediateSeatBilling: config.immediateSeatBilling,
      gracePeriodDays: config.gracePeriodDays,
      reminderDaysBefore: config.reminderDaysBefore.join(', '),
    });
  }, [config, reset]);

  const buildBody = (values: FormValues) => {
    const body: Record<string, unknown> = {
      enabled: values.enabled,
      environment: values.environment,
      businessName: values.businessName,
      shortcode: values.shortcode,
      paystackEnabled: values.paystackEnabled,
      paystackPublicKey: values.paystackPublicKey,
      immediateSeatBilling: values.immediateSeatBilling,
      gracePeriodDays: Number(values.gracePeriodDays),
      reminderDaysBefore: values.reminderDaysBefore.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)),
    };
    // Only send credential fields when the admin actually typed something —
    // an empty field always means "leave unchanged" (see adminPlatformConfigController.js).
    if (values.consumerKey) body.consumerKey = values.consumerKey;
    if (values.consumerSecret) body.consumerSecret = values.consumerSecret;
    if (values.passkey) body.passkey = values.passkey;
    if (values.paystackSecretKey) body.paystackSecretKey = values.paystackSecretKey;
    return body;
  };
  const touchesCredentials = (values: FormValues) => CREDENTIAL_FIELDS.some((f) => values[f]);

  // Takes the token as an explicit argument rather than reading configToken
  // from closure/state — right after onVerified calls setConfigToken(token),
  // a same-tick mutate() would otherwise still see the pre-update state
  // value (React batches the state update; it isn't visible until the next
  // render), silently submitting with no token and forcing a 403 round trip.
  const saveMutation = useMutation({
    mutationFn: ({ values, token }: { values: FormValues; token: string | null }) =>
      adminApi.patch('/platform-config', buildBody(values), {
        headers: token ? { 'X-Verification-Token': token } : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-config'] });
      setServerError('');
      setSuccessMsg('Saved.');
      setPendingValues(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: unknown, { values }) => {
      const e = err as { response?: { status?: number; data?: { message?: string; errors?: string[] } } };
      if (e.response?.status === 403) {
        // The token was rejected or the 10-minute window lapsed mid-save —
        // re-prompt and retry automatically once a fresh one is issued.
        setConfigToken(null);
        setPendingValues(values);
        setVerifyModalOpen(true);
        setServerError('Verification expired — please verify again to finish saving.');
        return;
      }
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to save');
    },
  });

  const onSubmit = (values: FormValues) => {
    if (touchesCredentials(values) && !configToken) {
      setPendingValues(values);
      setVerifyModalOpen(true);
      return;
    }
    saveMutation.mutate({ values, token: configToken });
  };

  if (isLoading || !config) {
    return <div className="text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Platform Config</h1>
        <p className="text-gray-500 text-sm mt-1">Dukana&apos;s own M-Pesa collection credentials — used to charge subscription payments, never a shop&apos;s own Daraja account</p>
      </div>

      <PlatformConfigVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => { setVerifyModalOpen(false); setPendingValues(null); }}
        onVerified={(token) => {
          setConfigToken(token);
          setVerifyModalOpen(false);
          if (pendingValues) saveMutation.mutate({ values: pendingValues, token });
        }}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4" style={{ color: '#0F766E' }} />
          <h2 className="font-bold" style={{ color: '#0F172A' }}>M-Pesa Daraja Credentials</h2>
          {config.mpesa.configuredAt && (
            <span className="text-xs text-gray-400 ml-auto">Last set {format(new Date(config.mpesa.configuredAt), 'MMM d, yyyy HH:mm')}</span>
          )}
        </div>

        {serverError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>}
        {successMsg && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{successMsg}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#0F172A' }}>
            <input type="checkbox" {...register('enabled')} className="rounded border-gray-300" />
            Enabled (subscription payments can be collected)
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Environment</label>
              <select {...register('environment')} className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30">
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <Input label="Shortcode" {...register('shortcode')} />
          </div>
          <Input label="Business Name" {...register('businessName')} />

          <div className="pt-2 border-t border-gray-100 space-y-4">
            {!configToken && (
              <button
                type="button"
                onClick={() => setVerifyModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
              >
                <Lock className="w-3.5 h-3.5" /> Verify to edit credentials
              </button>
            )}
            <p className="text-xs text-gray-400">Leave a credential blank to keep its current value — secrets are never shown once set.</p>
            <Input
              label="Consumer Key"
              placeholder={config.mpesa.consumerKeyConfigured ? '•••••••• (configured)' : 'Not configured'}
              disabled={!configToken}
              {...register('consumerKey')}
            />
            <Input
              label="Consumer Secret"
              placeholder={config.mpesa.consumerSecretConfigured ? '•••••••• (configured)' : 'Not configured'}
              disabled={!configToken}
              {...register('consumerSecret')}
            />
            <Input
              label="Passkey"
              placeholder={config.mpesa.passkeyConfigured ? '•••••••• (configured)' : 'Not configured'}
              disabled={!configToken}
              {...register('passkey')}
            />
            <div className="flex gap-2">
              <Badge color={config.mpesa.consumerKeyConfigured ? 'green' : 'gray'}>Key {config.mpesa.consumerKeyConfigured ? 'set' : 'unset'}</Badge>
              <Badge color={config.mpesa.consumerSecretConfigured ? 'green' : 'gray'}>Secret {config.mpesa.consumerSecretConfigured ? 'set' : 'unset'}</Badge>
              <Badge color={config.mpesa.passkeyConfigured ? 'green' : 'gray'}>Passkey {config.mpesa.passkeyConfigured ? 'set' : 'unset'}</Badge>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-4">
            <Input label="Grace Period (days)" type="number" {...register('gracePeriodDays')} />
            <Input label="Reminder Days Before (comma-separated)" placeholder="7, 3" {...register('reminderDaysBefore')} />
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: '#0F766E' }} />
              <h2 className="font-bold" style={{ color: '#0F172A' }}>Paystack (Card / Bank)</h2>
              {config.paystack.configuredAt && (
                <span className="text-xs text-gray-400 ml-auto">Last set {format(new Date(config.paystack.configuredAt), 'MMM d, yyyy HH:mm')}</span>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: '#0F172A' }}>
              <input type="checkbox" {...register('paystackEnabled')} className="rounded border-gray-300" />
              Enabled (offers Card / Bank alongside M-Pesa on the owner subscription page)
            </label>
            <Input
              label="Public Key"
              placeholder="pk_live_… or pk_test_…"
              {...register('paystackPublicKey')}
            />
            <p className="text-xs text-gray-400">Leave the secret key blank to keep its current value — it&apos;s never shown once set.</p>
            <Input
              label="Secret Key"
              placeholder={config.paystack.secretKeyConfigured ? '•••••••• (configured)' : 'Not configured'}
              disabled={!configToken}
              {...register('paystackSecretKey')}
            />
            <Badge color={config.paystack.secretKeyConfigured ? 'green' : 'gray'}>Secret key {config.paystack.secretKeyConfigured ? 'set' : 'unset'}</Badge>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#0F766E' }} />
              <h2 className="font-bold" style={{ color: '#0F172A' }}>Billing Behavior</h2>
            </div>
            <label className="flex items-start gap-2 text-sm" style={{ color: '#0F172A' }}>
              <input type="checkbox" {...register('immediateSeatBilling')} className="rounded border-gray-300 mt-0.5" />
              <span>
                Prompt for immediate payment when a seat is added (web only)
                <span className="block text-xs text-gray-400 mt-0.5">
                  Off: a new seat&apos;s prorated cost silently rides to the next invoice (today&apos;s behavior). On: the
                  owner is shown a &quot;pay now&quot; prompt right after adding staff from the web app — never a hard
                  gate, and never shown on mobile, which has no payment UI at all.
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saveMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
