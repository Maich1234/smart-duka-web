import Link from 'next/link';
import { ShoppingCart, Book, CreditCard, Package, Users, BarChart3, HelpCircle, ExternalLink } from 'lucide-react';

const topics = [
  {
    icon: ShoppingCart,
    title: 'Getting Started',
    description: 'Set up your shop, add your first products, and process your first sale.',
    articles: ['Creating your account', 'Setting up your shop profile', 'Adding your first product', 'Making your first sale'],
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Learn how to manage products, track stock, and handle different product types.',
    articles: ['Adding & editing products', 'Product types explained', 'Setting low stock alerts', 'Stock adjustments'],
  },
  {
    icon: CreditCard,
    title: 'M-Pesa Payments',
    description: 'Configure M-Pesa integration and start accepting mobile payments.',
    articles: ['Setting up M-Pesa credentials', 'Processing an M-Pesa payment', 'Viewing M-Pesa transactions', 'Troubleshooting payment issues'],
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Create staff accounts, assign permissions, and monitor performance.',
    articles: ['Adding a staff member', 'Setting staff permissions', 'Viewing staff performance', 'Resetting a staff password'],
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Understand your business performance with detailed sales reports.',
    articles: ['Reading your dashboard', 'Sales reports by period', 'Top products report', 'Exporting your data'],
  },
  {
    icon: HelpCircle,
    title: 'Troubleshooting',
    description: 'Common issues and how to resolve them quickly.',
    articles: ['App not loading', 'Payment failed errors', 'Receipt not printing', 'Forgot password'],
  },
];

export default function HelpPage() {
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
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors">Contact Us</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ color: '#0F766E', borderColor: '#0F766E' }}>Sign In</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{ backgroundColor: '#0F766E' }}>Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 bg-white/20 text-white">
            <Book className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">How Can We Help?</h1>
          <p className="text-white/80 text-lg mb-8">Find guides, tutorials, and answers to get the most from Smart Duka.</p>
          <div className="max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full px-5 py-3.5 rounded-xl text-sm outline-none shadow-lg"
              style={{ backgroundColor: 'white', color: '#0F172A' }}
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: '#0F172A' }}>Browse Help Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CCFBF1' }}>
                  <t.icon className="w-5 h-5" style={{ color: '#0F766E' }} />
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>{t.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t.description}</p>
                <ul className="space-y-2">
                  {t.articles.map((a) => (
                    <li key={a}>
                      <a href="#" className="text-sm flex items-center gap-2 transition-colors hover:underline" style={{ color: '#0F766E' }}>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {a}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0F172A' }}>Still Need Help?</h2>
          <p className="text-gray-600 mb-6">Our support team is ready to assist you Mon–Sat, 8am–6pm EAT.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-6 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#0F766E' }}>
              Contact Support
            </Link>
            <a href="https://wa.me/254700123456" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl font-semibold border-2" style={{ color: '#0F766E', borderColor: '#0F766E' }}>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-300 font-semibold">Smart Duka</span>
          </div>
          <p>© 2025 Smart Duka. Built with ❤️ for Kenyan businesses.</p>
          <div className="flex gap-4 mt-3 md:mt-0">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
