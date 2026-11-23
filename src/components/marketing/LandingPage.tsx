'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { createPublicQueryClient } from '@/lib/publicQueryClient';
import { getPublicPlans, type PublicPlan } from '@/services/publicMarketing';
import { SiteNav } from '@/components/marketing/SiteNav';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CounterPreview, StockPreview, SalesPreview } from '@/components/marketing/WorkflowPreviews';
import { SUPPORT_PHONE } from '@/lib/site';
import '@/app/landing.css';

const workflows = [
  { preview: CounterPreview, label: 'AT THE COUNTER', title: 'Record what the customer bought.', text: 'Search or scan a product, enter the quantity and choose how the customer paid. The sale updates stock and gives you a receipt to share.', points: ['Product search and barcode scanning', 'Record cash, M-Pesa, Airtel Money or bank transfers', 'Receipts with a verification QR code'], href: '/help/recording-sales', link: 'See the checkout steps' },
  { preview: StockPreview, label: 'WHEN YOU RESTOCK', title: 'Check quantities before you buy.', text: 'Look up the stock left for each product. Record purchases and suppliers so incoming stock is accounted for alongside your sales.', points: ['Product quantities and low-stock alerts', 'Purchases and supplier records', 'Different sizes, units and product types'], href: '/help/managing-stock', link: 'Read the stock guide' },
  { preview: SalesPreview, label: 'AT THE END OF THE DAY', title: 'Go back through the day’s sales.', text: 'Check what sold, which payment methods were used and who recorded each sale. Review customer balances without going through separate notebooks.', points: ['Sales history and reports', 'Staff accounts with permissions you control', 'Customer credit and repayments'], href: '/help/sales-reports', link: 'See the available reports' },
];
const steps = [
  ['Create your shop account', 'Add your shop details and choose the currency you use.'],
  ['Enter your products', 'Add prices and the quantities currently in stock.'],
  ['Record a sale', 'Pick a product, enter the quantity and record cash, M-Pesa or a sale on credit.'],
];

function PricingCards({ plans }: { plans: PublicPlan[] }) {
  const starter = plans.find(plan => plan.slug === 'starter');
  const growth = plans.find(plan => plan.slug === 'growth');
  const normalize = (text: string) => text.trim().toLowerCase();
  const starterFeatures = new Set(starter?.highlights.map(normalize));
  const growthFeatures = new Set([...starterFeatures, ...(growth?.highlights.map(normalize) ?? [])]);

  return (
    <div className="plans">
      {plans.map(plan => {
        const featured = plan.slug === 'starter';
        const inherited = plan.slug === 'growth' ? starter : plan.slug === 'business' ? growth ?? starter : undefined;
        const inheritedFeatures = inherited?.slug === 'growth' ? growthFeatures : starterFeatures;
        const highlights = plan.highlights.filter(item => {
          const label = normalize(item);
          if (plan.slug === 'business' && [
            'everything in starter',
            'everything in growth',
            '9 or more shop users',
            'better value for larger teams',
          ].includes(label)) return false;
          return !inherited || !inheritedFeatures.has(label);
        });
        const minUsers = plan.minUsers ?? 1;
        const teamSize = plan.unlimitedUsers ? `${plan.minUsers ?? plan.maxStaff}+` : `${minUsers}–${plan.maxStaff}`;
        const monthlyTotal = plan.monthlyPrice + (plan.monthlyCharge ?? 0);

        return (
          <article className={featured ? 'plan plan-featured' : 'plan'} key={plan.slug} aria-labelledby={`pricing-${plan.slug}`}>
            <header className="plan-header">
              <h3 className="plan-top" id={`pricing-${plan.slug}`}>{plan.name}</h3>
              {featured && plan.billingType === 'flat' && <span className="plan-badge">For teams of {teamSize}</span>}
            </header>
            <div className="plan-price">{plan.currency} {monthlyTotal.toLocaleString('en-KE')} <span>/ month{plan.billingType === 'per_staff' ? ' per staff' : ''}</span></div>
            {plan.billingType === 'flat' && (
              <p className="plan-team">{featured ? 'The owner counts as one shop user.' : `${teamSize} shop users, including the owner.`}</p>
            )}
            <div className="plan-features">
              {inherited && <p className="plan-included">Everything in {inherited.name}</p>}
              {highlights.length > 0 && (
                <ul>{highlights.map(item => (
                  <li key={item}><Check size={16} aria-hidden="true" />{normalize(item) === 'advanced analytics' ? 'Advanced inventory analytics' : normalize(item) === 'ai-powered business insights' ? 'Ask DuQana to explain changes in your sales or stock' : item}</li>
                ))}</ul>
              )}
            </div>
            <div className="plan-action">
              {plan.trialDays > 0 && (
                <p className="plan-trial"><strong>{plan.trialDays} days free.</strong> No card or M-Pesa deposit required to start.</p>
              )}
              <Link href="/register" className={`button ${featured ? 'button-dark' : 'plan-button-outline'}`}>
                Create an account <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

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
          <p className="hero-description">Record sales, see what is left in stock and check what customers owe. Review the day’s takings from your phone.</p>
          <div className="hero-buttons"><Link href="/register" className="button button-dark">Create an account <ArrowRight size={18} aria-hidden="true" /></Link><a href="#features" className="text-link">See how it works <ArrowDown size={16} aria-hidden="true" /></a></div>
          <p className="hero-note">Already using DuQana? <Link href="/login">Sign in to your shop</Link>.</p>
        </div>
        <figure className="hero-photo-panel"><div className="hero-visual"><Image src="/images/nairobi-shopfront.jpg" alt="Customers at a Nairobi shopfront stocked with drinks and household goods" fill sizes="(max-width: 800px) 100vw, 50vw" priority className="hero-photo" /></div><figcaption>Nairobi shopfront. Photo by <a href="https://www.pexels.com/photo/small-shopfront-in-busy-urban-setting-28505434/" target="_blank" rel="noopener noreferrer">Natalia Msungu / Pexels</a>.</figcaption></figure>
      </section>
      <section id="features" className="feature-section">
        <div className="section-heading"><div><p className="eyebrow">SALES, STOCK AND CUSTOMER RECORDS</p><h2>What you can do<br />with DuQana.</h2></div><p>Use the same records when serving a customer, restocking or checking the day’s takings.</p></div>
        <div className="workflow-list">{workflows.map(({ preview: Preview, ...workflow }) => <article className="workflow" key={workflow.label}>
          <p className="workflow-number">{workflow.label}</p><div><h3>{workflow.title}</h3><p>{workflow.text}</p><Link href={workflow.href} className="workflow-link">{workflow.link} <ArrowRight size={15} aria-hidden="true" /></Link><ul>{workflow.points.map(point => <li key={point}><Check size={16} aria-hidden="true" />{point}</li>)}</ul></div><Preview />
        </article>)}</div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="how-intro"><p className="eyebrow">GETTING STARTED</p><h2>Set up the records<br />you sell from.</h2><p>Have your shop details, product prices and opening stock quantities ready.</p><Link href="/help/getting-started" className="text-link">Read the setup guide <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <ol className="steps">{steps.map(([title, text], index) => <li className="step" key={title}><span aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="section-heading"><div><p className="eyebrow">PRICING</p><h2>Choose your shop’s plan.</h2></div><p>Compare the monthly total and the number of shop users included.</p></div>
        {plans.isPending ? <p className="plan-status" role="status">Loading current plans…</p> : plans.isError ? <div className="plan-status" role="alert">We couldn’t load pricing. <button onClick={() => plans.refetch()}>Try again</button> or <Link href="/contact">ask us about plans</Link>.</div> : !plans.data?.length ? <p className="plan-status">Plans are currently unavailable. <Link href="/contact">Ask us about pricing</Link>.</p> : <PricingCards plans={plans.data} />}
      </section>
      <section className="closing"><div><h2>Need help setting up?</h2><p>Tell us what you sell and how many people will use your shop account.</p></div><div className="closing-actions">
        <a href={`tel:${SUPPORT_PHONE}`} className="button button-light">Call {SUPPORT_PHONE}</a>
        <Link href="/contact" className="closing-link">Send a setup question <ArrowRight size={17} aria-hidden="true" /></Link>
      </div></section>
    </main>
    <SiteFooter />
  </div>;
}
