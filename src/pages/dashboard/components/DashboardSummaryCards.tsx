import { format } from 'date-fns';

interface DashboardSummaryCardsProps {
  summary: {
    totalReports: number;
    totalOutlets: number;
    totalProducts: number;
    flaggedCount: number;
    lastReportDate: string | null;
  };
}

function formatLebaneseDate(date: string | null) {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy');
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const cards = [
    { label: 'Total Reports', value: summary.totalReports },
    { label: 'Total Outlets', value: summary.totalOutlets },
    { label: 'Total Products', value: summary.totalProducts },
    { label: 'Flagged Reports', value: summary.flaggedCount },
    { label: 'Last Report Date', value: formatLebaneseDate(summary.lastReportDate) },
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
