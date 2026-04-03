import { fetchBrands } from '@/api/brands';
import { fetchOutlets } from '@/api/outlets';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useAuth } from '@/hooks/useAuth';
import { useMerchandiserReports } from '@/hooks/useReports';
import { ROLES } from '@/lib/constants';
import { formatConfidence, formatDate, getAxiosMessage } from '@/lib/utils';
import type { MerchandiserReport } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MerchandiserReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBm = user?.role === ROLES.BRAND_MANAGER;
  const [page, setPage] = useState(1);
  const limit = 20;
  const [brandId, setBrandId] = useState(
    isBm && user?.brandId ? user.brandId : '',
  );
  const [outletId, setOutletId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    enabled: user?.role === ROLES.SUPER_ADMIN,
    staleTime: 60_000,
  });

  const outletsQ = useQuery({
    queryKey: ['outlets', 'reports-filters'],
    queryFn: () => fetchOutlets(),
    staleTime: 60_000,
  });

  const effectiveBrand =
    isBm ? user?.brandId ?? undefined : brandId || undefined;

  const q = useMerchandiserReports({
    page,
    limit,
    brand_id: effectiveBrand,
    outlet_id: outletId || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  });

  const rows = q.data?.data ?? [];
  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      const da = a.parsedReport.reportDate ?? a.parsedReport.createdAt;
      const db = b.parsedReport.reportDate ?? b.parsedReport.createdAt;
      if (sortKey === 'date') {
        av = da;
        bv = db;
      } else if (sortKey === 'sender') {
        av = a.parsedReport.nameRaw ?? '';
        bv = b.parsedReport.nameRaw ?? '';
      } else if (sortKey === 'items') {
        av = a.items.length;
        bv = b.items.length;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const columns: TableColumn<MerchandiserReport>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        render: (row) =>
          formatDate(
            row.parsedReport.reportDate ?? row.parsedReport.createdAt,
          ),
      },
      {
        key: 'sender',
        header: 'Sender',
        sortable: true,
        render: (row) => row.parsedReport.nameRaw ?? '—',
      },
      {
        key: 'location',
        header: 'Location',
        render: (row) => row.parsedReport.locationRaw ?? '—',
      },
      {
        key: 'outlet',
        header: 'Outlet',
        render: (row) =>
          row.parsedReport.outlet?.name ??
          (row.parsedReport.outletId ? `#${row.parsedReport.outletId}` : '—'),
      },
      {
        key: 'items',
        header: 'Items',
        sortable: true,
        render: (row) => row.items.length,
      },
      {
        key: 'promo',
        header: 'Promo type',
        render: (row) => row.promoType ?? '—',
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge status={row.parsedReport.status} />,
      },
      {
        key: 'conf',
        header: 'Confidence',
        render: (row) => formatConfidence(row.parsedReport.confidence),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <button
            type="button"
            className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports/merchandiser/${row.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [navigate],
  );

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <h2 className="font-semibold text-red-800">Something went wrong</h2>
        <p className="text-sm text-red-700">{getAxiosMessage(q.error)}</p>
        <Button className="mt-4" onClick={() => q.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const total = q.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Merchandiser Reports</h1>
      <div className="flex flex-wrap items-end gap-4">
        {user?.role === ROLES.SUPER_ADMIN && (
          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
            className="max-w-[200px]"
          >
            <option value="">All brands</option>
            {(brandsQ.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="Outlet"
          value={outletId}
          onChange={(e) => {
            setOutletId(e.target.value);
            setPage(1);
          }}
          className="max-w-[220px]"
        >
          <option value="">All outlets</option>
          {(outletsQ.data ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="max-w-[160px]"
        />
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="max-w-[160px]"
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="max-w-[200px]"
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="flagged">Flagged</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No reports" subtitle="Try different filters." />
      ) : (
        <>
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
            onRowClick={(row) => navigate(`/reports/merchandiser/${row.id}`)}
          />
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
