import { fetchBrands } from '@/api/brands';
import {
  addProductAlias,
  createProduct,
  deleteProduct,
  deleteProductAlias,
  fetchProductAliases,
  fetchProducts,
  updateProduct,
} from '@/api/products';
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
import type { Product, ProductAlias } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const flows = ['merchandiser', 'promoter', 'both'] as const;

const productSchema = z.object({
  canonicalName: z.string().min(1, 'Required'),
  sku: z.string().optional(),
  flow: z.enum(flows),
  unit: z.string().optional(),
  brandId: z.string().min(1, 'Brand required'),
});

type ProductForm = z.infer<typeof productSchema>;

function FlowBadge({ flow }: { flow: Product['flow'] }) {
  const cls =
    flow === 'merchandiser'
      ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200'
      : flow === 'promoter'
        ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        cls,
      )}
    >
      {flow}
    </span>
  );
}

export function Products() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const canDelete = useAuthStore((s) => s.hasRole(ROLES.SUPER_ADMIN));
  const isBm = user?.role === ROLES.BRAND_MANAGER;
  const lockedBrand = isBm ? user?.brandId ?? '' : '';

  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAlias, setDeleteAlias] = useState<ProductAlias | null>(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const effectiveBrand = isBm ? lockedBrand : brandFilter || undefined;

  const productsQ = useQuery({
    queryKey: ['products', effectiveBrand, search],
    queryFn: () =>
      fetchProducts({
        brand_id: effectiveBrand,
        search: search || undefined,
      }),
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const aliasesQ = useQuery({
    queryKey: ['products', expandedId, 'aliases'],
    queryFn: () => fetchProductAliases(expandedId!),
    enabled: Boolean(expandedId),
    staleTime: 30_000,
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    mode: 'onChange',
    defaultValues: {
      canonicalName: '',
      sku: '',
      flow: 'merchandiser',
      unit: '',
      brandId: lockedBrand || '',
    },
  });

  const createM = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      addToast('success', 'Product created');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: unknown) => addToast('error', getAxiosMessage(e) || 'Create failed'),
  });

  const updateM = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateProduct>[1];
    }) => updateProduct(id, body),
    onSuccess: async () => {
      addToast('success', 'Product updated');
      closeModal();
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: unknown) => addToast('error', getAxiosMessage(e) || 'Update failed'),
  });

  const deleteM = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      addToast('success', 'Product deactivated');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: unknown) => addToast('error', getAxiosMessage(e) || 'Delete failed'),
  });

  const addAliasM = useMutation({
    mutationFn: ({ pid, alias }: { pid: string; alias: string }) =>
      addProductAlias(pid, alias),
    onSuccess: async () => {
      addToast('success', 'Alias added');
      setAliasDraft('');
      await qc.invalidateQueries({
        queryKey: ['products', expandedId, 'aliases'],
      });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Failed to add alias'),
  });

  const delAliasM = useMutation({
    mutationFn: deleteProductAlias,
    onSuccess: async () => {
      addToast('success', 'Alias removed');
      setDeleteAlias(null);
      await qc.invalidateQueries({
        queryKey: ['products', expandedId, 'aliases'],
      });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Failed to remove alias'),
  });

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    form.reset({
      canonicalName: '',
      sku: '',
      flow: 'merchandiser',
      unit: '',
      brandId: lockedBrand || '',
    });
  }

  const productsResponse = productsQ.data;
  const rows = productsResponse?.data ?? [];
  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = a.canonicalName;
        bv = b.canonicalName;
      } else if (sortKey === 'sku') {
        av = a.sku ?? '';
        bv = b.sku ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const brandLabel = (id: string) =>
    brandsQ.data?.find((b) => b.id === id)?.name ?? `#${id}`;

  const columns: TableColumn<Product>[] = useMemo(
    () => [
      {
        key: 'expand',
        header: '',
        render: (row) => (
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId((id) => (id === row.id ? null : row.id));
            }}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                expandedId === row.id && 'rotate-180',
              )}
            />
          </button>
        ),
      },
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => row.canonicalName,
      },
      {
        key: 'sku',
        header: 'SKU',
        sortable: true,
        render: (row) => row.sku ?? '—',
      },
      {
        key: 'flow',
        header: 'Flow',
        render: (row) => <FlowBadge flow={row.flow} />,
      },
      {
        key: 'unit',
        header: 'Unit',
        render: (row) => row.unit ?? '—',
      },
      {
        key: 'brand',
        header: 'Brand',
        render: (row) => brandLabel(row.brandId),
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
              onClick={(e) => {
                e.stopPropagation();
                setEditing(row);
                form.reset({
                  canonicalName: row.canonicalName,
                  sku: row.sku ?? '',
                  flow: row.flow,
                  unit: row.unit ?? '',
                  brandId: row.brandId,
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
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(row.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [brandsQ.data, canDelete, expandedId, form],
  );

  const onSubmit = form.handleSubmit((vals) => {
    const body = {
      brandId: vals.brandId,
      canonicalName: vals.canonicalName,
      sku: vals.sku || null,
      flow: vals.flow,
      unit: vals.unit || null,
    };
    if (editing) {
      updateM.mutate({ id: editing.id, body });
    } else {
      createM.mutate(body);
    }
  });

  if (productsQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (productsQ.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(productsQ.error)}</p>
        <Button className="mt-4" onClick={() => productsQ.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const brands = brandsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="sr-only">Products</h1>
        <div className="flex flex-wrap gap-4">
          {!isBm && (
            <Select
              label="Brand filter"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="min-w-[200px]"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name"
            className="max-w-xs"
          />
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            form.reset({
              canonicalName: '',
              sku: '',
              flow: 'merchandiser',
              unit: '',
              brandId: lockedBrand || brands[0]?.id || '',
            });
            setModalOpen(true);
          }}
        >
          Add product
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No products" subtitle="Add a product to the catalog." />
      ) : (
        <div className="space-y-0 rounded-xl border border-slate-100 bg-white shadow-sm">
          <Table
            columns={columns}
            data={sorted}
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
          {expandedId && (
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Aliases for "
                {rows.find((r) => r.id === expandedId)?.canonicalName ?? 'Product'}":
              </p>
              {aliasesQ.isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {(aliasesQ.data ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs ring-1 ring-slate-200"
                    >
                      {a.alias}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => setDeleteAlias(a)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  value={aliasDraft}
                  onChange={(e) => setAliasDraft(e.target.value)}
                  placeholder="New alias"
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const t = aliasDraft.trim();
                    if (t && expandedId) {
                      addAliasM.mutate({ pid: expandedId, alias: t });
                    }
                  }}
                  loading={addAliasM.isPending}
                >
                  + Add alias manually
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit product' : 'Create product'}
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
            label="Canonical name"
            {...form.register('canonicalName')}
            error={form.formState.errors.canonicalName?.message}
          />
          <Input label="SKU" {...form.register('sku')} />
          <Select label="Flow" {...form.register('flow')}>
            <option value="merchandiser">Merchandiser</option>
            <option value="promoter">Promoter</option>
            <option value="both">Both</option>
          </Select>
          <Input label="Unit" {...form.register('unit')} />
          <Select
            label="Brand"
            {...form.register('brandId')}
            disabled={Boolean(isBm && lockedBrand)}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate product?"
        message="This product will be marked inactive."
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteM.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteM.mutate(deleteId)}
      />

      <ConfirmDialog
        open={Boolean(deleteAlias)}
        title="Remove alias?"
        message="This alias will be deleted permanently."
        confirmLabel="Remove"
        variant="danger"
        loading={delAliasM.isPending}
        onCancel={() => setDeleteAlias(null)}
        onConfirm={() => {
          if (deleteAlias) delAliasM.mutate(deleteAlias.id);
        }}
      />
    </div>
  );
}
