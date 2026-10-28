'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { getPublicPlans } from '@/services/publicMarketing';
import './landing.css';
import { SiteNav } from '@/components/marketing/SiteNav';

const workflows = [
  { n:'01', label:'SELL', title:'A smoother sale, from counter to receipt.', text:'Find a product, add it to the sale and record how your customer paid. Keep the details together so the next sale is easier.', points:['Search and barcode scanning','Cash, M-PESA and configured payment methods','Receipts for completed sales'] },
  { n:'02', label:'STOCK', title:'Know what is on your shelves.', text:'Bring products, quantities and purchasing into one place. Spot what needs attention before the shelf is empty.', points:['Product and stock records','Low-stock alerts','Purchases and suppliers'] },
  { n:'03', label:'UNDERSTAND', title:'Make sense of the day.', text:'See your sales, review business reports and give your team access to the work they need to do.', points:['Sales history and reports','Staff roles and permissions','Business insights'] },
];

export default function LandingPage() {
  const plans = useQuery({ queryKey:['public-plans'], queryFn:getPublicPlans, staleTime:3600000, retry:1 });
  return <main className="landing">
    <SiteNav />
    <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot"/> MADE FOR THE WAY YOU TRADE</p><h1>Your shop has<br/><em>a lot going on.</em><br/>Keep it together.</h1><p className="hero-description">Sales, stock and the people behind your business—all in one place. DuQana helps you spend less time searching for answers and more time serving customers.</p><div className="hero-buttons"><Link href="/register" className="button button-dark">Start with DuQana <ArrowRight size={18}/></Link><a href="#features" className="text-link">Explore the app <ArrowDown size={16}/></a></div><p className="hero-note">For kiosks, shops and growing businesses.</p></div>
      <div className="hero-visual"><Image src="/images/shop-editorial.webp" alt="Shopkeeper checking a phone while working at a grocery counter" fill sizes="(max-width: 800px) 100vw, 50vw" priority className="hero-photo"/><div className="photo-caption"><span>BUILT FOR THE EVERYDAY</span><span>01 / 03</span></div><div className="photo-tag"><span className="tag-star">✳</span><span>Good business<br/><strong>starts here.</strong></span></div></div>
    </section>
    <div className="ticker"><span>ONE PLACE FOR YOUR BUSINESS</span><span>✳</span><span>SALES</span><span>✳</span><span>STOCK</span><span>✳</span><span>YOUR TEAM</span><span>✳</span><span>BETTER DECISIONS</span></div>
    <section id="features" className="feature-section"><div className="section-heading"><div><p className="eyebrow">THE EVERYDAY, MADE CLEARER</p><h2>Everything has<br/><em>its place.</em></h2></div><p>From the first customer to the last stock check, DuQana brings the moving parts of your day together.</p></div>
      <div className="workflow-list">{workflows.map(w=><article className="workflow" key={w.n}><span className="workflow-number">{w.n} <span>/</span> {w.label}</span><div><h3>{w.title}</h3><p>{w.text}</p></div><ul>{w.points.map(p=><li key={p}><Check size={16}/>{p}</li>)}</ul><ArrowUpRight className="workflow-arrow" size={24}/></article>)}</div>
    </section>
    <section id="how-it-works" className="how-section"><div className="how-intro"><p className="eyebrow">A SIMPLE WAY TO BEGIN</p><h2>Less setup.<br/><em>More selling.</em></h2><p>Start with the basics, then make DuQana work for your shop.</p><Link href="/register" className="button button-light">Create your account <ArrowRight size={17}/></Link></div><div className="steps">{[['01','Set up your shop','Create an account and tell us about your business.'],['02','Add what you sell','Create your product list and set your prices.'],['03','Make your first sale','Find an item, add it to the basket and record the payment.']].map(([n,title,text])=><div className="step" key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>
    <section id="pricing" className="pricing-section"><div className="section-heading"><div><p className="eyebrow">PRICING</p><h2>A plan for<br/><em>your business.</em></h2></div><p>Choose the plan that fits your team. Current plans and pricing are shown below.</p></div>{plans.isPending?<p className="plan-status" role="status">Loading current plans…</p>:plans.isError?<div className="plan-status" role="alert">We couldn’t load pricing right now. <button onClick={()=>plans.refetch()}>Try again</button> or <Link href="/contact">contact us</Link>.</div>:!plans.data?.length?<p className="plan-status">Plans are currently unavailable. <Link href="/contact">Contact us for details.</Link></p>:<div className="plans">{plans.data.map(plan=><article className="plan" key={plan.slug}><div className="plan-top"><span>{plan.name}</span>{plan.badge&&<small>{plan.badge}</small>}</div><p>{plan.tagline || plan.description}</p><div className="plan-price">{plan.currency} {plan.monthlyPrice.toLocaleString()} <span>/ month{plan.billingType==='per_staff'?' per staff':''}</span></div>{plan.trialDays>0&&<p className="trial">{plan.trialDays}-day trial</p>}<ul>{plan.highlights.map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul><Link href="/register" className="button button-dark">Get started <ArrowRight size={16}/></Link></article>)}</div>}</section>
    <section className="closing"><p className="eyebrow">READY WHEN YOU ARE</p><h2>Your next chapter<br/><em>starts at the counter.</em></h2><Link href="/register" className="button button-light">Get started <ArrowRight size={17}/></Link></section>
    <footer className="landing-footer"><div><Link href="/" className="footer-brand">DuQana<span>.</span></Link><p>Made for the people<br/>behind the counter.</p></div><div><span>EXPLORE</span><a href="#features">Features</a><a href="#pricing">Pricing</a><Link href="/about">About</Link></div><div><span>SUPPORT</span><Link href="/help">Help centre</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/delete-account">Delete account</Link></div><small>© {new Date().getFullYear()} DuQana</small></footer>
  </main>;
}
