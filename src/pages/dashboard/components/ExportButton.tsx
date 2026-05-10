import { Button } from '@/components/ui/Button';
import type {
  PromoterDashboardGridResponse,
  PromoterDashboardSummaryResponse,
} from '@/types';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  brandName: string;
  dateFrom: string;
  dateTo: string;
  grid?: PromoterDashboardGridResponse;
  summary?: PromoterDashboardSummaryResponse;
}

export function ExportButton({
  brandName,
  dateFrom,
  dateTo,
  grid,
  summary,
}: ExportButtonProps) {
  const onExport = () => {
    if (!grid) return;

    const rows: Array<Array<string | number>> = [];
    rows.push([`${brandName} | ${dateFrom} -> ${dateTo}`]);

    const headers = ['Outlet'];
    for (const product of grid.products) {
      headers.push(product.canonical_name);
    }
    headers.push('Palette', 'Gifts', 'Total');
    rows.push(headers);

    for (const row of grid.rows) {
      const line: Array<string | number> = [row.outlet_name];
      for (const product of grid.products) {
        const value = grid.dates.reduce(
          (sum, date) => sum + (row.cells[date]?.[product.id] ?? 0),
          0,
        );
        line.push(value);
      }
      const palette = grid.dates.reduce((sum, date) => sum + (row.palette[date] ?? 0), 0);
      const gifts = grid.dates.reduce((sum, date) => sum + (row.gifts[date] ?? 0), 0);
      line.push(palette, gifts, row.row_total);
      rows.push(line);
    }

    const totalRow: Array<string | number> = ['Total'];
    for (const product of grid.products) {
      totalRow.push(grid.column_totals[product.id] ?? 0);
    }
    totalRow.push(
      grid.column_totals.palette ?? 0,
      grid.column_totals.gifts ?? 0,
      grid.column_totals.grand_total ?? 0,
    );
    rows.push(totalRow);

    if (summary) {
      rows.push([]);
      rows.push([
        'Summary',
        `Outlets visited: ${summary.outlets_visited}`,
        `Reports: ${summary.reports_count ?? 0}`,
        `Qty sold: ${summary.qty_sold ?? 0}`,
        `Qty gifts: ${summary.qty_gifts ?? 0}`,
      ]);
    }

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = headers.map((_, index) => ({ wch: index === 0 ? 30 : 14 }));
    // Audit fix: export mirrors the dashboard layout with product columns and final totals row.
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Promoter Dashboard');
    XLSX.writeFile(workbook, `promoter-dashboard-${dateFrom}-${dateTo}.xlsx`);
  };

  return (
    <Button
      variant="secondary"
      disabled={!grid}
      leftIcon={<Download className="h-4 w-4" />}
      onClick={onExport}
    >
      Export Excel
    </Button>
  );
}
