import { PROCESS_NAMES } from '../constants';
import { AlertCircle, RotateCcw, Play, Wrench, XCircle } from 'lucide-react';

interface ProcessFlowProps {
  processInventory: any[];
  onProcessClick: (process: string) => void;
  selectedProcess: string | null;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, glow: string }> = {
  I: { label: 'In Process', color: 'text-green-400', icon: Play, glow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)]' },
  H: { label: 'Hold', color: 'text-yellow-500', icon: AlertCircle, glow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]' },
  R: { label: 'Reprocess', color: 'text-slate-300', icon: RotateCcw, glow: 'shadow-[0_0_15px_rgba(203,213,225,0.15)]' },
  T: { label: 'Tech', color: 'text-slate-100', icon: Wrench, glow: 'shadow-[0_0_15px_rgba(248,250,252,0.15)]' },
  J: { label: 'Reject', color: 'text-red-400', icon: XCircle, glow: 'shadow-[0_0_15px_rgba(248,113,113,0.15)]' },
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

    // Card border and background styles
    let cardStyle = 'border-slate-700 hover:border-indigo-500 bg-slate-800';
    if (isSelected) {
      cardStyle = 'border-indigo-500 bg-indigo-950/80 shadow-lg';
    }

    return (
      <div key={p.name} className="flex items-center">
        <div
          onClick={() => onProcessClick(p.name)}
          className={`cursor-pointer p-4 rounded-lg border-2 w-36 text-center transition-all relative ${cardStyle}`}
        >
          <div className="absolute top-1 left-2 text-xs font-bold text-slate-500">{actualIndex + 1}</div>
          
          <div className={`absolute top-1 right-2 ${config?.color || 'text-slate-400'}`}>
            {Icon && <Icon size={12} />}
          </div>

          <div className="text-xs font-bold text-indigo-200 mt-2 mb-1 line-clamp-2 leading-tight h-8 flex items-center justify-center" title={p.fullName}>
            {p.fullName}
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            <span className="text-2xl font-black text-slate-100 leading-none">{total}</span>
            <span className="text-[10px] mt-1 text-slate-500">Tires</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-slate-400 border-t border-slate-700/50 pt-2">
            <div title="In Process" className="text-green-400">{p.I}</div>
            <div title="Hold" className="text-yellow-500">{p.H}</div>
            <div title="Reprocess" className="text-slate-355">{p.R}</div>
            <div title="Tech" className="text-slate-200">{p.T}</div>
            <div title="Reject" className="text-red-400">{p.J}</div>
          </div>
        </div>
        {actualIndex < processInventory.length - 1 && (
          <div className="mx-1.5 text-xl font-bold text-slate-700">→</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-100">Aero Retread Process Flow</h2>
        <p className="text-slate-400 text-xs mt-0.5">Visual shop floor flow and real-time inventory counts</p>
      </div>
      <div className="flex flex-wrap gap-2.5 items-center justify-center mb-6">
        {processInventory.slice(0, 8).map((p, index) => renderProcessCard(p, index, index))}
      </div>
      <div className="flex flex-wrap gap-2.5 items-center justify-center">
        {processInventory.slice(8).map((p, index) => renderProcessCard(p, index, index + 8))}
      </div>
    </div>
  );
}
