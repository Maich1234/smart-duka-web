'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { createPublicQueryClient } from '@/lib/publicQueryClient';
import { getPublicPlans } from '@/services/publicMarketing';
import { SiteNav } from '@/components/marketing/SiteNav';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import '@/app/landing.css';

const workflows = [
  { label: 'AT THE COUNTER', title: 'Record what the customer bought.', text: 'Search or scan a product, enter the quantity and choose how the customer paid. The sale updates stock and gives you a receipt to share.', points: ['Product search and barcode scanning', 'Cash, M-Pesa and your other payment methods', 'Receipts with a verification QR code'], href: '/help/recording-sales', link: 'See the checkout steps' },
  { label: 'WHEN YOU RESTOCK', title: 'Check quantities before you buy.', text: 'Look up the stock left for each product. Record purchases and suppliers so incoming stock is accounted for alongside your sales.', points: ['Product quantities and low-stock alerts', 'Purchases and supplier records', 'Different sizes, units and product types'], href: '/help/managing-stock', link: 'Read the stock guide' },
  { label: 'AT THE END OF THE DAY', title: 'Go back through the day’s sales.', text: 'Check what sold, which payment methods were used and who recorded each sale. Review customer balances without going through separate notebooks.', points: ['Sales history and reports', 'Staff accounts with permissions you control', 'Customer credit and repayments'], href: '/help/sales-reports', link: 'See the available reports' },
];
const steps = [
  ['Create your shop account', 'Add your shop details and choose the currency you use.'],
  ['Enter your products', 'Add prices and the quantities currently in stock.'],
  ['Record a sale', 'Choose a product, enter the quantity and record the payment.'],
];

export default function LandingPage() {
  const [publicClient] = useState(createPublicQueryClient);
  const plans = useQuery({ queryKey: ['public-plans'], queryFn: getPublicPlans, staleTime: 60_000, refetchOnMount: 'always', refetchOnWindowFocus: 'always', refetchInterval: 60_000, refetchIntervalInBackground: false, retry: 1 }, publicClient);
  return <div className="landing">
    <SiteNav />
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DUQANA POS FOR KENYAN SHOPS</p>
          <h1>Record a sale.<br />Keep stock up to date.</h1>
          <p className="hero-description">DuQana brings your shop’s sales, inventory and customer records together. Record Cash or M-Pesa, give staff their own logins and review the day’s sales from your phone.</p>
          <div className="hero-buttons"><Link href="/register" className="button button-dark">Create an account <ArrowRight size={18} aria-hidden="true" /></Link><a href="#features" className="text-link">See how it works <ArrowDown size={16} aria-hidden="true" /></a></div>
          <p className="hero-note">Already using DuQana? <Link href="/login">Sign in to your shop</Link>.</p>
        </div>
        <figure className="hero-photo-panel"><div className="hero-visual"><Image src="/images/nairobi-shopfront.jpg" alt="Customers at a Nairobi shopfront stocked with drinks and household goods" fill sizes="(max-width: 800px) 100vw, 50vw" priority className="hero-photo" /></div><figcaption>Nairobi shopfront. Photo by <a href="https://www.pexels.com/photo/small-shopfront-in-busy-urban-setting-28505434/" target="_blank" rel="noopener noreferrer">Natalia Msungu / Pexels</a>.</figcaption></figure>
      </section>
      <section id="features" className="feature-section">
        <div className="section-heading"><div><p className="eyebrow">SALES, STOCK AND CUSTOMER RECORDS</p><h2>What you can do<br />with DuQana.</h2></div><p>Use the same records when serving a customer, restocking or checking the day’s takings.</p></div>
        <div className="workflow-list">{workflows.map(workflow => <article className="workflow" key={workflow.label}>
          <p className="workflow-number">{workflow.label}</p><div><h3>{workflow.title}</h3><p>{workflow.text}</p><Link href={workflow.href} className="workflow-link">{workflow.link} <ArrowRight size={15} aria-hidden="true" /></Link></div><ul>{workflow.points.map(point => <li key={point}><Check size={16} aria-hidden="true" />{point}</li>)}</ul>
        </article>)}</div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="how-intro"><p className="eyebrow">GETTING STARTED</p><h2>Set up the records<br />you sell from.</h2><p>You will need your shop details, product prices and opening stock quantities. You can add staff and set their permissions after creating the shop.</p><Link href="/help/getting-started" className="text-link">Read the setup guide <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <ol className="steps">{steps.map(([title, text], index) => <li className="step" key={title}><span aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="section-heading"><div><p className="eyebrow">PRICING</p><h2>Choose your shop’s plan.</h2></div><p>Compare the monthly total and the number of shop users included.</p></div>
        {plans.isPending ? <p className="plan-status" role="status">Loading current plans…</p> : plans.isError ? <div className="plan-status" role="alert">We couldn’t load pricing. <button onClick={() => plans.refetch()}>Try again</button> or <Link href="/contact">ask us about plans</Link>.</div> : !plans.data?.length ? <p className="plan-status">Plans are currently unavailable. <Link href="/contact">Ask us about pricing</Link>.</p> : <div className="plans">{plans.data.map(plan => <article className="plan" key={plan.slug}>
          <h3 className="plan-top">{plan.name}</h3>
          <div className="plan-price">{plan.currency} {(plan.monthlyPrice + (plan.monthlyCharge ?? 0)).toLocaleString()} <span>/ month{plan.billingType === 'per_staff' ? ' per staff' : ''}</span></div>
          {plan.billingType === 'flat' && <p>{plan.unlimitedUsers ? `${plan.minUsers ?? plan.maxStaff}+ shop users` : `${plan.minUsers ?? 1} to ${plan.maxStaff} shop users`}, including the owner.</p>}
          {!!plan.monthlyCharge && <p>{plan.currency} {plan.monthlyPrice.toLocaleString()} + {plan.currency} {plan.monthlyCharge} monthly charge.</p>}
          {plan.trialDays > 0 && <p className="trial">{plan.trialDays}-day trial</p>}
          <ul>{plan.highlights.map(item => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
          <Link href="/register" className="button button-dark">Create an account <ArrowRight size={16} aria-hidden="true" /></Link>
        </article>)}</div>}
      </section>
      <section className="closing"><div><h2>Need help setting up?</h2><p>Tell us what you sell and how many people will use your shop account.</p></div><Link href="/contact" className="button button-light">Talk to the team <ArrowRight size={17} aria-hidden="true" /></Link></section>
    </main>
    <SiteFooter />
  </div>;
}
