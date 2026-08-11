import { fetchBrands } from '@/api/brands';
import { fetchOutlets } from '@/api/outlets';
import {
  createUser,
  deleteUser,
  fetchUserOutlets,
  fetchUsers,
  updateUser,
} from '@/api/users';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { ROLES } from '@/lib/constants';
import { cn, getAxiosMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import type { User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Store, Trash2, UserPen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** Roles that log into the mobile app with a phone number + OTP. */
const APP_ROLES = ['merchandiser', 'promoter'] as const;
type AppRole = (typeof APP_ROLES)[number];

interface FormState {
  fullName: string;
  whatsappPhone: string;
  role: AppRole;
  brandId: string;
  outletIds: string[];
}

const EMPTY_FORM: FormState = {
  fullName: '',
  whatsappPhone: '',
  role: 'merchandiser',
  brandId: '',
  outletIds: [],
};

export function AppUsers() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const isBm = currentUser?.role === ROLES.BRAND_MANAGER;
  const lockedBrand = isBm ? currentUser?.brandId ?? '' : '';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [outletSearch, setOutletSearch] = useState('');

  const usersQ = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
    staleTime: 30_000,
  });

  const outletsQ = useQuery({
    queryKey: ['outlets'],
    queryFn: () => fetchOutlets(),
    staleTime: 60_000,
  });

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  // Load existing assignments when opening the edit modal.
  const assignmentsQ = useQuery({
    queryKey: ['users', editing?.id, 'outlets'],
    queryFn: () => fetchUserOutlets(editing!.id),
    enabled: Boolean(editing?.id) && modalOpen,
  });

  useEffect(() => {
    if (assignmentsQ.data) {
      setForm((f) => ({ ...f, outletIds: assignmentsQ.data }));
    }
  }, [assignmentsQ.data]);

  const appUsers = useMemo(
    () =>
      (usersQ.data ?? []).filter((u) =>
        (APP_ROLES as readonly string[]).includes(u.role),
      ),
    [usersQ.data],
  );

  const outlets = outletsQ.data ?? [];
  const brands = brandsQ.data ?? [];

  const visibleOutlets = useMemo(() => {
    const q = outletSearch.trim().toLowerCase();
    if (!q) return outlets;
    return outlets.filter((o) => o.name.toLowerCase().includes(q));
  }, [outlets, outletSearch]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, brandId: lockedBrand });
    setOutletSearch('');
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      fullName: u.fullName,
      whatsappPhone: u.whatsappPhone ?? '',
      role: (APP_ROLES as readonly string[]).includes(u.role)
        ? (u.role as AppRole)
        : 'merchandiser',
      brandId: u.brandId ?? '',
      outletIds: [],
    });
    setOutletSearch('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const createM = useMutation({
    mutationFn: () =>
      createUser({
        fullName: form.fullName.trim(),
        whatsappPhone: form.whatsappPhone.trim(),
        role: form.role,
        brandId: form.brandId || null,
        outletIds: form.outletIds,
      }),
    onSuccess: async () => {
      addToast('success', 'App user created');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Could not create user'),
  });

  const updateM = useMutation({
    mutationFn: () =>
      updateUser(editing!.id, {
        fullName: form.fullName.trim(),
        whatsappPhone: form.whatsappPhone.trim() || null,
        role: form.role,
        brandId: form.brandId || null,
        outletIds: form.outletIds,
      }),
    onSuccess: async () => {
      addToast('success', 'App user updated');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Could not update user'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => {
      addToast('success', 'App user deactivated');
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Could not deactivate user'),
  });

  function toggleOutlet(id: string) {
    setForm((f) => ({
      ...f,
      outletIds: f.outletIds.includes(id)
        ? f.outletIds.filter((x) => x !== id)
        : [...f.outletIds, id],
    }));
  }

  const phoneValid = form.whatsappPhone.replace(/\D/g, '').length >= 7;
  const canSave = form.fullName.trim().length > 0 && phoneValid;

  const columns: TableColumn<User>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (u) => u.fullName },
      {
        key: 'phone',
        header: 'Phone',
        render: (u) => (
          <span className="font-mono text-sm">{u.whatsappPhone ?? '—'}</span>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (u) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
              u.role === 'merchandiser'
                ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200'
                : 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
            )}
          >
            {u.role}
          </span>
        ),
      },
      {
        key: 'brand',
        header: 'Brand',
        render: (u) =>
          brands.find((b) => b.id === u.brandId)?.name ?? '—',
      },
      {
        key: 'status',
        header: 'Status',
        render: (u) => (
          <Badge status={u.isActive ? 'approved' : 'rejected'}>
            {u.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (u) => (
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              title="Edit user and stores"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(u);
              }}
            >
              <UserPen className="h-4 w-4" />
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                title="Deactivate"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(u);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [brands, isSuperAdmin],
  );

  if (usersQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (usersQ.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(usersQ.error)}</p>
        <Button className="mt-4" onClick={() => usersQ.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">App users</h1>
          <p className="text-sm text-slate-500">
            Field staff who log into the mobile app by phone. Only the stores you
            assign here are visible to them.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add app user
        </Button>
      </div>

      {appUsers.length === 0 ? (
        <EmptyState
          title="No app users yet"
          subtitle="Add a merchandiser or promoter so they can log into the mobile app."
        />
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <Table columns={columns} data={appUsers} rowKey={(u) => u.id} />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit app user' : 'Add app user'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={() => (editing ? updateM.mutate() : createM.mutate())}
              loading={createM.isPending || updateM.isPending}
              disabled={!canSave}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            placeholder="e.g. Ali Hassan"
          />

          <div>
            <Input
              label="Phone number"
              value={form.whatsappPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsappPhone: e.target.value }))
              }
              placeholder="e.g. 03 123 456"
            />
            <p className="mt-1 text-xs text-slate-500">
              They log in with this number and receive the code on WhatsApp.
            </p>
          </div>

          <Select
            label="Role"
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as AppRole }))
            }
          >
            <option value="merchandiser">Merchandiser</option>
            <option value="promoter">Promoter</option>
          </Select>

          <Select
            label="Brand"
            value={form.brandId}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandId: e.target.value }))
            }
            disabled={Boolean(isBm && lockedBrand)}
          >
            <option value="">No specific brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Assigned stores
              </label>
              <span className="text-xs font-medium text-indigo-600">
                {form.outletIds.length} selected
              </span>
            </div>

            <Input
              value={outletSearch}
              onChange={(e) => setOutletSearch(e.target.value)}
              placeholder="Search stores…"
            />

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:underline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    outletIds: visibleOutlets.map((o) => o.id),
                  }))
                }
              >
                Select all shown
              </button>
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:underline"
                onClick={() => setForm((f) => ({ ...f, outletIds: [] }))}
              >
                Clear
              </button>
            </div>

            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
              {assignmentsQ.isLoading ? (
                <div className="p-3">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : visibleOutlets.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">No stores found.</p>
              ) : (
                visibleOutlets.map((o) => {
                  const checked = form.outletIds.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2 text-sm last:border-b-0 hover:bg-slate-50',
                        checked && 'bg-indigo-50/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOutlet(o.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      <Store className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="flex-1 text-slate-700">{o.name}</span>
                      {o.isDepot && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                          Depot
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The app shows only these stores to this user.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate app user?"
        message={`${deleteTarget?.fullName ?? 'This user'} will no longer be able to log into the mobile app.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteM.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteM.mutate(deleteTarget.id)}
      />
    </div>
  );
}
