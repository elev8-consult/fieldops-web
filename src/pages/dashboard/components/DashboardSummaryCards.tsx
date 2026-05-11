import { format } from 'date-fns';

interface DashboardSummaryCardsProps {
  summary: {
    outlets_visited: number;
    total_items_counted: number;
    unmatched_products: number;
    reports_pending_review: number;
    last_report_at: string | null;
  };
}

function formatLebaneseDate(date: string | null) {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const cards = [
    { label: 'Outlets Visited', value: summary.outlets_visited },
    { label: 'Total Items Counted', value: summary.total_items_counted },
    { label: 'Unmatched Products', value: summary.unmatched_products },
    { label: 'Pending Review Reports', value: summary.reports_pending_review },
    { label: 'Last Report Date', value: formatLebaneseDate(summary.last_report_at) },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
