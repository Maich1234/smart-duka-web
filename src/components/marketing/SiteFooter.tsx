import Link from 'next/link';

export function SiteFooter() {
  return <footer className="border-t border-[#476258] bg-[#152d27] px-[6%] py-10 text-[#edf4ed]">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <div><Link href="/" className="text-xl font-bold">DuQana</Link><p className="mt-2 text-sm text-[#bdcec2]">Sales, stock and receipts for your shop.</p></div>
      <nav aria-label="Footer" className="flex max-w-xl flex-wrap gap-x-6 gap-y-1 text-sm [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center [&>a]:underline-offset-4 [&>a:hover]:underline">
        <Link href="/about">About</Link><Link href="/help">Help centre</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/delete-account">Delete account</Link>
      </nav>
    </div>
    <p className="mx-auto mt-8 max-w-6xl text-xs text-[#bdcec2]">© {new Date().getFullYear()} DuQana</p>
  </footer>;
}
