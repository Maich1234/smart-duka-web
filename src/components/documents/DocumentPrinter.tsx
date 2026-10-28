'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

/** Network readiness starts the paper feed; animation never delays fetching. */
export default function DocumentPrinter({ kind, state, shopName, total, error, onRetry, children }: DocumentPrinterProps) {
  const [hasPrinted, setHasPrinted] = useState(false);
  const printing = state === 'ready' && !hasPrinted;
  useEffect(() => {
    if (state !== 'ready') { setHasPrinted(false); return; }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) { setHasPrinted(true); return; }
    // Safety net for cancelled/disabled CSS animations; completion normally
    // comes from the paper's animationend event, never a network timer.
    const fallback = window.setTimeout(() => setHasPrinted(true), 2100);
    const onMotionChange = () => { if (motion.matches) setHasPrinted(true); };
    motion.addEventListener('change', onMotionChange);
    return () => { window.clearTimeout(fallback); motion.removeEventListener('change', onMotionChange); };
  }, [state]);
  const label = kind === 'receipt' ? 'Receipt' : 'Quotation';
  const status = state === 'loading' ? `Loading your ${kind}…` : state === 'error' ? `${label} unavailable` : printing ? `Printing your ${kind}…` : `${label} ready`;
  return (
    <section className={styles.printer} data-state={printing ? 'printing' : state} aria-label={`${label} viewer`}>
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
            {state === 'loading' || printing ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : state === 'error' ? <CircleAlert size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
            {status}
          </p>
          <p className={styles.printingNote} aria-hidden={!printing} style={{ visibility: printing ? 'visible' : 'hidden' }}>Please wait while our printer prints your {kind}.</p>
        </div>
        <div className={styles.slot} aria-hidden="true" />
      </div>
      {state === 'loading' && <>
        <div className={styles.placeholder} aria-hidden="true"><i /><i /><i /><i /></div>
        <p className={styles.hint}>Please wait while our printer prepares your {kind} for printing.</p>
      </>}
      {state === 'error' && <div className={styles.failure}>
        <p role="alert">{error || `We couldn’t load this ${kind}. Check your connection and try again.`}</p>
        {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
        <Link href="/">Go to DuQana</Link>
      </div>}
      {state === 'ready' && <div className={styles.output}><article className={styles.paper} onAnimationEnd={event => { if (event.target === event.currentTarget) setHasPrinted(true); }}>{children}</article></div>}
    </section>
  );
}
