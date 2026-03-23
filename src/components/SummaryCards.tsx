import React from 'react';
import { ProcessInventoryCounts } from '../types';

interface SummaryCardsProps {
  totalInventory: number;
  processInventory: ProcessInventoryCounts[];
  statusCounts: {
    C: number;
    R: number;
    I: number;
    T: number;
    J: number;
    H: number;
  };
}

export default function SummaryCards({ totalInventory, processInventory, statusCounts }: SummaryCardsProps) {
  const getProcessTotal = (name: string) => {
    const p = processInventory.find(item => item.name === name);
    return p ? (p.C + p.H + p.R + p.I + p.T + p.J) : 0;
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-slate-200">INVENTORY SUMMARY</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Total Inventory</h2>
          <p className="text-4xl font-semibold text-slate-100">{totalInventory}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Casing ready to buff</h2>
          <p className="text-4xl font-semibold text-slate-100">
            {getProcessTotal('HOT')}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Green tire inventory</h2>
          <p className="text-4xl font-semibold text-slate-100">
            {getProcessTotal('ORB')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-xs font-medium text-slate-400 uppercase">Hold (H)</h2>
          <p className="text-2xl font-semibold text-yellow-500">{statusCounts.H}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-xs font-medium text-slate-400 uppercase">Reprocess (R)</h2>
          <p className="text-2xl font-semibold text-slate-300">{statusCounts.R}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-xs font-medium text-slate-400 uppercase">In Process (I)</h2>
          <p className="text-2xl font-semibold text-green-400">{statusCounts.I}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-xs font-medium text-slate-400 uppercase">Tech (T)</h2>
          <p className="text-2xl font-semibold text-slate-100">{statusCounts.T}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-xs font-medium text-slate-400 uppercase">Reject (J)</h2>
          <p className="text-2xl font-semibold text-red-400">{statusCounts.J}</p>
        </div>
      </div>
    </>
  );
}
