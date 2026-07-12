'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface Permission {
  value: string;
  label: string;
  category: string;
}

interface StaffDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  permissions: string[];
}

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', email: '', phone: '', isActive: true });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState('');

  const { data: staff, isLoading } = useQuery<StaffDetail>({
    queryKey: ['staff', id],
    queryFn: async () => {
      const res = await api.get(`/staff/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: permissionsData } = useQuery<{ data: Permission[] }>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/staff/permissions');
      return res.data;
    },
  });

  useEffect(() => {
    if (staff && !seeded) {
      setForm({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        isActive: staff.isActive,
      });
      setSelectedPermissions(staff.permissions || []);
      setSeeded(true);
    }
  }, [staff, seeded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/staff/${id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        isActive: form.isActive,
      });
      await api.put(`/staff/${id}/permissions`, { permissions: selectedPermissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', id] });
      router.push(`/owner/staff/${id}`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to update staff member');
    },
  });

  const handleSave = () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.email.trim()) return setError('Email is required');
    saveMutation.mutate();
  };

  // Refunding other staff members' sales requires seeing those sales, so the
  // two permissions move together (the backend enforces the same rule).
  const togglePermission = (value: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(value)) {
        const next = prev.filter((p) => p !== value);
        if (value === 'view_all_sales') return next.filter((p) => p !== 'refund_all_sales');
        return next;
      }
      const next = [...prev, value];
      if (value === 'refund_all_sales' && !next.includes('view_all_sales')) next.push('view_all_sales');
      return next;
    });
  };

  if (isLoading || !seeded) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  const allPermissions: Permission[] = permissionsData?.data || [];
  const grouped = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/owner/staff/${id}`}>
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Edit Staff</h1>
          <p className="text-gray-500 text-sm">Update details and permissions for {staff?.name}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {/* Basic Info */}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Basic Information</h2>
        <div className="space-y-4">
          <Input
            label="Full Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </Card>

      {/* Status */}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Account Status</h2>
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Active</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.isActive ? 'Staff member can log in' : 'Staff member is blocked from logging in'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.isActive ? 'bg-[#0F766E]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Permissions */}
      {allPermissions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" style={{ color: '#0F766E' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Permissions</h2>
            </div>
            <span className="text-xs text-gray-400">
              {selectedPermissions.length} of {allPermissions.length} selected
            </span>
          </div>
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, perms]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#0F766E' }}>
                  {category}
                </p>
                <div className="space-y-1">
                  {perms.map((perm) => {
                    const checked = selectedPermissions.includes(perm.value);
                    return (
                      <button
                        key={perm.value}
                        type="button"
                        onClick={() => togglePermission(perm.value)}
                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? 'border-[#0F766E] bg-[#0F766E]' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm" style={{ color: '#0F172A' }}>
                          {perm.label}
                          {perm.value === 'refund_all_sales' && (
                            <span className="block text-xs text-gray-400">Also enables “View All Sales”</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Link href={`/owner/staff/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} loading={saveMutation.isPending}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
