import { Button } from '@/components/ui/Button';
import type { Brand, Outlet, PromoterDashboardParams, User } from '@/types';

export interface PromoterDashboardFiltersState {
  brand_id: string;
  date_from: string;
  date_to: string;
  status?: PromoterDashboardParams['status'];
  outlet_id?: string;
  reported_by?: string;
}

interface DashboardFiltersProps {
  brands: Brand[];
  outlets: Outlet[];
  promoters: User[];
  filters: PromoterDashboardFiltersState;
  isBrandManager: boolean;
  onChange: (next: PromoterDashboardFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function DashboardFilters({
  brands,
  outlets,
  promoters,
  filters,
  isBrandManager,
  onChange,
  onApply,
  onReset,
}: DashboardFiltersProps) {
  const selectedStatuses = filters.status ?? [];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.brand_id}
            disabled={isBrandManager}
            onChange={(event) => onChange({ ...filters, brand_id: event.target.value })}
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Date From</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.date_from}
            onChange={(event) => onChange({ ...filters, date_from: event.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Date To</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.date_to}
            onChange={(event) => onChange({ ...filters, date_to: event.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Outlet</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.outlet_id ?? ''}
            onChange={(event) =>
              onChange({ ...filters, outlet_id: event.target.value || undefined })
            }
          >
            <option value="">All outlets</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Promoter</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.reported_by ?? ''}
            onChange={(event) =>
              onChange({ ...filters, reported_by: event.target.value || undefined })
            }
          >
            <option value="">All promoters</option>
            {promoters.map((promoter) => (
              <option key={promoter.id} value={promoter.id}>
                {promoter.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
          <select
            multiple
            className="h-[42px] w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={selectedStatuses}
            onChange={(event) => {
              const values = Array.from(event.target.selectedOptions).map((item) => item.value);
              onChange({
                ...filters,
                status:
                  values.length > 0
                    ? (values as NonNullable<PromoterDashboardParams['status']>)
                    : undefined,
              });
            }}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={onApply}>Apply</Button>
        <Button variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
