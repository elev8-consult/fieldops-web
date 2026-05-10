import { fetchBrands } from '@/api/brands';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import {
  useResolveUnknownSender,
  useUnknownSenders,
} from '@/hooks/useUnknownSenders';
import { formatDateTime, getAxiosMessage } from '@/lib/utils';
import type { UnknownSender } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type Filter = 'unresolved' | 'resolved' | 'all';

export function UnknownSenders() {
  const [filter, setFilter] = useState<Filter>('unresolved');
  const [selected, setSelected] = useState<UnknownSender | null>(null);
  const [brandId, setBrandId] = useState('');

  const unknownSendersQ = useUnknownSenders(
    filter === 'all' ? undefined : filter === 'resolved',
  );
  const brandsQ = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });
  const resolveMutation = useResolveUnknownSender();

  const rows = useMemo(() => {
    const data = unknownSendersQ.data ?? [];
    if (filter === 'all') return data;
    if (filter === 'resolved') return data.filter((row) => row.resolvedBrandId);
    return data.filter((row) => !row.resolvedBrandId);
  }, [unknownSendersQ.data, filter]);

  const columns: TableColumn<UnknownSender>[] = useMemo(
    () => [
      {
        key: 'senderPhone',
        header: 'Phone',
        render: (row) => row.senderPhone,
      },
      {
        key: 'senderName',
        header: 'Name',
        render: (row) => row.senderName ?? '—',
      },
      {
        key: 'seenCount',
        header: 'Seen',
        render: (row) => row.seenCount,
      },
      {
        key: 'firstSeenAt',
        header: 'First seen',
        render: (row) => formatDateTime(row.firstSeenAt),
      },
      {
        key: 'lastSeenAt',
        header: 'Last seen',
        render: (row) => formatDateTime(row.lastSeenAt),
      },
      {
        key: 'action',
        header: 'Action',
        render: (row) =>
          row.resolvedBrandId ? (
            <span className="text-xs text-emerald-700">Resolved</span>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setSelected(row);
                setBrandId('');
              }}
            >
              Resolve
            </Button>
          ),
      },
    ],
    [],
  );

  if (unknownSendersQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (unknownSendersQ.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(unknownSendersQ.error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Unknown Senders</h1>
        <div className="w-48">
          <Select
            label="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No unknown senders"
          subtitle="Incoming senders are all mapped to brands."
        />
      ) : (
        <Table columns={columns} data={rows} rowKey={(row) => row.id} />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Resolve sender"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              loading={resolveMutation.isPending}
              disabled={!brandId}
              onClick={async () => {
                if (!selected || !brandId) return;
                await resolveMutation.mutateAsync({
                  id: selected.id,
                  brandId,
                });
                setSelected(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Assign <span className="font-medium">{selected?.senderPhone}</span> to a
            brand.
          </p>
          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Select brand</option>
            {(brandsQ.data ?? []).map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
