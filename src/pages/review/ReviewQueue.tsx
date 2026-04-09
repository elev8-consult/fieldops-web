import { ReviewCard } from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { useReviewQueue } from '@/hooks/useReview';
import { getAxiosMessage } from '@/lib/utils';
import type { Brand, ParsedReport } from '@/types';
import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function ReviewQueue() {
  const { user, hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('');
  const [status, setStatus] = useState('flagged');
  const [brandId, setBrandId] = useState<string>('');

  const brandFilter =
    user?.role === 'brand_manager' ? user.brandId ?? undefined : brandId || undefined;

  const brandsQ = useQuery({
    queryKey: ['brands', 'all'],
    queryFn: async (): Promise<Brand[]> => {
      const res = await api.get<Brand[]>('/brands');
      return res.data;
    },
    staleTime: 60_000,
    enabled: hasRole('super_admin'),
  });

  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brandsQ.data ?? []) {
      map.set(b.id, b.name);
    }
    return map;
  }, [brandsQ.data]);

  const query = useReviewQueue({
    page,
    limit: 10,
    status: status || undefined,
    report_type: reportType || undefined,
    brand_id: brandFilter,
  });

  const filtered = useMemo(() => {
    const rows = query.data?.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.locationRaw ?? '').toLowerCase().includes(q) ||
        (r.nameRaw ?? '').toLowerCase().includes(q),
    );
  }, [query.data?.data, search]);

  if (query.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-900">Something went wrong</h2>
            <p className="mt-1 text-sm text-red-700">
              {getAxiosMessage(query.error)}
            </p>
            <Button className="mt-4" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  const total = search.trim() ? filtered.length : (query.data?.total ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
      <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            placeholder="Sender, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Report type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="">All</option>
            <option value="merchandiser">Merchandiser</option>
            <option value="promoter">Promoter</option>
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="flagged">Flagged</option>
            <option value="pending_review">Pending Review</option>
            <option value="">All</option>
          </Select>
          {hasRole('super_admin') && (
            <Select
              label="Brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">All Brands</option>
              {(brandsQ.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <p className="text-sm text-slate-500">{total} reports found</p>
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 shadow-sm">
          <div className="flex flex-col items-center">
            <ClipboardCheck className="mb-4 h-12 w-12 text-slate-300" />
            <EmptyState
              title="No flagged reports"
              subtitle="Try changing filters or check back later."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r: ParsedReport) => (
            // Queue rows are flat; resolve brand name from brandId where possible
            <ReviewCard
              key={r.id}
              report={r}
              senderName={`${brandNameById.get(r.brandId ?? '') ?? 'Unknown brand'} — ${
                r.nameRaw ?? 'Unknown reporter'
              }`}
              itemCount={r.flags?.length ?? 0}
            />
          ))}
        </div>
      )}

      {!search.trim() && query.data && (
        <Pagination
          page={query.data.page}
          limit={query.data.limit}
          total={query.data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
