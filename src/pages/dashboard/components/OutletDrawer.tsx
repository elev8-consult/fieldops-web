import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { PromoterOutletReportsResponse } from '@/types';
import { X } from 'lucide-react';

interface OutletDrawerProps {
  open: boolean;
  data?: PromoterOutletReportsResponse;
  loading: boolean;
  onClose: () => void;
}

export function OutletDrawer({ open, data, loading, onClose }: OutletDrawerProps) {
  if (!open) return null;

  const matchBadgeClass = (matchType: string | null) => {
    if (matchType === 'exact') return 'bg-emerald-100 text-emerald-700';
    if (matchType === 'alias') return 'bg-blue-100 text-blue-700';
    if (matchType === 'fuzzy') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-500';
  };

  const matchLabel = (matchType: string | null) => matchType ?? 'unmatched';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Outlet Reports</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-5">
          {loading && <div className="text-sm text-slate-500">Loading outlet reports...</div>}
          {!loading && data && (
            <>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-lg font-semibold">{data.outlet.name}</div>
                <div className="text-sm text-slate-600">
                  {data.outlet.type} | {data.outlet.region_name ?? 'No region'}
                </div>
              </div>
              {data.reports.map((report) => (
                <div key={report.report_id} className="rounded-lg border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">
                    {formatDate(report.report_date)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.promoter_name ?? 'Unknown promoter'} | {report.status}
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2">Sale item</th>
                          <th className="py-2">Qty</th>
                          <th className="py-2">Match</th>
                          <th className="py-2">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.sales.map((sale) => (
                          <tr key={sale.id} className="border-t border-slate-100">
                            <td className="py-2">{sale.product_name_raw}</td>
                            <td className="py-2">{sale.quantity ?? '—'}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${matchBadgeClass(
                                  sale.match_type,
                                )}`}
                              >
                                {matchLabel(sale.match_type)}
                              </span>
                            </td>
                            <td className="py-2 text-slate-700">
                              {sale.match_confidence != null
                                ? `${Math.round(Number(sale.match_confidence) * 100)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                        {report.sales.length === 0 && (
                          <tr className="border-t border-slate-100">
                            <td className="py-2 text-slate-400" colSpan={4}>
                              No sales items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2">Sample item</th>
                          <th className="py-2">Qty</th>
                          <th className="py-2">Match</th>
                          <th className="py-2">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.samples.map((sample) => (
                          <tr key={sample.id} className="border-t border-slate-100">
                            <td className="py-2">{sample.product_name_raw}</td>
                            <td className="py-2">{sample.quantity ?? '—'}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${matchBadgeClass(
                                  sample.sample_match_type,
                                )}`}
                              >
                                {matchLabel(sample.sample_match_type)}
                              </span>
                            </td>
                            <td className="py-2 text-slate-700">
                              {sample.sample_match_confidence != null
                                ? `${Math.round(Number(sample.sample_match_confidence) * 100)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                        {report.samples.length === 0 && (
                          <tr className="border-t border-slate-100">
                            <td className="py-2 text-slate-400" colSpan={4}>
                              No sample items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {data.reports.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No reports for this outlet and date range.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
