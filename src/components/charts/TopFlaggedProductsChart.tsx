import type { TopFlaggedProductRow } from '@/types';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TopFlaggedProductsChartProps {
  data: TopFlaggedProductRow[];
  loading?: boolean;
}

export function TopFlaggedProductsChart({
  data,
  loading,
}: TopFlaggedProductsChartProps) {
  const chartData = [...data]
    .slice(0, 8)
    .map((row) => ({
      name:
        row.productNameRaw.length > 28
          ? `${row.productNameRaw.slice(0, 28)}…`
          : row.productNameRaw,
      count: row.count,
    }))
    .reverse();

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11 }}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
