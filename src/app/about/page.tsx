import Link from 'next/link';
import { ArrowRight, BarChart3, Package, Receipt, ShieldCheck } from 'lucide-react';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteNav } from '@/components/marketing/SiteNav';
import { publicMetadata } from '@/lib/seo';

export const metadata = publicMetadata('About DuQana | POS Built for Kenyan Shops', 'DuQana helps Kenyan shop owners manage sales, stock, M-Pesa payments and staff in one place. Learn how it supports the work behind your counter.', '/about');

const everyday = [
  { icon: Receipt, title: 'Record each sale', text: 'Find products, record how the customer paid and share a receipt. Prepare quotations when a customer needs a price before buying.', href: '/help/recording-sales', link: 'Explore sales guides' },
  { icon: Package, title: 'Keep track of stock', text: 'Manage products, quantities, purchases and suppliers. Check stock levels before deciding what to restock.', href: '/help/managing-stock', link: 'Learn about inventory' },
  { icon: ShieldCheck, title: 'Give your team the right access', text: 'Set staff permissions so each person can do their work while the owner keeps control of business settings.', href: '/help/staff-permissions', link: 'Read staff guides' },
  { icon: BarChart3, title: 'Understand your business', text: 'Review sales history, customer balances and business reports. Keep the records you need for daily decisions.', href: '/help/sales-reports', link: 'Browse reporting guides' },
];

export default function AboutPage() {
  return <div className="min-h-screen bg-[#F8FAFC]">
    <SiteNav active="/about" />
    <main>
      <section className="bg-[#103D38] px-5 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-teal-100">About DuQana</p>
          <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight lg:text-6xl">Less paperwork.<br />A clearer picture of your shop.</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-teal-50">Running a shop means keeping up with customers, stock, payments and your team. DuQana brings those records together so you can see what needs your attention.</p>
          <p className="mt-8 text-sm text-teal-100">Built for Kenyan kiosks, retail shops and growing businesses.</p>
          <p className="mt-4 text-sm text-teal-100"><strong className="text-white">500+</strong> shops.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-20">
        <div><p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-700">The work behind the counter</p><h2 className="text-3xl font-bold leading-tight text-slate-900">A busy shop needs records you can find.</h2></div>
        <div className="space-y-5 text-lg leading-relaxed text-slate-600"><p>A sale should connect to the stock it uses and the payment you received. A customer balance should be easy to check. Staff should have access to the tasks they are responsible for.</p><p>These are the everyday jobs DuQana is built to support, with M-Pesa, Kenyan shilling pricing and receipts your customers can verify.</p><Link href="/#features" className="inline-flex items-center gap-2 font-semibold text-teal-700">See how DuQana works <ArrowRight size={18} /></Link></div>
      </section>
      <section className="bg-white px-5 py-16"><div className="mx-auto max-w-6xl"><h2 className="mb-10 text-3xl font-bold text-slate-900">Keep the essentials together.</h2><div className="grid gap-6 md:grid-cols-2">{everyday.map(({ icon: Icon, ...item }) => <article key={item.title} className="rounded-2xl border border-slate-200 p-7"><Icon className="mb-5 text-teal-700" size={28} aria-hidden="true" /><h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3><p className="mb-5 leading-relaxed text-slate-600">{item.text}</p><Link href={item.href} className="font-semibold text-teal-700 underline underline-offset-4">{item.link}</Link></article>)}</div></div></section>
      <section className="mx-auto max-w-4xl px-5 py-20 text-center"><h2 className="mb-5 text-3xl font-bold text-slate-900">Start with what your shop needs today.</h2><p className="mb-8 text-lg text-slate-600">Explore the plans or talk to us about setting up your business.</p><div className="flex flex-wrap justify-center gap-4"><Link href="/#pricing" className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white">See plans and pricing</Link><Link href="/contact" className="rounded-xl border border-teal-700 px-6 py-3 font-semibold text-teal-700">Talk to the team</Link></div></section>
    </main>
    <SiteFooter />
  </div>;
}
