'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  BarChart3,
  Users,
  Shield,
  Smartphone,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  TrendingUp,
  Package,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Smart POS Checkout',
    description: 'Fast, intuitive point-of-sale interface. Process sales in seconds with barcode scanning and cart management.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels in real time, get low-stock alerts, and manage products with categories and pricing.',
  },
  {
    icon: BarChart3,
    title: 'Sales Analytics',
    description: 'Detailed reports on daily, weekly, and monthly sales. Understand your best-selling products and peak hours.',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Add staff with limited access. Monitor their sales performance and manage permissions securely.',
  },
  {
    icon: CreditCard,
    title: 'M-Pesa Integration',
    description: 'Accept M-Pesa STK Push payments directly. Automatic transaction reconciliation and receipt generation.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Bank-grade security with role-based access control. Your data is encrypted and always backed up.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up for free in minutes. Set up your shop name, add your products, and you are ready to go.',
  },
  {
    step: '02',
    title: 'Add Products & Staff',
    description: 'Import your inventory, set prices and stock levels. Invite staff with tailored permissions.',
  },
  {
    step: '03',
    title: 'Start Selling',
    description: 'Process sales, accept M-Pesa payments, and watch your business analytics grow in real time.',
  },
];

const testimonials = [
  {
    name: 'Jane Wanjiku',
    role: 'Grocery Store Owner, Nairobi',
    text: 'Smart Duka transformed how I manage my shop. I can check sales from my phone even when I am not at the store. My staff cannot steal anymore!',
    rating: 5,
  },
  {
    name: 'Peter Otieno',
    role: 'Electronics Shop, Kisumu',
    text: 'The M-Pesa integration is seamless. Customers pay, it reflects instantly. The inventory alerts save me from running out of stock.',
    rating: 5,
  },
  {
    name: 'Fatuma Hassan',
    role: 'Pharmacy Owner, Mombasa',
    text: 'Reports are clear and easy to understand. I know exactly how much profit I make each day. Worth every shilling!',
    rating: 5,
  },
];

const stats = [
  { value: '5,000+', label: 'Active Shops' },
  { value: 'KES 2B+', label: 'Transactions Processed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Average Rating' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: '#0F172A' }}>Smart Duka</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Home</Link>
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Pricing</a>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Contact Us</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors" style={{ color: '#0F766E', borderColor: '#0F766E' }}>
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ backgroundColor: '#0F766E' }}>
                Get Started Free
              </Link>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-600">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <Link href="/" className="block text-sm font-medium text-gray-600">Home</Link>
            <a href="#features" className="block text-sm font-medium text-gray-600">Features</a>
            <a href="#pricing" className="block text-sm font-medium text-gray-600">Pricing</a>
            <Link href="/about" className="block text-sm font-medium text-gray-600">About</Link>
            <Link href="/contact" className="block text-sm font-medium text-gray-600">Contact Us</Link>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-lg border" style={{ color: '#0F766E', borderColor: '#0F766E' }}>Sign In</Link>
              <Link href="/register" className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#0F766E' }}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0F766E 0%, transparent 60%), radial-gradient(circle at 80% 20%, #C8932A 0%, transparent 60%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: '#CCFBF1', color: '#0F766E' }}>
                <Zap className="w-4 h-4" />
                #1 POS System in Kenya
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ color: '#0F172A' }}>
                Run Your Shop
                <span className="block" style={{ color: '#0F766E' }}>Smarter, Faster</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Smart Duka is the all-in-one POS solution built for Kenyan dukas and retail shops.
                Track inventory, manage staff, accept M-Pesa, and grow your business — all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl text-white shadow-lg transition-all hover:shadow-xl" style={{ backgroundColor: '#0F766E' }}>
                  Start Free Today
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl border-2 transition-all" style={{ color: '#0F766E', borderColor: '#0F766E' }}>
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {['J', 'P', 'F', 'M'].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ['#0F766E','#C8932A','#115E59','#14B8A6'][i] }}>{l}</div>
                  ))}
                </div>
                <p className="text-sm text-gray-600"><strong className="text-gray-900">5,000+ shops</strong> trust Smart Duka</p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
                <div className="p-4 border-b flex items-center gap-2" style={{ backgroundColor: '#0F766E' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-white text-sm font-medium ml-2">Smart Duka Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today's Sales", value: 'KES 24,500', icon: TrendingUp, color: '#0F766E' },
                      { label: 'Products', value: '142', icon: Package, color: '#C8932A' },
                      { label: 'Transactions', value: '38', icon: CreditCard, color: '#14B8A6' },
                      { label: 'Staff Online', value: '3', icon: Users, color: '#115E59' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-4 border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon className="w-4 h-4" style={{ color: s.color }} />
                          <span className="text-xs text-gray-500">{s.label}</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: '#0F172A' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-3">Recent Sales</p>
                    {[
                      { item: 'Unga 2kg', amount: 'KES 180', time: '2m ago' },
                      { item: 'Cooking Oil 1L', amount: 'KES 320', time: '5m ago' },
                      { item: 'Sugar 1kg', amount: 'KES 160', time: '12m ago' },
                    ].map((t, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-100">
                        <span className="text-sm text-gray-700">{t.item}</span>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: '#0F766E' }}>{t.amount}</p>
                          <p className="text-xs text-gray-400">{t.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#C8932A' }}>
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold" style={{ color: '#0F766E' }}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Everything You Need to Run Your Shop</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">From checkout to analytics, Smart Duka covers every aspect of your retail business.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CCFBF1' }}>
                  <f.icon className="w-6 h-6" style={{ color: '#0F766E' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Get Started in 3 Simple Steps</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">No technical experience needed. Be up and running in under 10 minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 -translate-x-1/2" style={{ backgroundColor: '#CCFBF1', zIndex: 0 }} />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white shadow-lg" style={{ backgroundColor: '#0F766E' }}>
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#0F172A' }}>{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Loved by Kenyan Business Owners</h2>
            <p className="text-lg text-gray-600">Real stories from real shop owners across Kenya.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#C8932A' }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#0F766E' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Free</h3>
              <p className="text-gray-500 mb-6">Perfect for getting started</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ color: '#0F172A' }}>KES 0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 50 products', '1 staff account', 'Basic sales reports', 'M-Pesa payments', 'Email support'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#0F766E' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-3 rounded-xl font-semibold border-2 transition-all" style={{ color: '#0F766E', borderColor: '#0F766E' }}>
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl" style={{ backgroundColor: '#0F766E' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#C8932A' }}>POPULAR</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="opacity-80 mb-6">For growing businesses</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">KES 999</span>
                <span className="opacity-80">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited products', 'Up to 10 staff', 'Advanced analytics & reports', 'M-Pesa + cash reconciliation', 'Low stock alerts', 'Receipt sharing', 'Priority support', 'Data export'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm opacity-90">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-3 rounded-xl font-semibold transition-all" style={{ backgroundColor: '#C8932A' }}>
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Ready to Grow Your Business?</h2>
          <p className="text-lg mb-8 opacity-90 text-white">Join thousands of Kenyan shop owners who trust Smart Duka every day.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl" style={{ backgroundColor: '#C8932A', color: 'white' }}>
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-white/20 text-white border-2 border-white/30 hover:bg-white/30">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Smart Duka</span>
              </div>
              <p className="text-gray-400 text-sm">The smartest POS for Kenyan retail businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>© 2025 Smart Duka. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Built with ❤️ for Kenyan businesses</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
