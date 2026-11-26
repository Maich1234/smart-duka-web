'use client';

import { useState } from 'react';
import Link from 'next/link';
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

function CheckoutDemo() {
  const [quantity, setQuantity] = useState(2);
  const [payment, setPayment] = useState('M-Pesa');
  const [recorded, setRecorded] = useState(false);
  const total = (quantity + 1) * 65;

  return (
    <section className="landing-till" aria-labelledby="checkout-heading">
      <header><h2 id="checkout-heading" tabIndex={-1}>Checkout</h2><span>Interactive demo</span></header>
      <div className="landing-till-body">
        <div className="landing-till-row">
          <div><strong>Milk</strong><small>500 ml · KES 65 each</small></div>
          <label>Qty <select aria-label="Milk quantity" value={quantity} onChange={event => {
            setQuantity(Number(event.target.value));
            setRecorded(false);
          }}>{[1, 2, 3, 4].map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        <div className="landing-till-row"><div><strong>Bread</strong><small>400 g · KES 65 each</small></div><span>× 1</span></div>
        <div className="landing-till-row"><strong>Total</strong><strong aria-live="polite">KES {total}</strong></div>
        <fieldset>
          <legend>Payment method</legend>
          {['M-Pesa', 'Cash'].map(method => <label key={method}>
            <input type="radio" name="demo-payment" value={method} checked={payment === method} onChange={() => {
              setPayment(method);
              setRecorded(false);
            }} /> {method}
          </label>)}
        </fieldset>
        <button className="button button-dark" type="button" onClick={() => setRecorded(true)}>Record demo sale</button>
        <p className="landing-receipt" data-recorded={recorded} role="status">
          {recorded ? `Demo receipt · ${payment} · KES ${total}` : 'Choose a payment method and try a sale.'}
        </p>
      </div>
    </section>
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
          <h1>From the first sale <em>to closing time.</em></h1>
          <p className="hero-description">A point of sale for Kenyan shops. Ring up cash and M-Pesa sales, see what is left on the shelf and keep track of customer credit.</p>
          <div className="hero-buttons">
            <Link href="/register" className="button button-dark">Create an account <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="#checkout-heading" className="text-link">Try the checkout <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
          <p className="hero-note">Use DuQana on mobile or web. <a href="#offline">See what works offline</a>.</p>
        </div>
        <div className="landing-hero-art">
          <picture className="landing-hero-photo">
            <img src="/images/duqana-shopkeeper-1280.webp" srcSet="/images/duqana-shopkeeper-640.webp 640w, /images/duqana-shopkeeper-1280.webp 1280w" sizes="(max-width: 800px) 92vw, 44vw" alt="Illustration of a Kenyan shopkeeper at the counter" width={1280} height={853} fetchPriority="high" />
          </picture>
          <CheckoutDemo />
        </div>
      </section>
      <section id="features" className="feature-section">
        <div className="section-heading"><div><h2>From the shelf to the sales report.</h2></div><p>Use the same records when serving a customer, restocking or checking the day’s takings.</p></div>
        <div className="workflow-list">{workflows.map(({ preview: Preview, ...workflow }) => <article className="workflow" key={workflow.label}>
          <p className="workflow-number">{workflow.label}</p><div><h3>{workflow.title}</h3><p>{workflow.text}</p><Link href={workflow.href} className="workflow-link">{workflow.link} <ArrowRight size={15} aria-hidden="true" /></Link><ul>{workflow.points.map(point => <li key={point}><Check size={16} aria-hidden="true" />{point}</li>)}</ul></div><Preview />
        </article>)}</div>
      </section>
      <section className="landing-info" aria-labelledby="shop-tools">
        <div>
          <h2 id="shop-tools">The tools behind the till.</h2>
          <picture className="landing-stock-photo">
            <img src="/images/duqana-stocktake-640.webp" srcSet="/images/duqana-stocktake-640.webp 640w, /images/duqana-stocktake-1280.webp 1280w" sizes="(max-width: 800px) 88vw, 40vw" alt="Illustration of a shopkeeper using a checklist during a stocktake" width={1280} height={853} loading="lazy" decoding="async" />
          </picture>
        </div>
        <dl>
          <div><dt>Products and barcodes</dt><dd>Scan packaged goods or sell items by weight or volume, such as flour by the kilo. <Link href="/help/product-types">See product types</Link>.</dd></div>
          <div><dt>Customer credit</dt><dd>Record sales on credit, log repayments and check each customer’s balance.</dd></div>
          <div><dt>Individual staff logins</dt><dd>Choose which tasks each cashier can access and see who recorded a sale. <Link href="/help/staff-permissions">See staff permissions</Link>.</dd></div>
          <div><dt>Receipts customers can verify</dt><dd>Share a digital receipt or print it with a compatible printer. Customers can scan its QR code to verify it.</dd></div>
        </dl>
      </section>
      <section id="offline" className="landing-info landing-offline">
        <div><h2>When the internet drops.</h2><p>DuQana’s mobile app saves sales on the device and syncs them when you reconnect.</p></div>
        <dl>
          <div><dt>Web app</dt><dd>The browser version requires an internet connection.</dd></div>
          <div><dt>M-Pesa checkout prompts</dt><dd>Connect a business Till or Paybill to send the customer a payment prompt. <Link href="/help/faq">Read the payments guide</Link>.</dd></div>
        </dl>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="how-intro"><p className="eyebrow">GETTING STARTED</p><h2>Set up the records<br />you sell from.</h2><p>Have your shop details, product prices and opening stock quantities ready.</p><Link href="/help/getting-started" className="text-link">Read the setup guide <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <ol className="steps">{steps.map(([title, text], index) => <li className="step" key={title}><span aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="section-heading"><div><p className="eyebrow">PRICING</p><h2>Choose your shop’s plan.</h2></div><p>Compare the monthly total and the number of shop users included.</p></div>
        {plans.isPending ? <p className="plan-status" role="status">Loading current plans…</p> : plans.isError ? <div className="plan-status" role="alert">We couldn’t load pricing. <button onClick={() => plans.refetch()}>Try again</button> or <Link href="/contact">ask us about plans</Link>.</div> : !plans.data?.length ? <p className="plan-status">Plans are currently unavailable. <Link href="/contact">Ask us about pricing</Link>.</p> : <PricingCards plans={plans.data} />}
      </section>
      <section className="landing-info landing-faq" aria-labelledby="landing-faq-title">
        <h2 id="landing-faq-title">Before you sign up.</h2>
        <div>
          <details><summary>Can I record cash sales without setting up M-Pesa?</summary><p>Yes. Choose cash at checkout. Set up M-Pesa separately if you want to send payment prompts.</p></details>
          <details><summary>Can my cashier have their own login?</summary><p>Yes. Each staff member can have their own login, and the owner chooses which tasks they can access.</p></details>
          <details><summary>Does a customer need an account to verify a receipt?</summary><p>The receipt QR code opens a public verification page that customers can view without signing in.</p></details>
        </div>
      </section>
      <section className="closing"><div><h2>Need help setting up?</h2><p>Tell us what you sell and how many people will use your shop account.</p></div><div className="closing-actions">
        <a href={`tel:${SUPPORT_PHONE}`} className="button button-light">Call {SUPPORT_PHONE}</a>
        <Link href="/contact" className="closing-link">Send a setup question <ArrowRight size={17} aria-hidden="true" /></Link>
      </div></section>
    </main>
    <SiteFooter />
  </div>;
}
