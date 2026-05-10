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
          value={filters.brandId}
          onValueChange={(brandId) => onFiltersChange({ ...filters, brandId })}
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
          value={filters.dateFrom ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateFrom: e.target.value })
          }
        />

        <Input
          label="Date To"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
        />

        <Select
          label="Status"
          value={filters.status ?? 'approved'}
          onValueChange={(status) =>
            onFiltersChange({
              ...filters,
              status: status as MerchandiserDashboardParams['status'],
            })
          }
        >
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
          <option value="all">All</option>
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
