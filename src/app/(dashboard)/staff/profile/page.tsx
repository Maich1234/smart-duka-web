'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function StaffProfilePage() {
  const { user, login } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
    mutationFn: (data: PasswordData) =>
      api.post('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your account information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg" style={{ backgroundColor: '#0F766E' }}>
          {user?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: '#0F172A' }}>{user?.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role} · {user?.shop?.name}</p>
        </div>
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
            <CheckCircle className="w-4 h-4" /> Profile updated!
          </div>
        )}
        {profileMutation.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">Update failed</div>
        )}

        <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" {...profileForm.register('name')} error={profileForm.formState.errors.name?.message} />
          <Input label="Email" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} />
          <div className="flex justify-end">
            <Button type="submit" loading={profileMutation.isPending}>Save Changes</Button>
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
            <CheckCircle className="w-4 h-4" /> Password changed!
          </div>
        )}
        {passwordMutation.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {(passwordMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to change password'}
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
