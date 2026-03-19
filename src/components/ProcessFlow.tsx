import { PROCESS_NAMES } from '../constants';

interface ProcessFlowProps {
  processInventory: any[];
  onProcessClick: (process: string) => void;
  selectedProcess: string | null;
}

export default function ProcessFlow({ processInventory, onProcessClick, selectedProcess }: ProcessFlowProps) {
  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8">
      <h2 className="text-lg font-semibold mb-6 text-slate-100">Aero Retread Process Flow</h2>
      <div className="flex flex-wrap gap-2 items-center justify-center mb-2">
        {processInventory.slice(0, 7).map((p, index) => {
          const total = p.C + p.H + p.R + p.I + p.T + p.J;
          const isSelected = selectedProcess === p.name;
          return (
            <div key={p.name} className="flex items-center">
              <div
                onClick={() => onProcessClick(p.name)}
                className={`cursor-pointer p-4 rounded-lg border-2 w-32 text-center transition-all relative ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-950 shadow-md' 
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-800'
                }`}
              >
                <div className="absolute top-1 left-2 text-xs font-bold text-slate-500">{index + 1}</div>
                <div className="text-xs font-bold text-indigo-200 mb-1 line-clamp-2 leading-tight" title={p.fullName}>{p.fullName}</div>
                <div className="text-xl font-bold text-slate-100 mb-2">{total}</div>
                <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-400">
                  <div title="In Process" className="text-green-400">{p.I}</div>
                  <div title="Hold" className="text-yellow-500">{p.H}</div>
                  <div title="Reprocess" className="text-slate-300">{p.R}</div>
                  <div title="Tech" className="text-slate-100">{p.T}</div>
                  <div title="Reject" className="text-red-400">{p.J}</div>
                </div>
              </div>
              {index < 6 && (
                <div className="mx-1 text-2xl text-slate-600">→</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {processInventory.slice(7).map((p, index) => {
          const total = p.C + p.H + p.R + p.I + p.T + p.J;
          const isSelected = selectedProcess === p.name;
          const actualIndex = index + 7;
          return (
            <div key={p.name} className="flex items-center">
              <div
                onClick={() => onProcessClick(p.name)}
                className={`cursor-pointer p-4 rounded-lg border-2 w-32 text-center transition-all relative ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-950 shadow-md' 
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-800'
                }`}
              >
                <div className="absolute top-1 left-2 text-xs font-bold text-slate-500">{actualIndex + 1}</div>
                <div className="text-xs font-bold text-indigo-200 mb-1 line-clamp-2 leading-tight" title={p.fullName}>{p.fullName}</div>
                <div className="text-xl font-bold text-slate-100 mb-2">{total}</div>
                <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-400">
                  <div title="In Process" className="text-green-400">{p.I}</div>
                  <div title="Hold" className="text-yellow-500">{p.H}</div>
                  <div title="Reprocess" className="text-slate-300">{p.R}</div>
                  <div title="Tech" className="text-slate-100">{p.T}</div>
                  <div title="Reject" className="text-red-400">{p.J}</div>
                </div>
              </div>
              {actualIndex < processInventory.length - 1 && (
                <div className="mx-1 text-2xl text-slate-600">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
