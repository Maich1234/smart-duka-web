'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Lock, Trash2, CheckCircle, XCircle, Mail, Phone, Calendar, Clock, Smartphone, LogOut, UserMinus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import CommissionCard from '@/components/sales/CommissionCard';
import { useShop } from '@/hooks/useShop';
import {
  getCommissionPeriodRange,
  getStaffCommission,
  type CommissionPeriod,
} from '@/services/commission';
import type { AxiosError } from 'axios';
import {
  forceLogoutStaff,
  approveStaffDeletion,
  declineStaffDeletion,
  getStaffDeletionRequests,
  type StaffActiveSession,
} from '@/services/staff';

interface Permission {
  value: string;
  label: string;
  category: string;
}

interface StaffDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  salesCount?: number;
  activeSession: StaffActiveSession | null;
  /** Requested-but-not-scheduled means the closure is waiting on the owner. */
  deletionRequestedAt?: string | null;
  deletionScheduledAt?: string | null;
}

const AVATAR_COLORS = [
  { bg: '#CCFBF1', text: '#0F766E' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#FCE7F3', text: '#9D174D' },
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [forceLogoutOpen, setForceLogoutOpen] = useState(false);
  const [approveClosureOpen, setApproveClosureOpen] = useState(false);
  const [declineClosureOpen, setDeclineClosureOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const { data: staff, isLoading } = useQuery<StaffDetail>({
    queryKey: ['staff', id],
    queryFn: async () => {
      const res = await api.get(`/staff/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: permissionsData } = useQuery<{ data: Permission[] }>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/staff/permissions');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      router.push('/owner/staff');
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: () => forceLogoutStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      setForceLogoutOpen(false);
    },
  });

  // Account-closure requests: the owner decides, but only until the backend's
  // approval window expires — after that an unanswered request goes ahead.
  //
  // The windows come from the server's own constants rather than being written
  // into the copy, so DELETION_GRACE_DAYS / DELETION_APPROVAL_WINDOW_DAYS can
  // change without this page quietly telling people the wrong number. Shares
  // its cache with the staff list's banner, so it costs no extra request.
  const { showStaffCommission, currency } = useShop();
  const [commissionPeriod, setCommissionPeriod] = useState<CommissionPeriod>('month');
  const commissionRange = getCommissionPeriodRange(commissionPeriod);
  const commissionQuery = useQuery({
    queryKey: ['staffCommission', id, commissionPeriod],
    queryFn: () => getStaffCommission(id, commissionRange),
    enabled: showStaffCommission && !!id,
    retry: false,
  });

  const { data: closureRequests } = useQuery({
    queryKey: ['staffDeletionRequests'],
    queryFn: getStaffDeletionRequests,
    staleTime: 60_000,
  });
  const graceDays = closureRequests?.meta?.graceDays ?? 14;
  const approvalWindowDays = closureRequests?.meta?.approvalWindowDays ?? 14;
  const pendingClosure = closureRequests?.data.find((r) => r._id === id);

  const approveClosureMutation = useMutation({
    mutationFn: () => approveStaffDeletion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      queryClient.invalidateQueries({ queryKey: ['staffDeletionRequests'] });
      setApproveClosureOpen(false);
    },
  });

  const declineClosureMutation = useMutation({
    mutationFn: () => declineStaffDeletion(id, declineReason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      queryClient.invalidateQueries({ queryKey: ['staffDeletionRequests'] });
      setDeclineClosureOpen(false);
      setDeclineReason('');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) => api.post(`/staff/${id}/password-reset`, { newPassword: password }),
    onSuccess: () => {
      setResetOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setResetError(e.response?.data?.message || 'Failed to reset password');
    },
  });

  const handleResetSubmit = () => {
    setResetError('');
    if (newPassword.length < 6) return setResetError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setResetError("Passwords don't match");
    resetPasswordMutation.mutate(newPassword);
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (!staff) {
    return (
      <div className="text-center py-24 text-gray-400">
        Staff member not found.{' '}
        <Link href="/owner/staff" className="text-[#0F766E] underline">Back to staff</Link>
      </div>
    );
  }

  const allPermissions: Permission[] = permissionsData?.data || [];
  const grouped = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const color = avatarColor(staff.name);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <div className="flex items-center gap-4">
        <Link href="/owner/staff">
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Staff Profile</h1>
          <p className="text-gray-500 text-sm">View and manage staff member details</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {initials(staff.name)}
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>{staff.name}</h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge color={staff.isActive ? 'green' : 'gray'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{staff.email}</span>
          {staff.phone && <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{staff.phone}</span>}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Joined {format(new Date(staff.createdAt), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Active {timeAgo(staff.updatedAt)}
          </span>
          {staff.salesCount !== undefined && (
            <span>{staff.salesCount} sales</span>
          )}
        </div>
      </div>

      {/* Account-closure request — the owner's decision, so it sits above the
          routine profile actions. */}
      {staff.deletionRequestedAt && !staff.deletionScheduledAt && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
              <UserMinus className="w-4 h-4" style={{ color: '#B45309' }} />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-semibold" style={{ color: '#0F172A' }}>Account closure request</p>
                <p className="text-xs" style={{ color: '#78350F' }}>
                  Asked on {format(new Date(staff.deletionRequestedAt), 'MMM d, yyyy')}
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>
                {staff.name} has asked to close their account. Nothing has changed yet — approving starts a{' '}
                {graceDays}-day cooling-off period, and your shop&apos;s sales and shift records stay in the
                books either way.
                {pendingClosure
                  ? ` Left unanswered, it goes ahead on its own on ${format(new Date(pendingClosure.autoApprovesAt), 'MMM d, yyyy')}.`
                  : ` If you don't answer within ${approvalWindowDays} days of the request it goes ahead on its own.`}
              </p>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setDeclineClosureOpen(true)}>
                  Decline
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => setApproveClosureOpen(true)}>
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {staff.deletionScheduledAt && (
        <div className="rounded-2xl p-5 flex items-start gap-3" style={{ backgroundColor: '#FEE2E2' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <p className="text-sm leading-relaxed font-medium" style={{ color: '#991B1B' }}>
            Closure approved — this account closes on{' '}
            {format(new Date(staff.deletionScheduledAt), 'MMM d, yyyy')}. {staff.name} can still cancel
            before then.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/owner/staff/${id}/edit`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </Link>
        <Button variant="outline" className="flex-1" onClick={() => { setResetOpen(true); setResetError(''); setNewPassword(''); setConfirmPassword(''); }}>
          <Lock className="w-4 h-4" />
          Reset Password
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4" />
          Remove
        </Button>
      </div>

      {/* Current Device */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Current Device</h3>
        <p className="text-sm text-gray-500 mb-4">
          Staff accounts can only be signed in on one device at a time.
        </p>
        {staff.activeSession ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" style={{ color: '#0F766E' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                  {staff.activeSession.deviceName ?? 'Unknown device'}
                </p>
                <p className="text-xs text-gray-400">Last active {timeAgo(staff.activeSession.lastActiveAt)}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setForceLogoutOpen(true)}>
              <LogOut className="w-4 h-4" />
              Force Logout
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not currently signed in on any device.</p>
        )}
      </div>

      {/* Commission — only where the shop actually pays it */}
      {showStaffCommission && (
        <div>
          <h3 className="font-bold mb-3" style={{ color: '#0F172A' }}>Commission</h3>
          <CommissionCard
            data={commissionQuery.data}
            isLoading={commissionQuery.isLoading}
            forbidden={(commissionQuery.error as AxiosError)?.response?.status === 403}
            period={commissionPeriod}
            onPeriodChange={setCommissionPeriod}
            currency={currency}
          />
        </div>
      )}

      {/* Permissions */}
      {allPermissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Permissions</h3>
          <p className="text-sm text-gray-500 mb-4">What this staff member can access and manage.</p>
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, perms]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#0F766E' }}>
                  {category}
                </p>
                <div className="space-y-1">
                  {perms.map((perm) => {
                    const granted = staff.permissions?.includes(perm.value);
                    return (
                      <div key={perm.value} className="flex items-center gap-3 py-1.5">
                        {granted ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                        <span className={`text-sm ${granted ? 'text-gray-800' : 'text-gray-400'}`}>
                          {perm.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset Password">
        <p className="text-sm text-gray-500 mb-4">
          Set a new password for <strong>{staff.name}</strong>. They can change it after logging in.
        </p>
        {resetError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{resetError}</div>
        )}
        <div className="space-y-3">
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button onClick={handleResetSubmit} loading={resetPasswordMutation.isPending}>
            <Lock className="w-4 h-4" />
            Reset Password
          </Button>
        </div>
      </Modal>

      {/* Force Logout Confirm Modal */}
      <Modal isOpen={forceLogoutOpen} onClose={() => setForceLogoutOpen(false)} title="Force Logout">
        <p className="text-gray-600 mb-6">
          Sign out <strong>{staff.name}</strong> from {staff.activeSession?.deviceName ?? 'their device'}? They&apos;ll need to sign in again to keep working.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setForceLogoutOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={forceLogoutMutation.isPending} onClick={() => forceLogoutMutation.mutate()}>
            Force Logout
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Staff Member">
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove <strong>{staff.name}</strong>? They will immediately lose access to the system.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Remove
          </Button>
        </div>
      </Modal>

      {/* Approve Closure Modal */}
      <Modal
        isOpen={approveClosureOpen}
        onClose={() => setApproveClosureOpen(false)}
        title={`Approve ${staff.name}'s closure?`}
      >
        <p className="text-gray-600 mb-6">
          Their account will close after a {graceDays}-day cooling-off period. They keep working normally until
          then, and can still cancel. Your shop&apos;s sales and shift records are not affected.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setApproveClosureOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            loading={approveClosureMutation.isPending}
            onClick={() => approveClosureMutation.mutate()}
          >
            Approve
          </Button>
        </div>
      </Modal>

      {/* Decline Closure Modal */}
      <Modal
        isOpen={declineClosureOpen}
        onClose={() => setDeclineClosureOpen(false)}
        title="Decline this request?"
      >
        <p className="text-gray-600 mb-4">
          {staff.name}&apos;s account stays open and they&apos;ll be told you declined. They can ask
          again, so it&apos;s worth saying why.
        </p>
        <Input
          label="Reason (optional)"
          placeholder="e.g. Finish this month's stock take first"
          value={declineReason}
          maxLength={300}
          onChange={(e) => setDeclineReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setDeclineClosureOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            loading={declineClosureMutation.isPending}
            onClick={() => declineClosureMutation.mutate()}
          >
            Decline request
          </Button>
        </div>
      </Modal>
    </div>
  );
}
