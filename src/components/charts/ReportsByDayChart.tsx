import { format, parseISO } from 'date-fns';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ReportDayPoint {
  day: string;
  merchandiser: number;
  promoter: number;
}

export interface ReportsByDayChartProps {
  data: ReportDayPoint[];
  loading?: boolean;
}

export function ReportsByDayChart({ data, loading }: ReportsByDayChartProps) {
  const chartData = [...data]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((row) => ({
      ...row,
      label: (() => {
        try {
          return format(parseISO(row.day.slice(0, 10)), 'MMM d');
        } catch {
          return row.day;
        }
      })(),
    }));

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400">
        Loading chart…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="merchandiser"
          name="Merchandiser"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="promoter"
          name="Promoter"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
