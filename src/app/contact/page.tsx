'use client';
import { SiteNav } from '@/components/marketing/SiteNav';
import { SiteFooter } from '@/components/marketing/SiteFooter';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Mail, Phone, BookOpen, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/site';
import { submitContactForm } from '@/services/support';

const contactMethods = [
  { icon: Mail, title: 'Email', detail: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, sub: 'For account, billing and setup questions.' },
  { icon: Phone, title: 'Phone', detail: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE}`, sub: 'Call the DuQana team.' },
  { icon: BookOpen, title: 'Help centre', detail: 'Find a step-by-step guide', href: '/help', sub: 'Sales, stock, staff and shop settings.' },
];
const faqs = [
  { q: 'What does a subscription cost?', a: 'Each plan shows its user limit and the monthly total, including the additional charge.', href: '/#pricing', link: 'See current prices' },
  { q: 'Can I use DuQana without internet?', a: 'The mobile app can save sales offline and sync them when the connection returns. The web app needs an internet connection. Account setup and payment confirmation also need internet.' },
  { q: 'Can I record M-Pesa payments?', a: 'You can record M-Pesa as a payment method. Sending a payment prompt to a customer also requires a connected and enabled M-Pesa Business account.' },
  { q: 'How do I give staff access?', a: 'The shop owner adds staff accounts and chooses their permissions. Each person signs in with their own details.' },
  { q: 'What should I include in a support message?', a: 'Tell us which screen you were on, what you tried and the error you saw. Do not send passwords, verification codes or M-Pesa credentials.' },
];

type TurnstileWindow = Window & {
  onTurnstileVerified?: (token: string) => void;
  onTurnstileExpired?: () => void;
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    const w = window as TurnstileWindow;
    w.onTurnstileVerified = (token) => setTurnstileToken(token);
    w.onTurnstileExpired = () => setTurnstileToken('');
    return () => {
      delete w.onTurnstileVerified;
      delete w.onTurnstileExpired;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Please complete the verification challenge below.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitContactForm({ ...form, turnstileToken });
      setSubmitted(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong sending your message. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <SiteNav active="/contact" />

      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#103D38' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-teal-100">Contact</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">Talk to the DuQana team</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Ask about setting up your shop, a payment or your account. For a problem in the app, tell us which screen you were using.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMethods.map((c) => (
              <div key={c.title} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFBF1' }}>
                  <c.icon className="w-5 h-5" style={{ color: '#0F766E' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>{c.title}</p>
                  <Link href={c.href} className="mt-0.5 inline-block py-1 text-sm font-medium underline underline-offset-4" style={{ color: '#0F766E' }}>{c.detail}</Link>
                  <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Send a message</h2>
              <p className="text-gray-600 mb-8">Leave your email so we can reply. Include your shop name if you already have an account.</p>

              {submitted ? (
                <div role="status" className="rounded-xl border p-8" style={{ borderColor: '#0F766E', backgroundColor: '#F0FDFA' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#CCFBF1' }}>
                    <CheckCircle className="w-8 h-8" style={{ color: '#0F766E' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Message sent</h3>
                  <p className="text-gray-600">Your message has been received. We’ll reply to <strong>{form.email}</strong>.</p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                      setTurnstileToken('');
                      (window as TurnstileWindow & { turnstile?: { reset: () => void } }).turnstile?.reset();
                    }}
                    className="mt-6 text-sm font-medium underline"
                    style={{ color: '#0F766E' }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Full Name *</label>
                      <input id="contact-name" autoComplete="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                        style={{ backgroundColor: '#fff' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email Address *</label>
                      <input id="contact-email" autoComplete="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Phone Number</label>
                    <input id="contact-phone" autoComplete="tel"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Subject *</label>
                    <select id="contact-subject"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all bg-white"
                    >
                      <option value="">Select a subject...</option>
                      <option>General Enquiry</option>
                      <option>Technical Support</option>
                      <option>Billing & Subscription</option>
                      <option>M-Pesa Integration Help</option>
                      <option>Feature Request</option>
                      <option>Partnership / Reseller</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Message *</label>
                    <textarea id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="What were you trying to do, and what happened?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all resize-none"
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">Please leave out passwords, verification codes and payment credentials.</p>
                  <div
                    className="cf-turnstile"
                    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    data-callback="onTurnstileVerified"
                    data-expired-callback="onTurnstileExpired"
                  />
                  {error && (
                    <div role="alert" className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-70"
                    style={{ backgroundColor: '#0F766E' }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Before you send a message</h2>
              <p className="text-gray-600 mb-8">These answers may help with your question. For plan prices, check the pricing section on the home page.</p>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} {...faq} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FAQItem({ q, a, href, link }: { q: string; a: string; href?: string; link?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
        style={{ color: '#0F172A' }}
      >
        {q}
        <span className="ml-4 text-lg flex-shrink-0" style={{ color: '#0F766E' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
          {href && <Link href={href} className="mt-3 block font-semibold text-teal-700 underline underline-offset-4">{link}</Link>}
        </div>
      )}
    </div>
  );
}
