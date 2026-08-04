'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Hourglass, Info, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import {
  cancelAccountDeletion,
  deleteAccount,
  previewAccountDeletion,
} from '@/services/account';

/**
 * In-app account closure, ported from the mobile app's DeleteAccountSection.
 *
 * Closure is scheduled, not immediate: nothing is destroyed for the grace
 * window, the account keeps working, and one click calls it off. Deleting an
 * owner account takes a whole business and every staff account with it — too
 * much damage to allow from one mistaken click or a borrowed unlocked
 * session.
 *
 * Staff take an extra step: the request goes to the shop owner first, because
 * a cashier's records are the shop's books rather than personal property. So
 * there are three states, not two — nothing filed, waiting on the owner, or
 * approved and counting down.
 *
 * Getting in is deliberately effortful (password plus a typed DELETE);
 * getting back out is deliberately trivial, from every one of those states.
 */

const DELETION_QUERY_KEY = ['accountDeletionPreview'];

const formatDay = (iso: string) => format(new Date(iso), 'd MMM yyyy');

export default function DeleteAccountSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  // Always enabled, not only while the dialog is open — the scheduled state
  // drives the banner, which has to show without opening anything.
  const { data: preview, isLoading } = useQuery({
    queryKey: DELETION_QUERY_KEY,
    queryFn: previewAccountDeletion,
    retry: false,
  });

  const scheduledAt = preview?.deletionScheduledAt ?? null;
  const awaitingApproval = preview?.awaitingOwnerApproval ?? false;
  const requiresApproval = preview?.requiresOwnerApproval ?? false;

  const close = () => {
    if (deleteMutation.isPending) return;
    setOpen(false);
    setPassword('');
    setConfirmText('');
    setError('');
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(password),
    onSuccess: () => {
      close();
      queryClient.invalidateQueries({ queryKey: DELETION_QUERY_KEY });
    },
    onError: (err: { response?: { status?: number; data?: { message?: string } } }) => {
      // The endpoint shares the password-reset limiter, so repeated wrong
      // passwords stop looking like wrong passwords. Say which it is.
      setError(
        err?.response?.status === 429
          ? 'Too many attempts. Wait a few minutes and try again.'
          : err?.response?.data?.message || 'Could not schedule closure. Please try again.'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAccountDeletion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DELETION_QUERY_KEY }),
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message || 'Could not cancel. Please try again.');
    },
  });

  const canSubmit = password.length > 0 && confirmText === 'DELETE' && !deleteMutation.isPending;
  const graceDays = preview?.graceDays ?? 14;

  // ── Scheduled: the only thing worth offering is a way back ───────────────
  if (scheduledAt) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-600">Account closing on {formatDay(scheduledAt)}</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Everything still works until then. Cancel any time before that date and nothing is lost.
            </p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <Button
              className="mt-4"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Keep my account
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ── Filed, waiting on the owner ──────────────────────────────────────────
  // Deliberately not styled as danger: nothing has happened to the account,
  // and it may never — the owner can decline.
  if (awaitingApproval) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <Hourglass className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#B45309' }} />
          <div className="flex-1">
            <p className="font-bold" style={{ color: '#0F172A' }}>Waiting for your shop owner</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              You asked to close your account
              {preview?.deletionRequestedAt ? ` on ${formatDay(preview.deletionRequestedAt)}` : ''}.
              Your shop owner has to approve it first. Nothing changes until they do, and you can
              keep using Dukana normally.
            </p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <Button
              variant="outline"
              className="mt-4"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Withdraw my request
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <Trash2 className="w-5 h-5 shrink-0 text-red-500" />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-red-600">Delete my account</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Scheduled with a {graceDays}-day window to change your mind
            </span>
          </span>
        </button>
      </Card>

      <Modal
        isOpen={open}
        onClose={close}
        title={requiresApproval ? 'Request account closure?' : 'Delete your account?'}
      >
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {requiresApproval
                ? `Your shop owner has to approve this first. Once they do, your account stays open for another ${graceDays} days and you can still cancel. After that it's permanent.`
                : `Your account will stay open for ${graceDays} more days. Nothing is deleted until then, and you can cancel any time. After that it's permanent.`}
            </p>

            {requiresApproval && (
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your sales and shift records stay with the shop either way — they&apos;re the
                  owner&apos;s books, not part of your personal profile.
                </p>
              </div>
            )}

            {preview?.cascades && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <p className="text-xs font-semibold text-red-700 leading-relaxed">
                  You own {preview.shopName ?? 'this shop'}. Closing your account also closes the shop
                  {preview.staffAccountsRemoved > 0
                    ? ` and removes ${preview.staffAccountsRemoved} staff account${preview.staffAccountsRemoved === 1 ? '' : 's'}`
                    : ''}
                  . Everyone loses access.
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              Your sales, purchases, expenses and payment records are kept as bookkeeping records
              with your personal details removed, as described in our Privacy Policy.
            </p>

            <Input
              label="Your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Type DELETE to confirm"
              value={confirmText}
              autoCapitalize="characters"
              autoCorrect="off"
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button
                variant="danger"
                disabled={!canSubmit}
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {requiresApproval ? 'Request closure' : 'Schedule closure'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
