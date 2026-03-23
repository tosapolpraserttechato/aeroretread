import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { RetreadData } from '../types';

interface ParetoChartProps {
  data: RetreadData[];
  title: string;
  dataKey: string;
  nameKey: string;
  limit?: number;
}

export default function ParetoChart({ data, title, dataKey, nameKey, limit }: ParetoChartProps) {
  if (data.length === 0) return null;

  const counts: Record<string, number> = {};
  data.forEach(item => {
    const key = item[dataKey] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  const sortedData = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalCount = data.length;
  let cumulativeCount = 0;
  const paretoData = sortedData.map(item => {
    cumulativeCount += item.count;
    return {
      ...item,
      percentage: ((item.count / totalCount) * 100).toFixed(1),
      cumulativePercentage: (cumulativeCount / totalCount) * 100
    };
  });

  const displayData = limit ? paretoData.slice(0, limit) : paretoData;

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8 h-96">
      <h2 className="text-lg font-semibold mb-4 text-slate-100">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
          <YAxis yAxisId="left" orientation="left" stroke="#94a3b8" />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            formatter={(value: any, name: string) => [
              name === 'Frequency' ? value : `${Number(value).toFixed(1)}%`, 
              name
            ]}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
          <Bar yAxisId="left" dataKey="count" fill="#6366f1" name="Frequency" />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#f59e0b" name="Cumulative %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
