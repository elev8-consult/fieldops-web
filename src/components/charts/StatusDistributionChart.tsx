import { STATUS_LABELS } from '@/lib/constants';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  draft: '#94a3b8',
  flagged: '#f59e0b',
  pending_review: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
  parsed: '#22c55e',
};

export interface StatusSlice {
  status: string;
  count: number;
}

export interface StatusDistributionChartProps {
  data: StatusSlice[];
  loading?: boolean;
}

export function StatusDistributionChart({
  data,
  loading,
}: StatusDistributionChartProps) {
  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    status: d.status,
  }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.status}
              fill={COLORS[entry.status] ?? '#6366f1'}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
