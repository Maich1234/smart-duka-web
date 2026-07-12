'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Send, Ban } from 'lucide-react';
import { format } from 'date-fns';
import adminApi from '@/lib/adminApi';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type SegmentType = 'all' | 'state' | 'plan';
type AccessState = 'none' | 'trialing' | 'active' | 'grace' | 'locked';
type CampaignStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
type Role = 'owner' | 'staff';

interface Segment {
  type: SegmentType;
  states: AccessState[];
  planSlugs: string[];
  roles: Role[];
}

interface PushCampaign {
  _id: string;
  title: string;
  body: string;
  segment: Segment;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: { targeted: number; sent: number; failed: number };
  createdAt: string;
}

interface Plan {
  _id: string;
  slug: string;
  name: string;
}

const ACCESS_STATES: AccessState[] = ['trialing', 'active', 'grace', 'locked', 'none'];

const STATUS_COLOR: Record<CampaignStatus, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  scheduled: 'blue',
  sending: 'yellow',
  sent: 'green',
  failed: 'red',
  cancelled: 'gray',
};

const roleLabel = (roles: Role[]) =>
  roles.length === 2 ? 'Owners + Staff' : roles.includes('staff') ? 'Staff' : 'Owners';

const segmentLabel = (segment: Segment) => {
  const roles = roleLabel(segment.roles?.length ? segment.roles : ['owner']);
  if (segment.type === 'all') return `All (${roles})`;
  if (segment.type === 'state') return `State: ${segment.states.join(', ') || '—'} (${roles})`;
  return `Plan: ${segment.planSlugs.join(', ') || '—'} (${roles})`;
};

const schema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function PushCampaignsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [segmentType, setSegmentType] = useState<SegmentType>('all');
  const [selectedStates, setSelectedStates] = useState<AccessState[]>([]);
  const [selectedPlanSlugs, setSelectedPlanSlugs] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['owner']);
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [serverError, setServerError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pushCampaigns'],
    queryFn: async () => (await adminApi.get('/push-campaigns')).data as { data: PushCampaign[] },
  });
  const campaigns = data?.data ?? [];

  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => (await adminApi.get('/plans')).data as { data: Plan[] },
    enabled: modalOpen,
  });
  const plans = plansData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const resetForm = () => {
    reset({ title: '', body: '' });
    setSegmentType('all');
    setSelectedStates([]);
    setSelectedPlanSlugs([]);
    setSelectedRoles(['owner']);
    setSendMode('now');
    setScheduledAt('');
    setServerError('');
  };

  useEffect(() => {
    if (modalOpen) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      const segment: Segment = {
        type: segmentType,
        states: segmentType === 'state' ? selectedStates : [],
        planSlugs: segmentType === 'plan' ? selectedPlanSlugs : [],
        roles: selectedRoles,
      };
      const created = (await adminApi.post('/push-campaigns', {
        title: values.title,
        body: values.body,
        segment,
        scheduledAt: sendMode === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })).data.data as PushCampaign;

      if (sendMode === 'now') {
        await adminApi.post(`/push-campaigns/${created._id}/send`);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pushCampaigns'] });
      setModalOpen(false);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to create campaign');
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: (id: string) => adminApi.post(`/push-campaigns/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pushCampaigns'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.patch(`/push-campaigns/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pushCampaigns'] }),
  });

  const submitDisabled =
    (segmentType === 'state' && selectedStates.length === 0) ||
    (segmentType === 'plan' && selectedPlanSlugs.length === 0) ||
    selectedRoles.length === 0 ||
    (sendMode === 'schedule' && !scheduledAt);

  const toggleState = (state: AccessState) => {
    setSelectedStates((prev) => (prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]));
  };
  const togglePlan = (slug: string) => {
    setSelectedPlanSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };
  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Push Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast a push notification to segmented shop owners, now or scheduled</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      <Table<PushCampaign>
        columns={[
          { key: 'title', header: 'Campaign', render: (c) => (
            <div>
              <p className="font-semibold" style={{ color: '#0F172A' }}>{c.title}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{c.body}</p>
            </div>
          ) },
          { key: 'segment', header: 'Audience', render: (c) => segmentLabel(c.segment) },
          { key: 'status', header: 'Status', render: (c) => <Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge> },
          { key: 'when', header: 'Scheduled / Sent', render: (c) =>
            c.sentAt ? format(new Date(c.sentAt), 'MMM d, HH:mm')
              : c.scheduledAt ? format(new Date(c.scheduledAt), 'MMM d, HH:mm')
              : 'Immediate' },
          { key: 'stats', header: 'Sent / Targeted', render: (c) => `${c.stats?.sent ?? 0} / ${c.stats?.targeted ?? 0}` },
          { key: 'actions', header: '', render: (c) => c.status === 'scheduled' ? (
            <div className="flex gap-1">
              <button
                onClick={() => sendNowMutation.mutate(c._id)}
                title="Send now"
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F766E] hover:bg-gray-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => cancelMutation.mutate(c._id)}
                title="Cancel"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          ) : null },
        ]}
        data={campaigns}
        keyExtractor={(c) => c._id}
        loading={isLoading}
        emptyMessage="No campaigns yet"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Push Campaign" size="lg">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Input label="Title *" placeholder="20% off this week only" error={errors.title?.message} {...register('title')} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Body *</label>
            <textarea
              rows={3}
              placeholder="Use code SAVE20 before Friday to save on your renewal."
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              style={{ color: '#0F172A' }}
              {...register('body')}
            />
            {errors.body?.message && <p className="text-xs text-red-500">{errors.body.message}</p>}
            <p className="text-xs text-gray-400">Personalize with {'{{name}}'} and {'{{shopName}}'} — filled in per recipient.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Recipients</label>
            <div className="flex gap-4 text-sm" style={{ color: '#0F172A' }}>
              {(['owner', 'staff'] as Role[]).map((role) => (
                <label key={role} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggleRole(role)} />
                  {role === 'owner' ? 'Owners' : 'Staff'}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Audience</label>
            <div className="flex gap-4 text-sm" style={{ color: '#0F172A' }}>
              {(['all', 'state', 'plan'] as SegmentType[]).map((type) => (
                <label key={type} className="flex items-center gap-1.5">
                  <input type="radio" checked={segmentType === type} onChange={() => setSegmentType(type)} />
                  {type === 'all' ? 'Everyone matching recipients' : type === 'state' ? 'By subscription state' : 'By plan'}
                </label>
              ))}
            </div>
            {segmentType === 'state' && (
              <div className="flex flex-wrap gap-3 pt-1">
                {ACCESS_STATES.map((state) => (
                  <label key={state} className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={selectedStates.includes(state)} onChange={() => toggleState(state)} />
                    {state}
                  </label>
                ))}
              </div>
            )}
            {segmentType === 'plan' && (
              <div className="flex flex-wrap gap-3 pt-1">
                {plans.map((plan) => (
                  <label key={plan.slug} className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={selectedPlanSlugs.includes(plan.slug)} onChange={() => togglePlan(plan.slug)} />
                    {plan.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Send</label>
            <div className="flex gap-4 text-sm" style={{ color: '#0F172A' }}>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={sendMode === 'now'} onChange={() => setSendMode('now')} />
                Send immediately
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={sendMode === 'schedule'} onChange={() => setSendMode('schedule')} />
                Schedule for later
              </label>
            </div>
            {sendMode === 'schedule' && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                style={{ color: '#0F172A' }}
              />
            )}
            {sendMode === 'schedule' && (
              <p className="text-xs text-gray-400">Dispatched within 15 minutes of the scheduled time.</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} disabled={submitDisabled}>
              {sendMode === 'now' ? 'Send Now' : 'Schedule Campaign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
