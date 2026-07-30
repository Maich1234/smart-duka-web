'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The M-PESA STK Push state machine: send the prompt, poll until the customer
 * responds, settle.
 *
 * Written once here because it existed three times — the till's payment
 * modal, the subscription payment modal, and the retired seat-payment path —
 * with the same interval handling, deadline, network-jitter tolerance and
 * terminal mapping copied between them. Only the endpoints and payload shapes
 * differed, so those are injected.
 */

export type StkStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';
export type StkStage = 'idle' | 'initiating' | StkStatus;

/** What a poll tells us. Adapters normalise each endpoint's own field names. */
export interface StkPollResult {
  status: StkStatus;
  receipt?: string | null;
  errorMessage?: string | null;
}

/** What initiating tells us, plus the id later polls are keyed on. */
export interface StkInitiateResult extends StkPollResult {
  id: string;
}

interface UseStkPollOptions {
  /**
   * Send the STK push. The key is fresh per attempt, so a retry is a genuinely
   * new prompt rather than a replay of the previous response.
   */
  initiate: (idempotencyKey: string) => Promise<StkInitiateResult>;
  poll: (id: string) => Promise<StkPollResult>;
  intervalMs?: number;
  /** Give up after this long. Safaricom's own prompt expires around 60s. */
  timeoutMs?: number;
}

const DEFAULT_INTERVAL_MS = 3000;
const DEFAULT_TIMEOUT_MS = 90_000;

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useStkPoll({
  initiate,
  poll,
  intervalMs = DEFAULT_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: UseStkPollOptions) {
  const [stage, setStage] = useState<StkStage>('idle');
  const [id, setId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef(0);

  // Callers pass inline arrow functions, which change identity every render.
  // Holding them in refs keeps `start` stable so it can't restart the flow.
  const initiateRef = useRef(initiate);
  const pollRef = useRef(poll);
  initiateRef.current = initiate;
  pollRef.current = poll;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const settle = useCallback(
    (result: StkPollResult) => {
      stopPolling();
      setReceipt(result.receipt ?? null);
      setErrorMessage(result.errorMessage ?? null);
      setStage(result.status);
    },
    [stopPolling]
  );

  const beginPolling = useCallback(
    (transactionId: string) => {
      stopPolling();
      deadlineRef.current = Date.now() + timeoutMs;
      timerRef.current = setInterval(async () => {
        if (Date.now() > deadlineRef.current) {
          stopPolling();
          setStage('timeout');
          return;
        }
        try {
          const result = await pollRef.current(transactionId);
          if (result.status !== 'pending') settle(result);
        } catch {
          // A failed poll says nothing about the payment — the customer may
          // still be typing their PIN. Keep going until the deadline.
        }
      }, intervalMs);
    },
    [intervalMs, timeoutMs, settle, stopPolling]
  );

  const start = useCallback(async () => {
    stopPolling();
    setStage('initiating');
    setId(null);
    setReceipt(null);
    setErrorMessage(null);

    try {
      const result = await initiateRef.current(newKey());
      setId(result.id);

      // Already decided — an idempotent replay of a settled attempt, or a
      // failure the server caught before the prompt went out.
      if (result.status !== 'pending') {
        settle(result);
        return;
      }

      setStage('pending');
      beginPolling(result.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        e.response?.data?.message || e.message || 'Could not send the payment request.'
      );
      setStage('failed');
    }
  }, [beginPolling, settle, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStage('idle');
    setId(null);
    setReceipt(null);
    setErrorMessage(null);
  }, [stopPolling]);

  /**
   * Adopt a result confirmed some other way — verifying an M-Pesa receipt
   * code, or reconciling a pasted confirmation SMS. `id` is optional because
   * those paths don't always surface one.
   */
  const resolveExternally = useCallback(
    (result: StkPollResult & { id?: string }) => {
      if (result.id) setId(result.id);
      settle(result);
    },
    [settle]
  );

  useEffect(() => stopPolling, [stopPolling]);

  const isTerminal = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return {
    stage,
    id,
    receipt,
    errorMessage,
    /** In a terminal *unsuccessful* state — the retry/recover affordances. */
    isTerminal,
    isSettled: isTerminal || stage === 'success',
    start,
    reset,
    resolveExternally,
  };
}
