import { fetchBrands } from '@/api/brands';
import { createUser, deleteUser, fetchUsers, updateUser } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { cn, getAxiosMessage } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import type { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const roleEnum = z.enum([
  'super_admin',
  'brand_manager',
  'supervisor',
  'reviewer',
  'promoter',
  'merchandiser',
]);

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  whatsappPhone: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  role: roleEnum,
  brandId: z.string().optional(),
  isActive: z.boolean(),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  whatsappPhone: z.string().optional(),
  email: z.string().email(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, 'Min 8 characters if set'),
  role: roleEnum,
  brandId: z.string().optional(),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

const roleClass: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  brand_manager: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  supervisor: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  reviewer: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  promoter: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
  merchandiser: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
};

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        roleClass[role] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      )}
    >
      {role.replace(/_/g, ' ')}
    </span>
  );
}

export function Users() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const usersQ = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const usersResponse = usersQ.data as unknown;
  const users = Array.isArray(usersResponse)
    ? (usersResponse as User[])
    : (((usersResponse as any)?.data ?? []) as User[]);

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      whatsappPhone: '',
      email: '',
      password: '',
      role: 'reviewer',
      brandId: '',
      isActive: true,
    },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      whatsappPhone: '',
      email: '',
      password: '',
      role: 'reviewer',
      brandId: '',
      isActive: true,
    },
  });

  const createM = useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: async () => {
      addToast('success', 'User created');
      setModalOpen(false);
      createForm.reset();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Create failed'),
  });

  const updateM = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateUser>[1];
    }) => updateUser(id, body),
    onSuccess: async () => {
      addToast('success', 'User updated');
      setModalOpen(false);
      setEditing(null);
      editForm.reset();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });

  const deleteM = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      addToast('success', 'User deactivated');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Delete failed'),
  });

  const brandName = (id: string | null) => {
    if (!id) return '—';
    return brandsQ.data?.find((b) => b.id === id)?.name ?? `#${id}`;
  };

  const filtered = useMemo(() => {
    const list = users.filter(
      (u) =>
        !search ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.whatsappPhone ?? '').includes(search),
    );
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = a.fullName;
        bv = b.fullName;
      } else if (sortKey === 'email') {
        av = a.email ?? '';
        bv = b.email ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, sortKey, sortDir]);

  const columns: TableColumn<User>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => row.fullName,
      },
      {
        key: 'phone',
        header: 'WhatsApp',
        render: (row) => row.whatsappPhone ?? '—',
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (row) => row.email ?? '—',
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => <RolePill role={row.role} />,
      },
      {
        key: 'brand',
        header: 'Brand',
        render: (row) => brandName(row.brandId),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span className={row.isActive ? 'text-emerald-600' : 'text-slate-400'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setEditing(row);
                editForm.reset({
                  fullName: row.fullName,
                  whatsappPhone: row.whatsappPhone ?? '',
                  email: row.email ?? '',
                  password: '',
                  role: row.role,
                  brandId: row.brandId ?? '',
                  isActive: row.isActive,
                });
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              onClick={() => setDeleteId(row.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [brandsQ.data],
  );

  const openCreate = () => {
    setEditing(null);
    createForm.reset({
      fullName: '',
      whatsappPhone: '',
      email: '',
      password: '',
      role: 'reviewer',
      brandId: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const onCreate = createForm.handleSubmit((vals) => {
    createM.mutate({
      fullName: vals.fullName,
      whatsappPhone: vals.whatsappPhone || undefined,
      email: vals.email,
      password: vals.password,
      role: vals.role,
      brandId: vals.brandId || null,
    });
  });

  const onEdit = editForm.handleSubmit((vals) => {
    if (!editing) return;
    const body: Parameters<typeof updateUser>[1] = {
      fullName: vals.fullName,
      whatsappPhone: vals.whatsappPhone || null,
      email: vals.email,
      role: vals.role,
      brandId: vals.brandId || null,
      isActive: vals.isActive,
    };
    if (vals.password && vals.password.length >= 8) {
      body.password = vals.password;
    }
    updateM.mutate({ id: editing.id, body });
  });

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

  const brands = brandsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="sr-only">Users</h1>
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, WhatsApp"
          className="max-w-md"
        />
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add user
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No users" subtitle="Invite your first teammate." />
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (sortKey === key) {
              setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortKey(key);
              setSortDir('asc');
            }
          }}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit user' : 'Create user'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editing ? onEdit : onCreate}
              loading={createM.isPending || updateM.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        {editing ? (
          <form className="space-y-4" onSubmit={onEdit}>
            <Input
              label="Full name"
              {...editForm.register('fullName')}
              error={editForm.formState.errors.fullName?.message}
            />
            <Input
              label="WhatsApp phone"
              {...editForm.register('whatsappPhone')}
            />
            <Input
              label="Email"
              type="email"
              {...editForm.register('email')}
              error={editForm.formState.errors.email?.message}
            />
            <Input
              label="New password (optional)"
              type="password"
              autoComplete="new-password"
              {...editForm.register('password')}
              error={editForm.formState.errors.password?.message}
            />
            <Select label="Role" {...editForm.register('role')}>
              <option value="super_admin">Super admin</option>
              <option value="brand_manager">Brand manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="reviewer">Reviewer</option>
              <option value="promoter">Promoter</option>
              <option value="merchandiser">Merchandiser</option>
            </Select>
            <Select label="Brand" {...editForm.register('brandId')}>
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Controller
              name="isActive"
              control={editForm.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  Active
                </label>
              )}
            />
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onCreate}>
            <Input
              label="Full name"
              {...createForm.register('fullName')}
              error={createForm.formState.errors.fullName?.message}
            />
            <Input
              label="WhatsApp phone"
              {...createForm.register('whatsappPhone')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              {...createForm.register('email')}
              error={createForm.formState.errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              {...createForm.register('password')}
              error={createForm.formState.errors.password?.message}
            />
            <Select label="Role" {...createForm.register('role')}>
              <option value="super_admin">Super admin</option>
              <option value="brand_manager">Brand manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="reviewer">Reviewer</option>
              <option value="promoter">Promoter</option>
              <option value="merchandiser">Merchandiser</option>
            </Select>
            <Select label="Brand" {...createForm.register('brandId')}>
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Controller
              name="isActive"
              control={createForm.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  Active
                </label>
              )}
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate user?"
        message="The user will be marked inactive."
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteM.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
      />
    </div>
  );
}
