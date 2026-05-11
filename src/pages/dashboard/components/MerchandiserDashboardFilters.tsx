import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Brand, MerchandiserDashboardParams } from '@/types';

interface MerchandiserDashboardFiltersProps {
  brands: Brand[];
  filters: MerchandiserDashboardParams;
  onFiltersChange: (next: MerchandiserDashboardParams) => void;
  onApply: () => void;
  onReset: () => void;
  isBrandManager: boolean;
}

export function MerchandiserDashboardFilters({
  brands,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isBrandManager,
}: MerchandiserDashboardFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Select
          label="Brand"
          value={filters.brand_id ?? ''}
          onValueChange={(brand_id) => onFiltersChange({ ...filters, brand_id })}
          disabled={isBrandManager}
        >
          <option value="">Select brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>

        <Input
          label="Date From"
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, date_from: e.target.value })
          }
        />

        <Input
          label="Date To"
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
        />

        <Select
          label="Status"
          value={filters.status?.[0] ?? 'approved'}
          onValueChange={(status) =>
            onFiltersChange({
              ...filters,
              status: [status],
            })
          }
        >
          <option value="approved">Approved</option>
          <option value="pending_review">Pending review</option>
          <option value="rejected">Rejected</option>
        </Select>

        <div className="flex items-end gap-2">
          <Button className="w-full" onClick={onApply}>
            Apply
          </Button>
          <Button className="w-full" variant="secondary" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
