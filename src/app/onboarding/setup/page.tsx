'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import JourneyProgress from '@/components/onboarding/JourneyProgress';
import { usePresets, useCounties, useSubcounties } from '@/hooks/usePresets';
import { useInvalidateShop, useShop } from '@/hooks/useShop';
import { updateShopConfig } from '@/services/shop';
import { useAuthStore } from '@/store/authStore';

/**
 * Where the shop is and what it prices in.
 *
 * County and sub-county come from the Location collection rather than a free
 * text box — the mobile app had a plain text field here and it produced
 * unusable location data.
 */
export default function OnboardingSetupPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { shop } = useShop();
  const invalidateShop = useInvalidateShop();
  const { countries, currencies } = usePresets();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('KE');
  const [currency, setCurrency] = useState('KES');
  const [countyId, setCountyId] = useState('');
  const [subCountyId, setSubCountyId] = useState('');
  const [phone, setPhone] = useState('');
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState('');

  const { data: counties = [] } = useCounties(country);
  const { data: subcounties = [] } = useSubcounties(countyId || undefined);

  useEffect(() => {
    if (shop && !seeded) {
      setName(shop.name ?? user?.shop?.name ?? '');
      setCountry(shop.country || 'KE');
      setCurrency(shop.currency || 'KES');
      setPhone(shop.phone ?? '');
      setSeeded(true);
    }
  }, [shop, seeded, user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateShopConfig({
        name: name.trim(),
        country,
        currency,
        phone: phone.trim() || undefined,
        // Names, not ids — that's what the shop record stores.
        county: counties.find((c) => c._id === countyId)?.name,
        subCounty: subcounties.find((s) => s._id === subCountyId)?.name,
      }),
    onSuccess: () => {
      invalidateShop();
      router.push('/onboarding/personalize');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not save your shop details.');
    },
  });

  const handleCountry = (code: string) => {
    setCountry(code);
    setCountyId('');
    setSubCountyId('');
    const match = countries.find((c) => c.code === code);
    if (match) setCurrency(match.currency);
  };

  return (
    <>
      <JourneyProgress step={0} />
      <Card>
        <h1 className="text-xl font-extrabold mb-1" style={{ color: '#0F172A' }}>Tell us about your shop</h1>
        <p className="text-sm text-gray-500 mb-6">
          This sets your currency and appears on every receipt you print.
        </p>

        <div className="space-y-4">
          <Input
            label="Shop name *"
            placeholder="e.g. Mama Njeri Stores"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Country</label>
              <select
                value={country}
                onChange={(e) => handleCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              >
                {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              >
                {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {counties.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>County</label>
                <select
                  value={countyId}
                  onChange={(e) => { setCountyId(e.target.value); setSubCountyId(''); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                >
                  <option value="">Select…</option>
                  {counties.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Sub-county</label>
                <select
                  value={subCountyId}
                  disabled={!countyId}
                  onChange={(e) => setSubCountyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 disabled:bg-gray-50"
                >
                  <option value="">{countyId ? 'Select…' : 'Pick a county first'}</option>
                  {subcounties.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <Input
            label="Shop phone"
            inputMode="tel"
            hint="Printed on receipts so customers can reach you"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <Button
            className="w-full"
            disabled={!name.trim()}
            loading={mutation.isPending}
            onClick={() => { setError(''); mutation.mutate(); }}
          >
            Continue
          </Button>
        </div>
      </Card>
    </>
  );
}
