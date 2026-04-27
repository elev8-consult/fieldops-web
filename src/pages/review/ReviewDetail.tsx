import { FlagList } from '@/components/review/FlagList';
import { MessagePreview } from '@/components/review/MessagePreview';
import { MerchandiserItemsTable } from '@/components/review/MerchandiserItemsTable';
import { PromoterSalesTable } from '@/components/review/PromoterSalesTable';
import { PromoterSamplesTable } from '@/components/review/PromoterSamplesTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchOutlets } from '@/api/outlets';
import {
  useApproveReport,
  useDismissFlag,
  useRejectReport,
  useResolveFlag,
  useReviewDetail,
  useUpdateReport,
} from '@/hooks/useReview';
import {
  usePatchMerchandiserItem,
  usePatchPromoterSaleItem,
  usePatchPromoterSampleItem,
} from '@/hooks/useReports';
import { REPORT_TYPE_LABELS } from '@/lib/constants';
import { formatConfidence, formatDateTime, getAxiosMessage } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const headerSchema = z.object({
  reportDate: z.string().optional(),
  locationRaw: z.string().optional(),
  nameRaw: z.string().optional(),
  outletId: z.string().optional(),
});

type HeaderForm = z.infer<typeof headerSchema>;

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detailQ = useReviewDetail(id);

  const outletsQ = useQuery({
    queryKey: ['outlets', 'all'],
    queryFn: () => fetchOutlets(),
    staleTime: 60_000,
  });

  const updateM = useUpdateReport();
  const approveM = useApproveReport();
  const rejectM = useRejectReport();
  const resolveF = useResolveFlag();
  const dismissF = useDismissFlag();
  const patchMerchItem = usePatchMerchandiserItem();
  const patchSale = usePatchPromoterSaleItem();
  const patchSample = usePatchPromoterSampleItem();

  const [tab, setTab] = useState<'sales' | 'samples' | 'feedback'>('sales');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [flagBusy, setFlagBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pr = detailQ.data;
  const flags = pr?.flags ?? [];
  const message = pr?.message ?? null;

  const form = useForm<HeaderForm>({
    resolver: zodResolver(headerSchema),
    values: pr
      ? {
          reportDate: pr.reportDate?.slice(0, 10) ?? '',
          locationRaw: pr.locationRaw ?? '',
          nameRaw: pr.nameRaw ?? '',
          outletId: pr.outlet?.id ?? pr.outletId ?? '',
        }
      : undefined,
  });

  const missingFields = useMemo(() => {
    const extraction = message?.aiExtraction;
    if (!extraction || typeof extraction !== 'object') return [];
    const raw = (extraction as Record<string, unknown>).missing_fields;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean);
  }, [message]);

  if (detailQ.isLoading || !id) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (detailQ.isError || !pr) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
        <p className="text-red-800">{getAxiosMessage(detailQ.error)}</p>
        <Button className="mt-4" onClick={() => detailQ.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const senderTitle = pr.nameRaw ?? message?.bodyRaw?.slice(0, 40) ?? 'Report';
  const conf = message?.aiConfidence ?? 0;
  const confColor =
    conf >= 0.85 ? 'text-emerald-600' : conf >= 0.65 ? 'text-amber-600' : 'text-red-600';

  const onSaveHeader = form.handleSubmit((vals) => {
    updateM.mutate({
      id: pr.id,
      data: {
        reportDate: vals.reportDate || null,
        locationRaw: vals.locationRaw ?? null,
        nameRaw: vals.nameRaw ?? null,
        outletId: vals.outletId ? vals.outletId : null,
      },
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/review"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            Review Report — {senderTitle}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
          <Button
            className="!bg-emerald-600 hover:!bg-emerald-700"
            onClick={() => setApproveOpen(true)}
          >
            Approve
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Report Information" padding>
            <form onSubmit={onSaveHeader} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Brand"
                value={pr.brand?.name ?? '—'}
                readOnly
              />
              <Input
                label="Date"
                type="date"
                {...form.register('reportDate')}
              />
              <Input label="Location" {...form.register('locationRaw')} />
              <Input label="Sender name" {...form.register('nameRaw')} />
              <Select label="Outlet" {...form.register('outletId')}>
                <option value="">— None —</option>
                {(outletsQ.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-sm text-slate-600">Depot report:</span>
                <Badge status={pr.isDepotReport ? 'flagged' : 'draft'}>
                  {pr.isDepotReport ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" loading={updateM.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          {pr.reportType === 'merchandiser' && (
            <Card
              title="Stock Items"
              subtitle={`${(pr.reportData?.items ?? []).length} items`}
              padding
            >
              <MerchandiserItemsTable
                items={pr.reportData?.items ?? []}
                onRefresh={() => {
                  detailQ.refetch();
                }}
                onSaveItem={(itemId, body) => {
                  if (!pr.reportData?.id) return;
                  patchMerchItem.mutate({
                    reportId: pr.reportData.id,
                    itemId,
                    body,
                  });
                }}
                savingId={
                  patchMerchItem.isPending
                    ? patchMerchItem.variables?.itemId ?? null
                    : null
                }
              />
            </Card>
          )}

          {pr.reportType === 'promoter' && (
            <Card title="Promoter data" padding>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="text-xs text-slate-500">Persons contacted</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {pr.reportData?.personsContacted ?? '—'}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="text-xs text-slate-500">Persons tasted</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {pr.reportData?.personsTasted ?? '—'}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex gap-2 border-b border-slate-100 pb-2">
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
                <PromoterSalesTable
                  items={pr.reportData?.sales ?? []}
                  reportId={pr.reportData?.id ?? ''}
                  onSaveItem={(itemId, body) => {
                    if (!pr.reportData?.id) return;
                    patchSale.mutate({
                      reportId: pr.reportData.id,
                      itemId,
                      body,
                    });
                  }}
                  savingId={
                    patchSale.isPending ? patchSale.variables?.itemId ?? null : null
                  }
                />
              )}

              {tab === 'samples' && (
                <PromoterSamplesTable
                  items={pr.reportData?.samples ?? []}
                  reportId={pr.reportData?.id ?? ''}
                  onSaveItem={(itemId, body) => {
                    if (!pr.reportData?.id) return;
                    patchSample.mutate({
                      reportId: pr.reportData.id,
                      itemId,
                      body,
                    });
                  }}
                  savingId={
                    patchSample.isPending
                      ? patchSample.variables?.itemId ?? null
                      : null
                  }
                />
              )}

              {tab === 'feedback' && (
                <div className="space-y-4">
                  <blockquote className="rounded-lg border-l-4 border-indigo-500 bg-slate-50 p-4 italic text-slate-700">
                    {pr.reportData?.feedbackText ?? '—'}
                  </blockquote>
                  {pr.reportData?.mostAskedQuestion && (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm">
                      <span className="font-semibold text-amber-900">
                        Most asked:{' '}
                      </span>
                      {pr.reportData.mostAskedQuestion}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(Array.isArray(pr.reportData?.questionsAnswers)
                      ? pr.reportData?.questionsAnswers
                      : []
                    ).map((qa, i) => (
                      <details key={i} className="rounded-lg border border-slate-100">
                        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                          {qa.question}
                        </summary>
                        <div className="border-t border-slate-100 px-3 py-2 text-sm text-slate-600">
                          {qa.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Original Message" padding>
            <MessagePreview
              bodyRaw={message?.bodyRaw ?? null}
              messageType={message?.messageType ?? 'text'}
              receivedAt={message?.receivedAt}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Flags"
            subtitle={`${flags.filter((f) => f.status === 'open').length} open`}
            padding
          >
            <FlagList
              flags={flags}
              reportId={pr.id}
              busyId={flagBusy}
              onResolve={(fid) => {
                setFlagBusy(fid);
                startTransition(() => {
                  resolveF.mutate(fid, { onSettled: () => setFlagBusy(null) });
                });
              }}
              onDismiss={(fid) => {
                setFlagBusy(fid);
                startTransition(() => {
                  dismissF.mutate(fid, { onSettled: () => setFlagBusy(null) });
                });
              }}
            />
          </Card>

          <Card title="AI Analysis" padding>
            <div className={`text-3xl font-bold ${confColor}`}>
              {formatConfidence(message?.aiConfidence ?? null)}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, Math.round(conf * 100))}%` }}
              />
            </div>
            {missingFields.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {missingFields.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-sm text-slate-600">
              Type: {REPORT_TYPE_LABELS[pr.reportType] ?? pr.reportType}
            </p>
          </Card>

          <Card title="Meta" padding>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Report ID</dt>
                <dd className="font-mono text-xs">{pr.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd>{formatDateTime(pr.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Brand</dt>
                <dd>{pr.brand?.name ?? pr.brandId ?? '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={approveOpen}
        title="Approve report?"
        message="Open flags will be resolved and the report marked approved."
        confirmLabel="Approve"
        onCancel={() => setApproveOpen(false)}
        loading={approveM.isPending}
        onConfirm={() => {
          approveM.mutate(pr.id, {
            onSuccess: () => {
              setApproveOpen(false);
              navigate('/review');
            },
          });
        }}
      />
      <ConfirmDialog
        open={rejectOpen}
        title="Reject report?"
        message="This will mark the parsed report as rejected."
        confirmLabel="Reject"
        variant="danger"
        onCancel={() => setRejectOpen(false)}
        loading={rejectM.isPending}
        onConfirm={() => {
          rejectM.mutate(pr.id, {
            onSuccess: () => {
              setRejectOpen(false);
              navigate('/review');
            },
          });
        }}
      />
    </div>
  );
}
