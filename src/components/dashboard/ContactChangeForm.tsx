'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type ContactField = 'email' | 'phone';

export default function ContactChangeForm() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [field, setField] = useState<ContactField>('email');
  const [destination, setDestination] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (awaitingCode) {
        await api.post('/auth/contact-change/confirm', { field, code });
        logout();
        router.replace('/login');
      } else {
        await api.post('/auth/contact-change/request', { field, destination, currentPassword });
        setCurrentPassword('');
        setAwaitingCode(true);
      }
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string; fieldErrors?: { message?: string }[] }>(err) ? (err.response?.data?.fieldErrors?.[0]?.message || err.response?.data?.message) : undefined;
      setError(message || 'Could not update your contact. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer font-semibold text-slate-900">Change account email or phone</summary>
      <form onSubmit={submit} className="mt-4 grid gap-3" aria-busy={busy}>
        {awaitingCode ? (
          <>
            <p className="text-sm text-slate-600">Enter the six-digit code sent to {destination}.</p>
            <label className="grid gap-1 text-sm">
              Verification code
              <input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
            </label>
          </>
        ) : (
          <>
            <label className="grid gap-1 text-sm">
              Contact to change
              <select className={inputClass} value={field} onChange={(event) => {
                setField(event.target.value === 'phone' ? 'phone' : 'email');
                setDestination('');
                setError('');
              }}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              {field === 'email' ? 'New email address' : 'New phone number with country code'}
              <input className={inputClass} type={field === 'email' ? 'email' : 'tel'} value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={field === 'phone' ? '+254712345678' : undefined} required />
            </label>
            <label className="grid gap-1 text-sm">
              Current password
              <input className={inputClass} type="password" autoComplete="current-password" maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </label>
          </>
        )}
        <p className="text-sm text-slate-600">You’ll sign in again after confirming the change.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {awaitingCode ? 'Verify and update' : 'Send verification code'}
          </button>
          {awaitingCode && (
            <button type="button" disabled={busy} onClick={() => {
              setCode('');
              setError('');
              setAwaitingCode(false);
            }} className="rounded-lg px-4 py-2 text-sm font-medium text-teal-800">
              Change details or resend code
            </button>
          )}
        </div>
      </form>
    </details>
  );
}
