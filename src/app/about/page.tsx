import Link from 'next/link';
import { ShoppingCart, Target, Heart, Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';

const team = [
  {
    name: 'David Kamau',
    role: 'Co-Founder & CEO',
    bio: 'Former retail entrepreneur who experienced first-hand the chaos of manual bookkeeping. Built Smart Duka to solve the problems he lived.',
    initial: 'D',
  },
  {
    name: 'Aisha Muthoni',
    role: 'Co-Founder & CTO',
    bio: 'Software engineer passionate about building technology that works for everyday Kenyans, even on low-end devices with spotty internet.',
    initial: 'A',
  },
  {
    name: 'Brian Omondi',
    role: 'Head of Customer Success',
    bio: 'Ensures every shop owner gets onboarded smoothly. Has personally trained over 1,000 business owners across Nairobi, Kisumu, and Mombasa.',
    initial: 'B',
  },
  {
    name: 'Grace Njeri',
    role: 'Lead Designer',
    bio: 'Designed the Smart Duka interface with the kiosk owner in mind — clean, fast, and usable even for first-time smartphone users.',
    initial: 'G',
  },
];

const values = [
  {
    icon: Target,
    title: 'Built for Kenya',
    description: 'Everything we build is designed specifically for Kenyan retail realities — M-Pesa, KES currency, local inventory types, and offline-first for areas with patchy internet.',
  },
  {
    icon: Heart,
    title: 'Simplicity First',
    description: 'We believe great software should feel invisible. Smart Duka is designed so any shop owner can start selling within minutes, no training needed.',
  },
  {
    icon: Shield,
    title: 'Honesty & Trust',
    description: 'We help owners see exactly what is happening in their shop. Transparent data means no surprises — for you or for us.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Together',
    description: 'When your business grows, we grow. Our pricing scales with you, and we constantly add features based on real feedback from real shop owners.',
  },
];

const milestones = [
  { year: '2022', event: 'Smart Duka founded in Nairobi after a frustrating experience running a hardware shop.' },
  { year: '2023', event: 'Launched beta with 50 shops in Nairobi. Added M-Pesa STK Push integration.' },
  { year: '2024', event: 'Expanded to Mombasa, Kisumu, and Nakuru. Crossed 1,000 active shops.' },
  { year: '2025', event: 'Launched web platform, staff management, and advanced analytics. 5,000+ active shops.' },
];

export default function AboutPage() {
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
              <Link href="/about" className="text-sm font-semibold transition-colors" style={{ color: '#0F766E' }}>About</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Contact Us</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors" style={{ color: '#0F766E', borderColor: '#0F766E' }}>Sign In</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#0F766E' }}>Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-28" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-white/20 text-white">
            <Heart className="w-4 h-4" />
            Our Story
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            We Built the Tool We Wished We Had
          </h1>
          <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
            Smart Duka was born out of real frustration — managing a shop with paper receipts, guessing stock levels,
            and counting cash at midnight. We built the solution we desperately needed.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-6" style={{ color: '#0F172A' }}>
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Kenya has over 3 million small retail businesses — dukas, superettes, pharmacies, electronics shops — that are the backbone of the economy.
                Most of them are still running on paper, guesswork, and trust.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Smart Duka exists to give every Kenyan shop owner the same powerful tools that large supermarkets use — at a price anyone can afford,
                on a device they already own, with payments they already use.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe a mother running a small shop in Kayole deserves the same business intelligence as a Nairobi Westlands supermarket.
                That is the future we are building.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '5,000+', label: 'Active Shops' },
                { value: 'KES 2B+', label: 'Processed' },
                { value: '47', label: 'Counties Reached' },
                { value: '4.9★', label: 'User Rating' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-6 text-center border border-gray-100 shadow-sm" style={{ backgroundColor: '#F0FDFA' }}>
                  <p className="text-3xl font-extrabold mb-1" style={{ color: '#0F766E' }}>{s.value}</p>
                  <p className="text-sm text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>What We Stand For</h2>
            <p className="text-lg text-gray-600">The values that guide every decision we make.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#CCFBF1' }}>
                  <v.icon className="w-6 h-6" style={{ color: '#0F766E' }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#0F172A' }}>{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Our Journey</h2>
            <p className="text-lg text-gray-600">From a frustrating shop to a platform serving thousands.</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#CCFBF1' }} />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-6 relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative z-10 shadow-md" style={{ backgroundColor: '#0F766E' }}>
                    {m.year.slice(2)}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 flex-1 border border-gray-100">
                    <p className="text-sm font-bold mb-1" style={{ color: '#0F766E' }}>{m.year}</p>
                    <p className="text-gray-700 leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: '#0F172A' }}>The Team Behind Smart Duka</h2>
            <p className="text-lg text-gray-600">A small team with a big mission — all Kenya-based.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md" style={{ backgroundColor: '#0F766E' }}>
                  {member.initial}
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: '#0F172A' }}>{member.name}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: '#0F766E' }}>{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Join the Smart Duka Family</h2>
          <p className="text-white/80 text-lg mb-8">Start managing your shop smarter today. Free to get started.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: '#C8932A' }}>
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white border-2 border-white/30 bg-white/10">
              Talk to Us
            </Link>
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
