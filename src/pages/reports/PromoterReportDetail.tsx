import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type TableColumn } from '@/components/ui/Table';
import { usePromoterReport } from '@/hooks/useReports';
import { formatDate, getAxiosMessage } from '@/lib/utils';
import type { PromoterSaleItem, PromoterSampleItem } from '@/types';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function PromoterReportDetail() {
  const { id } = useParams<{ id: string }>();
  const q = usePromoterReport(id);
  const [tab, setTab] = useState<'sales' | 'samples' | 'feedback'>('sales');
  const [saleSort, setSaleSort] = useState({ key: 'name', dir: 'asc' as 'asc' | 'desc' });
  const [sampleSort, setSampleSort] = useState({
    key: 'name',
    dir: 'asc' as 'asc' | 'desc',
  });

  const report = q.data;
  const pr = report?.parsedReport;

  const sortedSales = useMemo(() => {
    const list = [...(report?.sales ?? [])];
    const { key, dir } = saleSort;
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (key === 'name') {
        av = a.productNameRaw ?? '';
        bv = b.productNameRaw ?? '';
      } else if (key === 'qty') {
        av = a.quantity ?? -1;
        bv = b.quantity ?? -1;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [report?.sales, saleSort]);

  const sortedSamples = useMemo(() => {
    const list = [...(report?.samples ?? [])];
    const { key, dir } = sampleSort;
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (key === 'name') {
        av = a.productNameRaw ?? '';
        bv = b.productNameRaw ?? '';
      } else if (key === 'qty') {
        av = a.quantity ?? -1;
        bv = b.quantity ?? -1;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [report?.samples, sampleSort]);

  const saleColumns: TableColumn<PromoterSaleItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Product',
        sortable: true,
        render: (row) => row.productNameRaw ?? '—',
      },
      {
        key: 'qty',
        header: 'Qty',
        sortable: true,
        render: (row) => row.quantity ?? '—',
      },
      {
        key: 'promo',
        header: 'Promo label',
        render: (row) => row.promoLabel ?? '—',
      },
      {
        key: 'offer',
        header: 'Offer',
        render: (row) =>
          row.isOffer ? (
            <Badge status="approved">Yes</Badge>
          ) : (
            <span className="text-slate-400">No</span>
          ),
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

  const sampleColumns: TableColumn<PromoterSampleItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Product',
        sortable: true,
        render: (row) => row.productNameRaw ?? '—',
      },
      {
        key: 'qty',
        header: 'Qty',
        sortable: true,
        render: (row) => row.quantity ?? '—',
      },
      {
        key: 'note',
        header: 'Availability',
        render: (row) => row.availabilityNote ?? '—',
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

  const qa: { question: string; answer: string }[] = Array.isArray(
    report?.questionsAnswers,
  )
    ? (report.questionsAnswers as { question: string; answer: string }[])
    : [];

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
          to="/reports/promoter"
          className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/reports/promoter"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Promoter reports
      </Link>

      <Card title="Overview" padding>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium">
              {formatDate(pr.reportDate ?? pr.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{pr.nameRaw ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Outlet</dt>
            <dd className="font-medium">
              {pr.outlet?.name ?? pr.outletId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Stand placement</dt>
            <dd>{report.promoStandPlacement ?? '—'}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Persons contacted</p>
          <p className="text-3xl font-bold text-slate-900">
            {report.personsContacted ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Persons tasted</p>
          <p className="text-3xl font-bold text-slate-900">
            {report.personsTasted ?? '—'}
          </p>
        </div>
      </div>

      <Card padding>
        <div className="mb-4 flex gap-2 border-b border-slate-100 pb-3">
          {(['sales', 'samples', 'feedback'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'sales' && (
          <Table
            columns={saleColumns}
            data={sortedSales}
            rowKey={(r) => r.id}
            sortKey={saleSort.key}
            sortDir={saleSort.dir}
            onSort={(key) => {
              setSaleSort((s) =>
                s.key === key
                  ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                  : { key, dir: 'asc' },
              );
            }}
          />
        )}
        {tab === 'samples' && (
          <Table
            columns={sampleColumns}
            data={sortedSamples}
            rowKey={(r) => r.id}
            sortKey={sampleSort.key}
            sortDir={sampleSort.dir}
            onSort={(key) => {
              setSampleSort((s) =>
                s.key === key
                  ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                  : { key, dir: 'asc' },
              );
            }}
          />
        )}
        {tab === 'feedback' && (
          <div className="space-y-4">
            <blockquote className="rounded-lg border-l-4 border-indigo-500 bg-slate-50 p-4 italic text-slate-700">
              {report.feedbackText ?? 'No feedback captured.'}
            </blockquote>
            {report.mostAskedQuestion && (
              <div className="rounded-lg bg-amber-50 p-4 text-sm">
                <span className="font-semibold text-amber-900">
                  Most asked question:{' '}
                </span>
                {report.mostAskedQuestion}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Q&amp;A</p>
              {qa.length === 0 ? (
                <p className="text-sm text-slate-500">No Q&amp;A pairs.</p>
              ) : (
                qa.map((pair, i) => (
                  <details
                    key={i}
                    className="rounded-lg border border-slate-100"
                  >
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                      {pair.question}
                    </summary>
                    <div className="border-t border-slate-100 px-3 py-2 text-sm text-slate-600">
                      {pair.answer}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
