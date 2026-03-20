import { PROCESS_NAMES } from '../constants';
import { AlertCircle, RotateCcw, Play, Wrench, XCircle } from 'lucide-react';

interface ProcessFlowProps {
  processInventory: any[];
  onProcessClick: (process: string) => void;
  selectedProcess: string | null;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, glow: string }> = {
  I: { label: 'In Process', color: 'text-green-400', icon: Play, glow: 'shadow-[0_0_15px_rgba(74,222,128,0.2)]' },
  H: { label: 'Hold', color: 'text-yellow-500', icon: AlertCircle, glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
  R: { label: 'Reprocess', color: 'text-slate-300', icon: RotateCcw, glow: 'shadow-[0_0_15px_rgba(203,213,225,0.2)]' },
  T: { label: 'Tech', color: 'text-slate-100', icon: Wrench, glow: 'shadow-[0_0_15px_rgba(248,250,252,0.2)]' },
  J: { label: 'Reject', color: 'text-red-400', icon: XCircle, glow: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]' },
};

export default function ProcessFlow({ processInventory, onProcessClick, selectedProcess }: ProcessFlowProps) {
  const getPrevalentStatus = (p: any) => {
    const statuses = ['I', 'H', 'R', 'T', 'J'];
    let maxVal = -1;
    let prevalent = null;
    
    statuses.forEach(s => {
      if (p[s] > maxVal && p[s] > 0) {
        maxVal = p[s];
        prevalent = s;
      }
    });
    return prevalent;
  };

  const renderProcessCard = (p: any, index: number, actualIndex: number) => {
    const total = p.C + p.H + p.R + p.I + p.T + p.J;
    const isSelected = selectedProcess === p.name;
    const prevalent = getPrevalentStatus(p);
    const config = prevalent ? STATUS_CONFIG[prevalent] : null;
    const Icon = config?.icon;

    return (
      <div key={p.name} className="flex items-center">
        <div
          onClick={() => onProcessClick(p.name)}
          className={`cursor-pointer p-4 rounded-lg border-2 w-32 text-center transition-all relative ${
            isSelected 
              ? 'border-indigo-500 bg-indigo-950 shadow-md' 
              : 'border-slate-700 hover:border-indigo-500 bg-slate-800'
          } ${config?.glow || ''}`}
        >
          <div className="absolute top-1 left-2 text-xs font-bold text-slate-500">{actualIndex + 1}</div>
          {Icon && (
            <div className={`absolute top-1 right-2 ${config.color}`}>
              <Icon size={12} />
            </div>
          )}
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
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8">
      <h2 className="text-lg font-semibold mb-6 text-slate-100">Aero Retread Process Flow</h2>
      <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
        {processInventory.slice(0, 7).map((p, index) => renderProcessCard(p, index, index))}
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {processInventory.slice(7).map((p, index) => renderProcessCard(p, index, index + 7))}
      </div>
    </div>
  );
}
