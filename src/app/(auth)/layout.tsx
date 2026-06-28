import Link from 'next/link';
import { ShoppingCart, TrendingUp, Shield, Smartphone } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #14B8A6, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C8932A, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white">Smart Duka</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            The Smartest Way
            <br />to Run Your Shop
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Join 5,000+ Kenyan businesses using Smart Duka to sell faster, manage inventory, and grow their revenue.
          </p>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Real-time sales analytics and reports' },
              { icon: Smartphone, text: 'Accept M-Pesa payments instantly' },
              { icon: Shield, text: 'Secure role-based access for your staff' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex -space-x-3">
            {['J', 'P', 'F', 'M', 'A'].map((l, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-white/50 flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: ['#0F766E','#C8932A','#115E59','#14B8A6','#0F766E'][i] }}
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-white/70 text-sm mt-2">5,000+ shop owners trust Smart Duka</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#0F172A' }}>Smart Duka</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
