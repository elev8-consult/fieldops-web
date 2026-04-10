import {
  createBrand,
  deleteBrand,
  fetchBrands,
  updateBrand,
} from '@/api/brands';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { ROLES } from '@/lib/constants';
import { formatDate, getAxiosMessage, slugify } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import type { Brand } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

type BrandForm = z.infer<typeof brandSchema>;

export function Brands() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const canMutate = useAuthStore((s) => s.hasRole(ROLES.SUPER_ADMIN));

  const q = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const brandsResponse = q.data as unknown;
  const brands = Array.isArray(brandsResponse)
    ? (brandsResponse as Brand[])
    : (((brandsResponse as any)?.data ?? []) as Brand[]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const form = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
    mode: 'onChange',
    defaultValues: { name: '', slug: '' },
  });

  const watchedName = form.watch('name');
  useEffect(() => {
    if (!editing && modalOpen) {
      form.setValue('slug', slugify(watchedName), { shouldValidate: true });
    }
  }, [watchedName, editing, modalOpen, form]);

  const createM = useMutation({
    mutationFn: createBrand,
    onSuccess: async () => {
      addToast('success', 'Brand created');
      setModalOpen(false);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Create failed'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateBrand>[1] }) =>
      updateBrand(id, body),
    onSuccess: async () => {
      addToast('success', 'Brand updated');
      setModalOpen(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Update failed'),
  });

  const deleteM = useMutation({
    mutationFn: deleteBrand,
    onSuccess: async () => {
      addToast('success', 'Brand deactivated');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (e: Error) => addToast('error', e.message || 'Delete failed'),
  });

  const filtered = useMemo(() => {
    const list = brands.filter(
      (b) =>
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase()),
    );
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = a.name;
        bv = b.name;
      } else if (sortKey === 'created') {
        av = a.createdAt;
        bv = b.createdAt;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [brands, search, sortKey, sortDir]);

  const columns: TableColumn<Brand>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => row.name,
      },
      { key: 'slug', header: 'Slug', render: (row) => row.slug },
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
        key: 'created',
        header: 'Created',
        sortable: true,
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'actions',
        header: '',
        render: (row) =>
          canMutate ? (
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setEditing(row);
                  form.reset({ name: row.name, slug: row.slug });
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
          ) : null,
      },
    ],
    [canMutate],
  );

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', slug: '' });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit((vals) => {
    if (editing) {
      updateM.mutate({
        id: editing.id,
        body: { name: vals.name, slug: vals.slug },
      });
    } else {
      createM.mutate({ name: vals.name, slug: vals.slug });
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
        <h1 className="sr-only">Brands</h1>
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or slug"
          className="max-w-md"
        />
        {canMutate && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add brand
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No brands" subtitle="Create a brand to get started." />
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
        title={editing ? 'Edit brand' : 'Create brand'}
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
              onClick={onSubmit}
              loading={createM.isPending || updateM.isPending}
              disabled={!form.formState.isValid}
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
          <Input
            label="Slug"
            {...form.register('slug')}
            error={form.formState.errors.slug?.message}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate brand?"
        message="This will soft-delete the brand."
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteM.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
      />
    </div>
  );
}
