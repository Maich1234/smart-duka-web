import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Shield, Smartphone } from 'lucide-react';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundColor: '#103D38' }}>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Image src="/icons/logo-mark.png" alt="" width={28} height={28} />
            </div>
            <span className="text-2xl font-extrabold text-white">DuQana</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your shop’s sales
            <br />and stock records
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Keep sales, stock, M-Pesa payments and your team together with DuQana.
          </p>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Review sales history and reports' },
              { icon: Smartphone, text: 'Record M-Pesa and other payment methods' },
              { icon: Shield, text: 'Choose what each staff account can access' },
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
          <p className="text-sm text-white/80">Need help with your account?</p>
          <div className="mt-3 flex gap-5 text-sm"><Link href="/help" className="underline underline-offset-4 text-white">Help centre</Link><Link href="/contact" className="underline underline-offset-4 text-white">Contact us</Link></div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <Image src="/icons/logo-mark.png" alt="" width={24} height={24} />
            </div>
            <span className="text-xl font-bold" style={{ color: '#0F172A' }}>DuQana</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
