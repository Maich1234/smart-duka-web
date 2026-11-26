'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { signedInDestination } from '@/lib/signedInDestination';
import { useAuthStore } from '@/store/authStore';
import styles from './SiteNav.module.css';

const LINKS = [
  { href: '/#features', label: 'What it does' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/help', label: 'Help' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Shared by every public marketing page. */
export function SiteNav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const signedInUser = useAuthStore((s) => s.isAuthenticated ? s.user : null);
  const appHref = signedInUser ? signedInDestination(signedInUser) : '/login';
  const appLabel = signedInUser ? 'Open DuQana' : 'Sign in';
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  const links = LINKS.map(link => <Link key={link.href} href={link.href} aria-current={active === link.href ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}</Link>);
  return <header className={styles.header} ref={header}>
    <div className={styles.bar}>
      <Link href="/" className={styles.brand} aria-label="DuQana home" onClick={() => setOpen(false)}><Image src="/icons/logo-mark.png" alt="" width={28} height={28} /><span data-duqana-wordmark>DuQana<span className={styles.dot}>.</span></span></Link>
      <nav className={styles.links} aria-label="Main navigation">{links}</nav>
      <div className={styles.actions}><Link href={appHref}>{appLabel}</Link><Link href="/register" className={styles.cta}>Get started <ArrowUpRight size={16} /></Link></div>
      <button ref={toggle} type="button" className={styles.toggle} onClick={() => setOpen(value => !value)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="public-mobile-navigation">{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    </div>
    {open && <nav id="public-mobile-navigation" className={styles.mobile} aria-label="Mobile navigation">{links}<Link href={appHref} onClick={() => setOpen(false)}>{appLabel}</Link><Link href="/register" className={styles.cta} onClick={() => setOpen(false)}>Get started <ArrowUpRight size={16} /></Link></nav>}
  </header>;
}
