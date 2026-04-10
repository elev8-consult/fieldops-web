import {
  createOutlet,
  deleteOutlet,
  fetchOutlets,
  updateOutlet,
} from '@/api/outlets';
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
import { getAxiosMessage } from '@/lib/utils';
import type { Outlet } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const outletTypes = [
  'supermarket',
  'minimarket',
  'hypermarket',
  'depot',
  'other',
] as const;

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(outletTypes),
  isDepot: z.boolean(),
  isActive: z.boolean(),
  regionId: z.string().min(1, 'Region required'),
  address: z.string().optional(),
});

type OutletForm = z.infer<typeof schema>;

export function Outlets() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const canDelete = useAuthStore((s) => s.hasRole(ROLES.SUPER_ADMIN));

  const q = useQuery({
    queryKey: ['outlets', 'admin'],
    queryFn: () => fetchOutlets(),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const outletsResponse = q.data as unknown;
  const outlets = Array.isArray(outletsResponse)
    ? (outletsResponse as Outlet[])
    : (((outletsResponse as any)?.data ?? []) as Outlet[]);

  const regions = useMemo(() => {
    const m = new Map<string, { id: string; name: string; country: string }>();
    for (const o of outlets) {
      if (o.region) m.set(o.region.id, o.region);
    }
    return [...m.values()];
  }, [outlets]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const form = useForm<OutletForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      type: 'supermarket',
      isDepot: false,
      isActive: true,
      regionId: '',
      address: '',
    },
  });

  const typeWatch = form.watch('type');
  useEffect(() => {
    if (typeWatch === 'depot') {
      form.setValue('isDepot', true);
    }
  }, [typeWatch, form]);

  const createM = useMutation({
    mutationFn: (body: Parameters<typeof createOutlet>[0]) =>
      createOutlet(body),
    onSuccess: async () => {
      addToast('success', 'Outlet created');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Create failed'),
  });

  const updateM = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateOutlet>[1];
    }) => updateOutlet(id, body),
    onSuccess: async () => {
      addToast('success', 'Outlet updated');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });

  const deleteM = useMutation({
    mutationFn: deleteOutlet,
    onSuccess: async () => {
      addToast('success', 'Outlet deactivated');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Delete failed'),
  });

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    form.reset();
  }

  const filtered = useMemo(() => {
    const list = outlets.filter(
      (o) =>
        !search || o.name.toLowerCase().includes(search.toLowerCase()),
    );
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = a.name;
        bv = b.name;
      } else if (sortKey === 'type') {
        av = a.type;
        bv = b.type;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [outlets, search, sortKey, sortDir]);

  const columns: TableColumn<Outlet>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => row.name,
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 ring-1 ring-slate-200">
            {row.type}
          </span>
        ),
      },
      {
        key: 'depot',
        header: 'Depot',
        render: (row) => (row.isDepot ? 'Yes' : 'No'),
      },
      {
        key: 'region',
        header: 'Region',
        render: (row) =>
          row.region
            ? `${row.region.name} (${row.region.country})`
            : row.regionId ?? '—',
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Badge status={row.isActive ? 'approved' : 'rejected'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
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
                form.reset({
                  name: row.name,
                  type: row.type,
                  isDepot: row.isDepot,
                  isActive: row.isActive,
                  regionId: row.regionId ?? '',
                  address: row.address ?? '',
                });
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {canDelete && (
              <button
                type="button"
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteId(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canDelete],
  );

  const onSubmit = form.handleSubmit((vals) => {
    const base = {
      name: vals.name,
      type: vals.type,
      isDepot: vals.isDepot,
      regionId: vals.regionId,
      address: vals.address || null,
    };
    if (editing) {
      updateM.mutate({
        id: editing.id,
        body: {
          ...base,
          isActive: vals.isActive,
        },
      });
    } else {
      createM.mutate(base);
    }
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(q.error)}</p>
        <Button className="mt-4" onClick={() => q.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="sr-only">Outlets</h1>
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Outlet name"
          className="max-w-md"
        />
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            form.reset({
              name: '',
              type: 'supermarket',
              isDepot: false,
              isActive: true,
              regionId: regions[0]?.id ?? '',
              address: '',
            });
            setModalOpen(true);
          }}
        >
          Add outlet
        </Button>
      </div>

      {regions.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No regions found on existing outlets. Enter a numeric region ID when
          creating an outlet (must exist in the database).
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No outlets" subtitle="Add your first outlet." />
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
        onClose={closeModal}
        title={editing ? 'Edit outlet' : 'Create outlet'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              loading={createM.isPending || updateM.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Name"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Select label="Type" {...form.register('type')}>
            {outletTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Controller
            name="isDepot"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                />
                Is depot
              </label>
            )}
          />
          {editing && (
            <Controller
              name="isActive"
              control={form.control}
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
          )}
          {regions.length > 0 ? (
            <Select label="Region" {...form.register('regionId')}>
              <option value="">Select region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.country})
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label="Region ID"
              {...form.register('regionId')}
              placeholder="Numeric ID"
              error={form.formState.errors.regionId?.message}
            />
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              {...form.register('address')}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate outlet?"
        message="This outlet will be marked inactive."
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteM.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
      />
    </div>
  );
}
