import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useMerchandiserReport } from '@/hooks/useReports';
import { formatConfidence, formatDate, getAxiosMessage } from '@/lib/utils';
import type { MerchandiserItem } from '@/types';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function MerchandiserReportDetail() {
  const { id } = useParams<{ id: string }>();
  const q = useMerchandiserReport(id);
  const [sortKey, setSortKey] = useState('product');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const report = q.data;
  const pr = report?.parsedReport;

  const sortedItems = useMemo(() => {
    const items = [...(report?.items ?? [])];
    items.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'product') {
        av = a.productNameRaw ?? '';
        bv = b.productNameRaw ?? '';
      } else if (sortKey === 'quantity') {
        av = a.quantity ?? -1;
        bv = b.quantity ?? -1;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [report?.items, sortKey, sortDir]);

  const columns: TableColumn<MerchandiserItem>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product',
        sortable: true,
        render: (row) => row.productNameRaw ?? '—',
      },
      {
        key: 'quantity',
        header: 'Qty',
        sortable: true,
        render: (row) => row.quantity ?? '—',
      },
      {
        key: 'expiry',
        header: 'Expiry',
        render: (row) => formatDate(row.expiryDate),
      },
      {
        key: 'expiryRaw',
        header: 'Expiry raw',
        render: (row) => row.expiryRaw ?? '—',
      },
      {
        key: 'matched',
        header: 'Matched',
        render: (row) =>
          row.isProductMatched ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          ),
      },
    ],
    [],
  );

  if (q.isLoading || !id) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (q.isError || !report || !pr) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(q.error)}</p>
        <Link
          to="/reports/merchandiser"
          className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>
    );
  }

  const openFlags = (pr.flags ?? []).filter((f) => f.status === 'open');

  return (
    <div className="space-y-6">
      <Link
        to="/reports/merchandiser"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Merchandiser reports
      </Link>

      <Card title="Report overview" padding>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium">
              {formatDate(pr.reportDate ?? pr.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Sender</dt>
            <dd className="font-medium">{pr.nameRaw ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Outlet</dt>
            <dd className="font-medium">
              {pr.outlet?.name ?? pr.outletId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Promo type</dt>
            <dd>{report.promoType ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Depot</dt>
            <dd>
              <Badge status={pr.isDepotReport ? 'flagged' : 'draft'}>
                {pr.isDepotReport ? 'Yes' : 'No'}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge status={pr.status} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Confidence</dt>
            <dd>{formatConfidence(pr.confidence)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Line items" padding>
        <Table
          columns={columns}
          data={sortedItems}
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
      </Card>

      <Card title="Flags" padding>
        {openFlags.length === 0 && (pr.flags?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">No flags recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(pr.flags ?? []).map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <span>{f.message}</span>
                <Badge status={f.status}>{f.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
