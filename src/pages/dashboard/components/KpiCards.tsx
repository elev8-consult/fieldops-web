import type { PromoterDashboardSummaryResponse } from '@/types';

interface KpiCardsProps {
  summary?: PromoterDashboardSummaryResponse;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const cards = [
    { label: 'Outlets Visited', value: summary?.outlets_visited ?? 0 },
    { label: 'Reports', value: summary?.reports_count ?? 0 },
    { label: 'Qty Sold', value: summary?.qty_sold ?? 0 },
    { label: 'Qty Gifts', value: summary?.qty_gifts ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-slate-500">{card.label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
