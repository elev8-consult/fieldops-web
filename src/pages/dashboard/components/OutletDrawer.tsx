import { Button } from '@/components/ui/Button';
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
                  <div className="font-semibold text-slate-900">{report.report_date}</div>
                  <div className="text-sm text-slate-600">
                    {report.promoter_name ?? 'Unknown promoter'} | {report.status}
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
