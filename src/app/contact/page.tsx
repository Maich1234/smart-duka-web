'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: 'support@smartduka.co.ke',
    sub: 'We reply within 24 hours',
  },
  {
    icon: Phone,
    title: 'Call or WhatsApp',
    detail: '+254 700 123 456',
    sub: 'Mon–Sat, 8am – 6pm EAT',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    detail: 'Westlands Business Park, Nairobi',
    sub: 'By appointment only',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    detail: 'Mon – Sat: 8am – 6pm',
    sub: 'Sunday: 10am – 2pm EAT',
  },
];

const faqs = [
  {
    q: 'Is Smart Duka free to use?',
    a: 'Yes! The Free plan lets you get started with up to 50 products and 1 staff account at no cost. Upgrade to Pro when you need more.',
  },
  {
    q: 'Does Smart Duka work offline?',
    a: 'Yes. The mobile app queues sales offline and syncs automatically when you reconnect. The web app requires an internet connection.',
  },
  {
    q: 'How does M-Pesa integration work?',
    a: 'You add your M-Pesa Business (Paybill or Till) credentials in settings. During checkout, customers receive an STK Push prompt on their phone and pay directly.',
  },
  {
    q: 'Can multiple staff use Smart Duka at the same time?',
    a: 'Absolutely. Each staff member gets their own login with customisable permissions. The owner sees all activity in real time.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. M-Pesa credentials are encrypted with AES-256. Your data is backed up daily.',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: '#0F172A' }}>Smart Duka</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Home</Link>
              <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Features</Link>
              <Link href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Pricing</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-semibold transition-colors" style={{ color: '#0F766E' }}>Contact Us</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors" style={{ color: '#0F766E', borderColor: '#0F766E' }}>Sign In</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#0F766E' }}>Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-white/20 text-white">
            <MessageSquare className="w-4 h-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">We are Here to Help</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Have a question, need help setting up, or want to give feedback? Our team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((c) => (
              <div key={c.title} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFBF1' }}>
                  <c.icon className="w-5 h-5" style={{ color: '#0F766E' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>{c.title}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#0F766E' }}>{c.detail}</p>
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
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Send Us a Message</h2>
              <p className="text-gray-600 mb-8">Fill in the form below and we will get back to you within 24 hours.</p>

              {submitted ? (
                <div className="rounded-2xl border-2 p-10 text-center" style={{ borderColor: '#0F766E', backgroundColor: '#F0FDFA' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#CCFBF1' }}>
                    <CheckCircle className="w-8 h-8" style={{ color: '#0F766E' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Message Sent!</h3>
                  <p className="text-gray-600">Thank you for reaching out. We will reply to <strong>{form.email}</strong> within 24 hours.</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }} className="mt-6 text-sm font-medium underline" style={{ color: '#0F766E' }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Wanjiku"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                        style={{ backgroundColor: '#fff' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email Address *</label>
                      <input
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Subject *</label>
                    <select
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help you..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
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
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Frequently Asked Questions</h2>
              <p className="text-gray-600 mb-8">Quick answers to the most common questions.</p>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-300 font-semibold">Smart Duka</span>
          </div>
          <p>© 2025 Smart Duka. Built with ❤️ for Kenyan businesses.</p>
          <div className="flex gap-4 mt-3 md:mt-0">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
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
        </div>
      )}
    </div>
  );
}
