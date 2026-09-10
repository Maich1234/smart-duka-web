import { redirect } from 'next/navigation';

// The marketing homepage now lives in the smart-duka-marketing project; this
// app's root just needs to land on the same entry point as the PWA manifest's
// start_url, which the dashboard layout already bounces to /login (logged
// out) or /staff/dashboard (staff) as needed.
export default function RootPage() {
  redirect('/owner/dashboard');
}
