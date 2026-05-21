import { ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LabelList } from 'recharts';

interface ParetoChartProps {
  data: any[];
  title: string;
  dataKey: string;
  nameKey: string;
  limit?: number;
  onBarClick?: (value: string) => void;
}

export default function ParetoChart({ data, title, dataKey, nameKey, limit, onBarClick }: ParetoChartProps) {
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
    <div className="bg-slate-950/40 p-5 rounded-2xl shadow-lg border border-slate-850/60 mb-8 h-96">
      <h2 className="text-base font-bold mb-4 text-slate-100 tracking-tight">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 40, left: 10, bottom: 60 }}>
          <defs>
            <linearGradient id="paretoBarGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="paretoBarGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: '600' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: '600' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            domain={[0, 100]} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', fontSize: 13, fontWeight: '600' }}
            cursor={{ fill: '#1e293b', opacity: 0.2 }}
            formatter={(value: any, name: string) => [
              name === 'Frequency' ? `${value} casings` : `${Number(value).toFixed(1)}%`, 
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ paddingTop: '20px', color: '#e2e8f0', fontSize: '12px', fontWeight: '600' }} 
          />
          <Bar 
            yAxisId="left" 
            dataKey="count" 
            name="Frequency" 
            radius={[6, 6, 0, 0]}
            onClick={(data) => {
              if (onBarClick && data && data.name) {
                onBarClick(data.name);
              }
            }}
            cursor={onBarClick ? "pointer" : "default"}
          >
            {displayData.map((_entry, index) => (
              <Cell 
                key={`pareto-cell-${index}`} 
                fill={index % 2 === 0 ? 'url(#paretoBarGrad1)' : 'url(#paretoBarGrad2)'} 
              />
            ))}
            <LabelList dataKey="count" position="top" fill="#f8fafc" fontSize={13} fontWeight="bold" />
          </Bar>
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="cumulativePercentage" 
            stroke="#f59e0b" 
            strokeWidth={2.5}
            dot={{ fill: '#f59e0b', r: 4, stroke: '#0f172a', strokeWidth: 2 }}
            name="Cumulative %" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
