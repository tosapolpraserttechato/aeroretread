import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

interface ParetoChartProps {
  data: any[];
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 h-96">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} />
          <Tooltip 
            formatter={(value: any, name: string) => [
              name === 'Frequency' ? value : `${Number(value).toFixed(1)}%`, 
              name
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="count" fill="#57534e" name="Frequency" />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#b45309" name="Cumulative %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
