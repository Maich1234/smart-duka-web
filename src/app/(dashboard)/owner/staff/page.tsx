'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users, Mail, Phone, Search, ChevronRight, LogOut, Circle, CheckCircle2, XCircle, Loader2, UserMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import {
  forceLogoutStaff,
  checkStaffEmailAvailability,
  getStaffDeletionRequests,
  type Staff,
  type StaffActiveSession,
} from '@/services/staff';
import { useAuthStore } from '@/store/authStore';
import { buildSystemEmailDomain, slugifyLocalPart } from '@/utils/staffEmailSlug';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  salesCount?: number;
  activeSession: StaffActiveSession | null;
}

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormData = z.infer<typeof schema>;

type EmailMode = 'real' | 'system';
type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

export default function StaffPage() {
  const queryClient = useQueryClient();
  const shopName = useAuthStore((s) => s.user?.shop?.name) ?? '';
  const domain = useMemo(() => buildSystemEmailDomain(shopName), [shopName]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [forceLogoutTarget, setForceLogoutTarget] = useState<StaffMember | null>(null);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailMode, setEmailMode] = useState<EmailMode>('real');
  const [localPart, setLocalPart] = useState('');
  const [localPartTouched, setLocalPartTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>('idle');
  // Set only when the platform's "prompt for immediate payment" setting is on
  // and this addition actually cost something — holds the success modal open
  // with a "Pay now" choice instead of auto-closing.
  const [payPrompt, setPayPrompt] = useState<{ amount: number } | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: staffRaw, isLoading } = useQuery({
    queryKey: ['staff', search, page, showAll],
    queryFn: async () => {
      const res = await api.get('/staff', { params: {
        page,
        limit: 10,
        search: search || undefined,
        ...(!showAll ? { startDate: twoDaysAgo } : {}),
      }});
      return res.data as { data: StaffMember[]; pagination: { page: number; limit: number; total: number; pages: number } };
    },
  });

  const staff = staffRaw?.data ?? [];
  const totalPages = staffRaw?.pagination?.pages ?? 1;

  const { data: deletionRequestData } = useQuery({
    queryKey: ['staffDeletionRequests'],
    queryFn: getStaffDeletionRequests,
  });
  const deletionRequests = deletionRequestData?.data ?? [];

  const resetEmailFields = () => {
    setEmailMode('real');
    setLocalPart('');
    setLocalPartTouched(false);
    setAvailability('idle');
  };

  const finishAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    setAddOpen(false);
    setSuccessMessage('');
    setPayPrompt(null);
    reset();
    resetEmailFields();
  };

  const addMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/staff', data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      const base =
        emailMode === 'system'
          ? 'Staff added — they can sign in right away.'
          : 'Staff added — ask them to check their email to verify before signing in.';
      // Seats are postpaid and prorated: the account is active immediately
      // and the server reports what it added to the next invoice. Staff
      // creation is never blocked on payment either way — the only question
      // is whether to nudge paying that amount off right now (platform
      // setting) or let it silently ride to the next invoice as usual.
      const billing = (created as { billing?: { addedToNextInvoice?: number; immediateChargeRecommended?: boolean } } | undefined)?.billing;
      const billed = billing?.addedToNextInvoice;
      setSuccessMessage(billed ? `${base} ${fmt(billed, 'KES')} will be added to your next bill.` : base);
      if (billing?.immediateChargeRecommended && billed) {
        setPayPrompt({ amount: billed });
      } else {
        setTimeout(finishAndClose, 2500);
      }
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Failed to add staff');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteId(null);
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (id: string) => forceLogoutStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setForceLogoutTarget(null);
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedName = watch('name');
  const systemEmail = `${localPart}@${domain}`;

  // Suggest a local part from the name until the owner edits it directly.
  useEffect(() => {
    if (emailMode === 'system' && !localPartTouched) {
      setLocalPart(slugifyLocalPart(watchedName || ''));
    }
  }, [watchedName, emailMode, localPartTouched]);

  // Keep the underlying (validated) email field in sync with the composed system email.
  useEffect(() => {
    if (emailMode === 'system') {
      setValue('email', systemEmail, { shouldValidate: false });
    }
  }, [emailMode, systemEmail, setValue]);

  const checkAvailability = async () => {
    if (!localPart) return;
    setAvailability('checking');
    try {
      const { available } = await checkStaffEmailAvailability(systemEmail);
      setAvailability(available ? 'available' : 'taken');
    } catch {
      setAvailability('error');
    }
  };

  const onSubmit = (data: FormData) => {
    setServerError('');
    if (emailMode === 'system' && availability === 'taken') {
      setServerError('That email is already taken — try another');
      return;
    }
    addMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your shop employees</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Pending account-closure requests. Unanswered requests go through on
          their own after the approval window, so they can't be tucked away
          behind the "Past 2 days" filter or a search term. */}
      {deletionRequests.length > 0 && (
        <div className="rounded-2xl p-5 border space-y-3" style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
          <div className="flex items-center gap-2">
            <UserMinus className="w-4 h-4" style={{ color: '#B45309' }} />
            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              {deletionRequests.length === 1
                ? '1 account closure request'
                : `${deletionRequests.length} account closure requests`}
            </p>
          </div>
          {deletionRequests.map((request) => (
            <Link
              key={request._id}
              href={`/owner/staff/${request._id}`}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{request.name}</p>
                <p className="text-xs text-gray-500">
                  Approves on its own by {format(new Date(request.autoApprovesAt), 'MMM d, yyyy')}
                </p>
              </div>
              <span className="text-xs font-semibold shrink-0" style={{ color: '#0F766E' }}>Review →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Search + date filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200 transition-all" />
        </div>
        <button onClick={() => { setShowAll((v) => !v); setPage(1); }}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showAll ? 'border-gray-200 bg-white text-gray-600' : 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]'}`}>
          <span>{showAll ? 'All time' : '⏱ Past 2 days'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (staff || []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No staff members yet. Add your first team member!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(staff || []).map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 group">
              <div className="flex items-start justify-between mb-4">
                <Link href={`/owner/staff/${s._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: '#0F766E' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate group-hover:text-[#0F766E] transition-colors" style={{ color: '#0F172A' }}>{s.name}</p>
                    <Badge color={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </Link>
                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                  {s.activeSession && (
                    <button
                      onClick={() => setForceLogoutTarget(s)}
                      title="Force logout"
                      className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(s._id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Link href={`/owner/staff/${s._id}`} className="block">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {s.phone}
                    </div>
                  )}
                  {s.activeSession && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                      <span className="truncate">
                        {s.activeSession.deviceName ?? 'Unknown device'} · active {formatDistanceToNowStrict(new Date(s.activeSession.lastActiveAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                  <span>Joined {format(new Date(s.createdAt), 'MMM yyyy')}</span>
                  <div className="flex items-center gap-1">
                    {s.salesCount !== undefined && <span>{s.salesCount} sales</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0F766E] transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">← Previous</button>
          <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">Next →</button>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); reset(); setServerError(''); setSuccessMessage(''); setPayPrompt(null); resetEmailFields(); }} title="Add Staff Member">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 space-y-3">
            <p>{successMessage}</p>
            {payPrompt && (
              <div className="flex gap-2">
                <Link
                  href="/owner/subscription?pay=1"
                  className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#0F766E' }}
                >
                  Pay {fmt(payPrompt.amount, 'KES')} now
                </Link>
                <button
                  type="button"
                  onClick={finishAndClose}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold border border-green-300 text-green-700 hover:bg-green-100"
                >
                  I&apos;ll pay later
                </button>
              </div>
            )}
          </div>
        )}
        {!payPrompt && <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name *" placeholder="Jane Wanjiku" error={errors.name?.message} {...register('name')} />

          <div>
            <div className="flex rounded-xl border border-gray-200 p-1 gap-1 mb-2">
              <button
                type="button"
                onClick={() => { if (emailMode === 'system') setValue('email', ''); setEmailMode('real'); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${emailMode === 'real' ? 'bg-[#F0FDFA] text-[#0F766E]' : 'text-gray-500'}`}
              >
                Real email
              </button>
              <button
                type="button"
                onClick={() => setEmailMode('system')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${emailMode === 'system' ? 'bg-[#F0FDFA] text-[#0F766E]' : 'text-gray-500'}`}
              >
                System-generated
              </button>
            </div>

            {emailMode === 'real' ? (
              <>
                <Input label="Email *" type="email" placeholder="jane@example.com" error={errors.email?.message} {...register('email')} />
                <p className="text-xs text-gray-400 mt-1">We&apos;ll email a verification code to this address before they can sign in.</p>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email *</label>
                <div className="flex gap-2">
                  <input
                    value={localPart}
                    onChange={(e) => {
                      setLocalPartTouched(true);
                      setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''));
                      setAvailability('idle');
                    }}
                    onBlur={checkAvailability}
                    placeholder="jane.otieno"
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                  />
                  <div className="flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50 shrink-0 max-w-[45%]">
                    <span className="text-sm text-gray-600 truncate">@{domain}</span>
                  </div>
                </div>
                {availability === 'checking' && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking availability…</p>
                )}
                {availability === 'available' && (
                  <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Available</p>
                )}
                {availability === 'taken' && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5"><XCircle className="w-3.5 h-3.5" /> This email is taken — try another</p>
                )}
                {availability === 'idle' && (
                  <p className="text-xs text-gray-400 mt-1.5">Auto-verified — ready to use immediately, no email needed.</p>
                )}
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </>
            )}
          </div>

          <Input label="Phone Number" placeholder="07XXXXXXXX" error={errors.phone?.message} {...register('phone')} />
          <Input label="Temporary Password *" type="password" placeholder="Min. 6 characters" error={errors.password?.message} {...register('password')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending}>
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </div>
        </form>}
      </Modal>

      {/* Force Logout Confirm */}
      <Modal isOpen={!!forceLogoutTarget} onClose={() => setForceLogoutTarget(null)} title="Force Logout">
        <p className="text-gray-600 mb-6">
          Sign out <strong>{forceLogoutTarget?.name}</strong> from {forceLogoutTarget?.activeSession?.deviceName ?? 'their device'}? They&apos;ll need to sign in again to keep working.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setForceLogoutTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={forceLogoutMutation.isPending} onClick={() => forceLogoutTarget && forceLogoutMutation.mutate(forceLogoutTarget._id)}>
            Force Logout
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Staff">
        <p className="text-gray-600 mb-6">Are you sure you want to remove this staff member? They will lose access to the system.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
