'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Store, Lock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
});

const shopSchema = z.object({
  shopName: z.string().min(2, 'Shop name is required'),
  shopAddress: z.string().optional(),
  shopPhone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type ProfileData = z.infer<typeof profileSchema>;
type ShopData = z.infer<typeof shopSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, login } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [shopSuccess, setShopSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const shopForm = useForm<ShopData>({
    resolver: zodResolver(shopSchema),
    defaultValues: { shopName: user?.shop?.name || '' },
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

  const shopMutation = useMutation({
    mutationFn: (data: ShopData) => api.put('/shop', { name: data.shopName, address: data.shopAddress, phone: data.shopPhone }),
    onSuccess: () => {
      setShopSuccess(true);
      setTimeout(() => setShopSuccess(false), 3000);
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

        <form onSubmit={shopForm.handleSubmit((d) => shopMutation.mutate(d))} className="space-y-4">
          <Input label="Shop Name" {...shopForm.register('shopName')} error={shopForm.formState.errors.shopName?.message} />
          <Input label="Shop Address" placeholder="e.g. Tom Mboya St, Nairobi" {...shopForm.register('shopAddress')} />
          <Input label="Shop Phone" placeholder="07XXXXXXXX" {...shopForm.register('shopPhone')} />
          <div className="flex justify-end">
            <Button type="submit" loading={shopMutation.isPending}>Update Shop</Button>
          </div>
        </form>
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
