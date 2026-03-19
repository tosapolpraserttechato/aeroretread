import { PROCESS_NAMES } from '../constants';

interface ProcessFlowProps {
  processInventory: any[];
  onProcessClick: (process: string) => void;
  selectedProcess: string | null;
}

export default function ProcessFlow({ processInventory, onProcessClick, selectedProcess }: ProcessFlowProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <h2 className="text-lg font-semibold mb-6">Aero Retread Process Flow</h2>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {processInventory.map((p, index) => {
          const total = p.C + p.H + p.R + p.I + p.T + p.J;
          const isSelected = selectedProcess === p.name;
          return (
            <div key={p.name} className="flex items-center">
              <div
                onClick={() => onProcessClick(p.name)}
                className={`cursor-pointer p-4 rounded-lg border-2 w-32 text-center transition-all relative ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50'
                }`}
              >
                <div className="absolute top-1 left-2 text-xs font-bold text-slate-400">{index + 1}</div>
                <div className="font-mono font-bold text-indigo-800 mb-1">{p.name}</div>
                <div className="text-xs text-slate-500 mb-2 truncate" title={p.fullName}>{p.fullName}</div>
                <div className="text-2xl font-bold text-slate-900">{total}</div>
              </div>
              {index < processInventory.length - 1 && (
                <div className="mx-1 text-slate-300">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
