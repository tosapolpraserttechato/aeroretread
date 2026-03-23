import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PROCESS_NAMES } from '../constants';
import { ProcessInventoryCounts } from '../types';

interface InventoryChartProps {
  processInventory: ProcessInventoryCounts[];
  visibleStatuses: Record<string, boolean>;
  toggleStatus: (status: string) => void;
  setSelectedProcess: (process: string) => void;
}

export default function InventoryChart({ processInventory, visibleStatuses, toggleStatus, setSelectedProcess }: InventoryChartProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8 h-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Inventory by Process & Status</h2>
        <div className="flex gap-2">
          {Object.entries({ H: 'Hold', R: 'Reprocess', I: 'In Process', T: 'Tech', J: 'Reject' }).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${visibleStatuses[key] ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processInventory} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} onClick={(data) => {
          if (data && data.activeLabel) {
            const initial = Object.keys(PROCESS_NAMES).find(key => PROCESS_NAMES[key] === data.activeLabel);
            if (initial) setSelectedProcess(initial);
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="fullName" tick={{ fontSize: 8, fill: '#94a3b8' }} height={80} interval={0} dy={15} />
          <YAxis tick={{ fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '20px', color: '#94a3b8', cursor: 'pointer' }}
            onClick={(props: any) => {
              const statusMap: Record<string, string> = {
                'Hold (H)': 'H',
                'Reprocess (R)': 'R',
                'In Process (I)': 'I',
                'Tech (T)': 'T',
                'Reject (J)': 'J'
              };
              const statusKey = statusMap[props.value];
              if (statusKey) {
                toggleStatus(statusKey);
              }
            }}
          />
          {visibleStatuses.H && (
            <Bar dataKey="H" stackId="a" fill="#eab308" name="Hold (H)">
              {processInventory.map((entry, index) => (
                <Cell key={`cell-${index}`} stroke="#000" strokeWidth={1} />
              ))}
            </Bar>
          )}
          {visibleStatuses.R && <Bar dataKey="R" stackId="a" fill="#a16207" name="Reprocess (R)" />}
          {visibleStatuses.I && <Bar dataKey="I" stackId="a" fill="#16a34a" name="In Process (I)" />}
          {visibleStatuses.T && <Bar dataKey="T" stackId="a" fill="#f8fafc" name="Tech (T)" />}
          {visibleStatuses.J && <Bar dataKey="J" stackId="a" fill="#dc2626" name="Reject (J)" />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
