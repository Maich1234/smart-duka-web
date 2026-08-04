'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { KeyRound } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

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
  gracePeriodDays: number;
  reminderDaysBefore: string;
}

export default function PlatformConfigPage() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      gracePeriodDays: config.gracePeriodDays,
      reminderDaysBefore: config.reminderDaysBefore.join(', '),
    });
  }, [config, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body: Record<string, unknown> = {
        enabled: values.enabled,
        environment: values.environment,
        businessName: values.businessName,
        shortcode: values.shortcode,
        gracePeriodDays: Number(values.gracePeriodDays),
        reminderDaysBefore: values.reminderDaysBefore.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)),
      };
      // Only send credential fields when the admin actually typed something —
      // an empty field always means "leave unchanged" (see adminPlatformConfigController.js).
      if (values.consumerKey) body.consumerKey = values.consumerKey;
      if (values.consumerSecret) body.consumerSecret = values.consumerSecret;
      if (values.passkey) body.passkey = values.passkey;
      return adminApi.patch('/platform-config', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-config'] });
      setServerError('');
      setSuccessMsg('Saved.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to save');
    },
  });

  if (isLoading || !config) {
    return <div className="text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Platform Config</h1>
        <p className="text-gray-500 text-sm mt-1">Dukana&apos;s own M-Pesa collection credentials — used to charge subscription payments, never a shop&apos;s own Daraja account</p>
      </div>

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

        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
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
            <p className="text-xs text-gray-400">Leave a credential blank to keep its current value — secrets are never shown once set.</p>
            <Input
              label="Consumer Key"
              placeholder={config.mpesa.consumerKeyConfigured ? '•••••••• (configured)' : 'Not configured'}
              {...register('consumerKey')}
            />
            <Input
              label="Consumer Secret"
              placeholder={config.mpesa.consumerSecretConfigured ? '•••••••• (configured)' : 'Not configured'}
              {...register('consumerSecret')}
            />
            <Input
              label="Passkey"
              placeholder={config.mpesa.passkeyConfigured ? '•••••••• (configured)' : 'Not configured'}
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

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saveMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
