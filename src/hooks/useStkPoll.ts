'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type StkStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';
export type StkStage = 'idle' | 'initiating' | StkStatus;

export interface StkPollResult {
  status: StkStatus;
  receipt?: string | null;
  errorMessage?: string | null;
}

export interface StkInitiateResult extends StkPollResult {
  id: string;
}

interface UseStkPollOptions {
  initiate: (idempotencyKey: string) => Promise<StkInitiateResult>;
  poll: (id: string) => Promise<StkPollResult>;
  intervalMs?: number;
  /** Stop waiting locally; this does not establish the provider's outcome. */
  timeoutMs?: number;
  /** Subscription retries recover the original intent and original payload. */
  protectUnconfirmedAttempts?: boolean;
}

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useStkPoll({
  initiate,
  poll,
  intervalMs = 3000,
  timeoutMs = 90_000,
  protectUnconfirmedAttempts = false,
}: UseStkPollOptions) {
  const [stage, setStage] = useState<StkStage>('idle');
  const [id, setId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initiationUncertain, setInitiationUncertain] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  const idRef = useRef<string | null>(null);
  const intentRef = useRef<{ key: string; initiate: typeof initiate } | null>(null);
  const initiateRef = useRef(initiate);
  const pollRef = useRef(poll);
  initiateRef.current = initiate;
  pollRef.current = poll;

  const stopPolling = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const settle = useCallback((result: StkPollResult) => {
    if (!mountedRef.current) return;
    stopPolling();
    generationRef.current++;
    busyRef.current = false;
    if (result.status !== 'timeout') intentRef.current = null;
    setInitiationUncertain(false);
    setReceipt(result.receipt ?? null);
    setErrorMessage(result.errorMessage ?? null);
    setStage(result.status);
  }, [stopPolling]);

  const beginPolling = useCallback((transactionId: string) => {
    stopPolling();
    const generation = ++generationRef.current;
    const deadline = Date.now() + timeoutMs;
    busyRef.current = true;
    const current = () => mountedRef.current && generation === generationRef.current;
    const tick = async () => {
      if (!current()) return;
      if (Date.now() >= deadline) {
        stopPolling();
        busyRef.current = false;
        generationRef.current++;
        setStage('timeout');
        return;
      }
      try {
        const result = await pollRef.current(transactionId);
        if (!current()) return;
        if (result.status !== 'pending') {
          settle(result);
          return;
        }
        setErrorMessage(result.errorMessage ?? null);
      } catch {
        // Connection loss says nothing about whether money was received.
      }
      if (current()) timerRef.current = setTimeout(tick, intervalMs);
    };
    // Schedule after the previous request finishes: slow polls never overlap.
    timerRef.current = setTimeout(tick, intervalMs);
  }, [intervalMs, timeoutMs, settle, stopPolling]);

  const start = useCallback(async () => {
    // Ref guard also covers taps in the same render, before disabled UI paints.
    if (!mountedRef.current || busyRef.current) return;
    if (protectUnconfirmedAttempts && intentRef.current && idRef.current) {
      setStage('pending');
      beginPolling(idRef.current);
      return;
    }
    busyRef.current = true;
    stopPolling();
    const generation = ++generationRef.current;
    const attempt = protectUnconfirmedAttempts && intentRef.current
      ? intentRef.current
      : { key: newKey(), initiate: initiateRef.current };
    intentRef.current = attempt;
    idRef.current = null;
    setStage('initiating');
    setId(null);
    setReceipt(null);
    setErrorMessage(null);
    try {
      const result = await attempt.initiate(attempt.key);
      if (!mountedRef.current || generation !== generationRef.current) return;
      idRef.current = result.id;
      setId(result.id);
      setInitiationUncertain(false);
      if (result.status !== 'pending') {
        settle(result);
        return;
      }
      setErrorMessage(result.errorMessage ?? null);
      setStage('pending');
      beginPolling(result.id);
    } catch (err: unknown) {
      if (!mountedRef.current || generation !== generationRef.current) return;
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const uncertain = !e.response?.status || e.response.status >= 500;
      if (!uncertain) intentRef.current = null;
      busyRef.current = false;
      setInitiationUncertain(uncertain);
      setErrorMessage(uncertain && protectUnconfirmedAttempts
        ? 'We could not confirm the request. Recover this attempt before starting another payment.'
        : e.response?.data?.message || e.message || 'Could not send the payment request.');
      setStage('failed');
    }
  }, [beginPolling, settle, stopPolling, protectUnconfirmedAttempts]);

  const reset = useCallback(() => {
    stopPolling();
    generationRef.current++;
    busyRef.current = false;
    idRef.current = null;
    intentRef.current = null;
    setStage('idle');
    setId(null);
    setReceipt(null);
    setErrorMessage(null);
    setInitiationUncertain(false);
  }, [stopPolling]);

  const resolveExternally = useCallback((result: StkPollResult & { id?: string }) => {
    if (!mountedRef.current) return;
    if (result.id) {
      idRef.current = result.id;
      setId(result.id);
    }
    if (result.status === 'pending' && idRef.current) {
      setErrorMessage(result.errorMessage ?? null);
      setStage('pending');
      beginPolling(idRef.current);
    } else {
      settle(result);
    }
  }, [beginPolling, settle]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const isTerminal = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';
  return {
    stage, id, receipt, errorMessage, initiationUncertain,
    isUnconfirmed: initiationUncertain || stage === 'pending' || stage === 'initiating' || stage === 'timeout',
    isTerminal,
    isSettled: isTerminal || stage === 'success',
    start, reset, resolveExternally,
  };
}
