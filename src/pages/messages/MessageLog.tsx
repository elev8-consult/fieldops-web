import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useMessages } from '@/hooks/useMessages';
import { formatConfidence, formatDateTime, formatRelative, getAxiosMessage } from '@/lib/utils';
import type { WhatsappMessage } from '@/types';
import { AlertTriangle, Eye, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

function aiConfidenceBarClass(v: number | null) {
  if (v == null) return 'bg-slate-200';
  if (v >= 0.85) return 'bg-emerald-500';
  if (v >= 0.65) return 'bg-amber-500';
  return 'bg-red-500';
}

export function MessageLog() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [reportType, setReportType] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [selected, setSelected] = useState<WhatsappMessage | null>(null);
  const [sortKey, setSortKey] = useState('receivedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const q = useMessages({
    page,
    limit,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
    report_type: reportType || undefined,
    sender_phone: senderPhone || undefined,
  });

  const rows = q.data?.data ?? [];
  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'receivedAt') {
        av = a.receivedAt;
        bv = b.receivedAt;
      } else if (sortKey === 'sender') {
        av = (a.senderName ?? '') + a.senderPhone;
        bv = (b.senderName ?? '') + b.senderPhone;
      } else if (sortKey === 'status') {
        av = a.status;
        bv = b.status;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const columns: TableColumn<WhatsappMessage>[] = useMemo(
    () => [
      {
        key: 'sender',
        header: 'Sender',
        sortable: true,
        render: (row) => (
          <div>
            <div className="font-medium text-slate-900">
              {row.senderName ?? '—'}
            </div>
            <div className="text-xs text-slate-400">{row.senderPhone}</div>
          </div>
        ),
      },
      {
        key: 'messageType',
        header: 'Type',
        render: (row) => <Badge status={String(row.messageType)} />,
      },
      {
        key: 'reportType',
        header: 'Report type',
        render: (row) =>
          row.reportType ? (
            <Badge reportType={row.reportType} />
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => <Badge status={row.status} />,
      },
      {
        key: 'aiConfidence',
        header: 'AI confidence',
        render: (row) => (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${aiConfidenceBarClass(row.aiConfidence)}`}
                style={{
                  width: `${row.aiConfidence != null ? Math.round(row.aiConfidence * 100) : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-600">
              {formatConfidence(row.aiConfidence)}
            </span>
          </div>
        ),
      },
      {
        key: 'receivedAt',
        header: 'Received',
        sortable: true,
        render: (row) => (
          <span
            className="text-sm text-slate-700"
            title={formatDateTime(row.receivedAt)}
          >
            {formatRelative(row.receivedAt)}
          </span>
        ),
      },
      {
        key: 'action',
        header: '',
        render: (row) => (
          <button
            type="button"
            className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
            aria-label="View message"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(row);
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [],
  );

  function resetFilters() {
    setFrom('');
    setTo('');
    setStatus('');
    setReportType('');
    setSenderPhone('');
    setPage(1);
  }

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
      <h1 className="sr-only">Message Log</h1>
      <div className="flex flex-wrap items-end gap-4">
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
          className="max-w-[180px]"
        >
          <option value="">All</option>
          <option value="received">Received</option>
          <option value="processing">Processing</option>
          <option value="parsed">Parsed</option>
          <option value="flagged">Flagged</option>
          <option value="reviewed">Reviewed</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
          <option value="duplicate">Duplicate</option>
        </Select>
        <Select
          label="Report type"
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value);
            setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="">All</option>
          <option value="merchandiser">Merchandiser</option>
          <option value="promoter">Promoter</option>
          <option value="unknown">Unknown</option>
        </Select>
        <Input
          label="Sender phone"
          value={senderPhone}
          onChange={(e) => {
            setSenderPhone(e.target.value);
            setPage(1);
          }}
          placeholder="+961..."
          className="max-w-[200px]"
        />
        <Button variant="secondary" type="button" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No messages"
          subtitle="Adjust filters or check back later."
        />
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
            onRowClick={(row) => setSelected(row)}
          />
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      {selected &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="Close panel"
              onClick={() => setSelected(null)}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="font-semibold text-slate-900">Message detail</h2>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">ID</span>
                    <div className="font-mono text-xs">{selected.id}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">WA message</span>
                    <div className="font-mono text-xs">{selected.waMessageId}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Received</span>
                    <div>{formatDateTime(selected.receivedAt)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Processed</span>
                    <div>{formatDateTime(selected.processedAt)}</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Body</span>
                  <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                    {selected.bodyRaw ?? '—'}
                  </pre>
                </div>
                <details className="rounded-lg border border-slate-100">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    AI extraction (JSON)
                  </summary>
                  <pre className="max-h-48 overflow-auto border-t border-slate-100 p-3 text-xs">
                    {selected.aiExtraction
                      ? JSON.stringify(selected.aiExtraction, null, 2)
                      : '—'}
                  </pre>
                </details>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </div>
  );
}
