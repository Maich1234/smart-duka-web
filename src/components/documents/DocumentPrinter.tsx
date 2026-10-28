'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, LoaderCircle, ShoppingBag } from 'lucide-react';
import styles from './DocumentPrinter.module.css';

type DocumentPrinterProps = {
  kind: 'receipt' | 'quotation';
  state: 'loading' | 'ready' | 'error';
  shopName?: string;
  total?: string;
  error?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

/** Presentation only: request state owns progress, with no artificial wait. */
export default function DocumentPrinter({ kind, state, shopName, total, error, onRetry, children }: DocumentPrinterProps) {
  const label = kind === 'receipt' ? 'Receipt' : 'Quotation';
  const status = state === 'loading' ? `Loading your ${kind}…` : state === 'error' ? `${label} unavailable` : `${label} ready`;
  return (
    <section className={styles.printer} data-state={state} aria-label={`${label} viewer`}>
      <div className={styles.machine}>
        <div className={styles.topline}>
          <Link href="/" className={styles.brand}><ShoppingBag size={17} aria-hidden="true" />DuQana</Link>
          <span className={styles.tag}>DIGITAL {label.toUpperCase()}</span>
        </div>
        <div className={styles.screen}>
          <div className={styles.summary}>
            <div><p className={styles.eyebrow}>{label}</p><h1>{shopName || `Your ${kind}`}</h1></div>
            {state === 'ready' && total && <div className={styles.amount}><span>Total amount</span><strong>{total}</strong></div>}
          </div>
          <p className={styles.status} role="status" aria-live="polite">
            {state === 'loading' ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : state === 'error' ? <CircleAlert size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
            {status}
          </p>
        </div>
        <div className={styles.slot} aria-hidden="true" />
      </div>
      {state === 'loading' && <>
        <div className={styles.placeholder} aria-hidden="true"><i /><i /><i /><i /></div>
        <p className={styles.hint}>Fetching the details securely. If this fails, you can try again.</p>
      </>}
      {state === 'error' && <div className={styles.failure}>
        <p role="alert">{error || `We couldn’t load this ${kind}. Check your connection and try again.`}</p>
        {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
        <Link href="/">Go to DuQana</Link>
      </div>}
      {state === 'ready' && <div className={styles.output}><article className={styles.paper}>{children}</article></div>}
    </section>
  );
}
