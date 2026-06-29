'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Store, Lock, CheckCircle, Upload, ImageIcon, Globe, DollarSign, FileText, Heart } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', currency: 'BIF' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', currency: 'SSP' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
];

const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼' },
  { code: 'ETB', name: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'BIF', name: 'Burundian Franc', flag: '🇧🇮' },
  { code: 'SSP', name: 'S. Sudanese Pound', flag: '🇸🇸' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
];

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface ShopConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  country: string;
  currency: string;
  receiptThankYouNote: string;
  logoUrl: string;
  motto: string;
}

export default function ProfilePage() {
  const { user, login } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [shopSuccess, setShopSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [shopError, setShopError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopConfig>({
    name: user?.shop?.name || '',
    address: '',
    phone: '',
    email: '',
    taxRate: 0,
    country: 'KE',
    currency: 'KES',
    receiptThankYouNote: '',
    logoUrl: '',
    motto: '',
  });

  useEffect(() => {
    api.get('/shop').then((res) => {
      const d = res.data.data;
      setShop({
        name: d.name ?? '',
        address: d.address ?? '',
        phone: d.phone ?? '',
        email: d.email ?? '',
        taxRate: d.taxRate ?? 0,
        country: d.country ?? 'KE',
        currency: d.currency ?? 'KES',
        receiptThankYouNote: d.receiptThankYouNote ?? '',
        logoUrl: d.logoUrl ?? '',
        motto: d.motto ?? '',
      });
    }).catch(() => {});
  }, []);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileData) => api.put('/auth/profile', data),
    onSuccess: (res) => {
      const token = localStorage.getItem('token') || '';
      login(res.data.data, token);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordData) => api.post('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  const handleShopSave = async () => {
    setSavingShop(true);
    setShopError('');
    try {
      await api.put('/shop', {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        taxRate: shop.taxRate,
        country: shop.country,
        currency: shop.currency,
        receiptThankYouNote: shop.receiptThankYouNote,
        logoUrl: shop.logoUrl,
        motto: shop.motto,
      });
      setShopSuccess(true);
      setTimeout(() => setShopSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setShopError(msg || 'Update failed');
    } finally {
      setSavingShop(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await api.post('/shop/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShop((prev) => ({ ...prev, logoUrl: res.data.data.logoUrl }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(msg || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    setShop((prev) => ({ ...prev, country: code, currency: country?.currency ?? prev.currency }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and shop details</p>
      </div>

      {/* Personal Info */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
            <User className="w-5 h-5" style={{ color: '#0F766E' }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0F172A' }}>Personal Information</h2>
        </div>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}
        {profileMutation.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {(profileMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Update failed'}
          </div>
        )}

        <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" {...profileForm.register('name')} error={profileForm.formState.errors.name?.message} />
          <Input label="Email Address" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} />
          <div className="flex justify-end">
            <Button type="submit" loading={profileMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Card>

      {/* Shop Info */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
            <Store className="w-5 h-5" style={{ color: '#0F766E' }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0F172A' }}>Shop Details</h2>
        </div>

        {shopSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Shop updated successfully!
          </div>
        )}
        {shopError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{shopError}</div>
        )}

        <div className="space-y-5">
          {/* Contact section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact Information</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input value={shop.name} onChange={(e) => setShop((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={shop.address} onChange={(e) => setShop((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. Tom Mboya St, Nairobi"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={shop.phone} onChange={(e) => setShop((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                  <input type="email" value={shop.email} onChange={(e) => setShop((p) => ({ ...p, email: e.target.value }))}
                    placeholder="shop@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Financial section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Financial Settings</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select value={shop.country} onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 bg-white">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={shop.currency} onChange={(e) => setShop((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 bg-white">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-3 h-3 inline mr-1" />Tax Rate (%)
                </label>
                <input type="number" min="0" max="100" step="0.1" value={shop.taxRate}
                  onChange={(e) => setShop((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
              </div>
            </div>
          </div>

          {/* Receipt branding section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Receipt Branding</p>
            </div>
            <div className="space-y-3">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0"
                    style={{ borderColor: shop.logoUrl ? '#0F766E' : undefined }}
                  >
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="Shop logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors disabled:opacity-60"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Uploading…' : shop.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1.5">PNG, JPG up to 5MB · Square recommended</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Motto / Tagline</label>
                <input value={shop.motto} onChange={(e) => setShop((p) => ({ ...p, motto: e.target.value }))}
                  placeholder="Quality you can trust"
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Heart className="w-3 h-3 inline mr-1" />Thank-You Note (shown on receipt)
                </label>
                <textarea value={shop.receiptThankYouNote} onChange={(e) => setShop((p) => ({ ...p, receiptThankYouNote: e.target.value }))}
                  placeholder="Thank you, dear customer!"
                  maxLength={150}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={handleShopSave} loading={savingShop}>Save Shop Settings</Button>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
            <Lock className="w-5 h-5" style={{ color: '#0F766E' }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0F172A' }}>Change Password</h2>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Password changed successfully!
          </div>
        )}
        {passwordMutation.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {(passwordMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Password change failed'}
          </div>
        )}

        <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
          <Input label="Current Password" type="password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} />
          <Input label="New Password" type="password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
          <Input label="Confirm New Password" type="password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} />
          <div className="flex justify-end">
            <Button type="submit" loading={passwordMutation.isPending}>Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
