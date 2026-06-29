import { fetchBrands } from '@/api/brands';
import {
  importCatalog,
  type ImportCatalogResult,
  type ImportRowStatus,
} from '@/api/products';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { ROLES } from '@/lib/constants';
import { cn, getAxiosMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const STATUS_STYLES: Record<ImportRowStatus, string> = {
  created: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  updated: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  skipped: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  conflict: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'blue' | 'slate' | 'red';
}) {
  const toneCls = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    slate: 'text-slate-600',
    red: 'text-red-600',
  }[tone];
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={cn('text-2xl font-bold', toneCls)}>{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['product_name', 'sku', 'barcode'],
    ['Gliss Ultimate Repair Shampoo 250ml', 'GL-SHMP-250', '5410091729400'],
    ['Gliss Oil Nutritive Conditioner 200ml', 'GL-COND-200', '5410091729417'],
    ['Palette Intensive Color 4-0', '', '4015000526012'],
  ]);
  ws['!cols'] = [{ wch: 44 }, { wch: 18 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'catalog_import_template.xlsx');
}

export function CatalogImport() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const isBm = user?.role === ROLES.BRAND_MANAGER;
  const lockedBrand = isBm ? user?.brandId ?? '' : '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandId, setBrandId] = useState(lockedBrand);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportCatalogResult | null>(null);
  const [committed, setCommitted] = useState<ImportCatalogResult | null>(null);
  // Identifies the exact file+brand the preview was run against, so the
  // Confirm button can only commit what was actually previewed.
  const [previewedKey, setPreviewedKey] = useState<string | null>(null);

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const currentKey = file ? `${brandId}::${file.name}::${file.size}` : null;

  function resetResults() {
    setPreview(null);
    setCommitted(null);
    setPreviewedKey(null);
  }

  const previewM = useMutation({
    mutationFn: () => importCatalog({ brandId, file: file!, dryRun: true }),
    onSuccess: (res) => {
      setPreview(res);
      setCommitted(null);
      setPreviewedKey(currentKey);
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Preview failed'),
  });

  const commitM = useMutation({
    mutationFn: () => importCatalog({ brandId, file: file!, dryRun: false }),
    onSuccess: async (res) => {
      setCommitted(res);
      setPreview(null);
      addToast(
        'success',
        `Import complete — ${res.created} created, ${res.updated} updated`,
      );
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: unknown) =>
      addToast('error', getAxiosMessage(e) || 'Import failed'),
  });

  function onPickFile(f: File | null) {
    setFile(f);
    resetResults();
  }

  const result = committed ?? preview;
  const canPreview = Boolean(brandId && file) && !previewM.isPending;
  const canCommit =
    Boolean(preview) &&
    previewedKey === currentKey &&
    !commitM.isPending &&
    (preview?.created ?? 0) + (preview?.updated ?? 0) > 0;

  const brands = brandsQ.data ?? [];
  const brandName = useMemo(
    () => brands.find((b) => b.id === brandId)?.name ?? '',
    [brands, brandId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Import catalog
          </h1>
          <p className="text-sm text-slate-500">
            Upload an Excel file of products and barcodes for one brand.
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={downloadTemplate}
        >
          Download template
        </Button>
      </div>

      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              resetResults();
            }}
            disabled={Boolean(isBm && lockedBrand)}
          >
            <option value="">Select a brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Excel file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  className="rounded p-1 text-slate-400 hover:text-red-600"
                  onClick={() => {
                    onPickFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose .xlsx file
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={!canPreview}
            loading={previewM.isPending}
            onClick={() => previewM.mutate()}
          >
            Preview (dry run)
          </Button>
          <Button
            variant="primary"
            disabled={!canCommit}
            loading={commitM.isPending}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => commitM.mutate()}
          >
            Confirm import
          </Button>
          {preview && previewedKey === currentKey && !committed && (
            <span className="text-sm text-amber-600">
              Preview ready — review below, then confirm to write changes.
            </span>
          )}
        </div>
      </Card>

      {result && (
        <Card
          title={
            committed
              ? `Import complete${brandName ? ` — ${brandName}` : ''}`
              : `Preview${brandName ? ` — ${brandName}` : ''}`
          }
          subtitle={`${result.totalRows} rows in file`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Created" value={result.created} tone="emerald" />
            <StatCard label="Updated" value={result.updated} tone="blue" />
            <StatCard label="Skipped" value={result.skipped} tone="slate" />
            <StatCard label="Conflicts" value={result.conflicts} tone="red" />
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Barcode</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.rows.map((r) => (
                  <tr key={r.row} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-400">{r.row}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {r.productName ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{r.sku ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">
                      {r.barcode ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          STATUS_STYLES[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {r.reason ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!result && !brandsQ.isLoading && brands.length === 0 && (
        <EmptyState
          title="No brands yet"
          subtitle="Create a brand before importing its catalog."
        />
      )}
    </div>
  );
}
