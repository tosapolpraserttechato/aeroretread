import { PROCESS_NAMES, PROCESS_ICONS, PROCESS_COLORS } from '../constants';
import { AlertCircle, RotateCcw, Play, Wrench, XCircle } from 'lucide-react';

interface ProcessFlowProps {
  processInventory: any[];
  onProcessClick: (process: string) => void;
  selectedProcess: string | null;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  I: { label: 'In Process', color: 'text-green-400', icon: Play, bg: 'bg-green-500/10' },
  H: { label: 'Hold', color: 'text-yellow-500', icon: AlertCircle, bg: 'bg-yellow-500/10' },
  R: { label: 'Reprocess', color: 'text-amber-500', icon: RotateCcw, bg: 'bg-amber-500/10' },
  T: { label: 'Tech', color: 'text-slate-300', icon: Wrench, bg: 'bg-slate-500/10' },
  J: { label: 'Reject', color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10' },
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
    
    const ProcIcon = PROCESS_ICONS[p.name];
    const colorCfg = PROCESS_COLORS[p.name] || { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };

    // Card border and background styles
    let cardStyle = 'border-slate-800 hover:border-slate-750 hover:bg-slate-850/80 bg-slate-900/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/20';
    if (isSelected) {
      cardStyle = 'border-indigo-500 bg-slate-900/90 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/30';
    }

    return (
      <div key={p.name} className="flex items-center">
        <div
          onClick={() => onProcessClick(p.name)}
          className={`cursor-pointer p-4 rounded-xl border w-40 text-center transition-all duration-300 relative group select-none ${cardStyle}`}
        >
          {/* Process step index badge */}
          <div className="absolute top-2 left-2 text-[9px] font-black text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/40">
            {String(actualIndex + 1).padStart(2, '0')}
          </div>
          
          {/* Status pill in the top right corner if there are tires and a status */}
          {total > 0 && config ? (
            <div className={`absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-slate-800/50 text-[8px] font-bold ${config.color}`}>
              <span className="h-1 w-1 rounded-full bg-current animate-pulse"></span>
              <span>{config.label}</span>
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/30 px-1.5 py-0.5 rounded-full border border-slate-900/20 text-[8px] font-bold text-slate-600">
              Empty
            </div>
          )}

          {/* Process Icon Container */}
          <div className="flex justify-center mt-5 mb-2">
            <div className={`p-2.5 rounded-xl border transition-all duration-300 ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(var(--tw-shadow-color),0.2)]`} style={{ '--tw-shadow-color': 'currentcolor' } as any}>
              {ProcIcon ? <ProcIcon size={20} className="stroke-[2.25]" /> : <Wrench size={20} />}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-100 line-clamp-1 leading-tight text-center tracking-wide" title={p.fullName}>
            {p.fullName}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mb-1 text-center font-mono">{p.name}</div>

          <div className="flex flex-col items-center justify-center my-3 bg-slate-950/40 py-2 rounded-lg border border-slate-850/50">
            <span className="text-2xl font-black text-slate-50 leading-none tracking-tight">{total}</span>
            <span className="text-[9px] mt-1 text-slate-500 uppercase tracking-widest font-extrabold">Tires</span>
          </div>

          <div className="grid grid-cols-5 gap-0.5 text-[9px] font-bold text-slate-400 border-t border-slate-850/80 pt-2 font-mono">
            <div title="In Process (I)" className="text-green-400 bg-green-500/5 py-0.5 rounded-sm">{p.I}</div>
            <div title="Hold (H)" className="text-yellow-500 bg-yellow-500/5 py-0.5 rounded-sm">{p.H}</div>
            <div title="Reprocess (R)" className="text-amber-500 bg-amber-500/5 py-0.5 rounded-sm">{p.R}</div>
            <div title="Tech (T)" className="text-slate-300 bg-slate-500/5 py-0.5 rounded-sm">{p.T}</div>
            <div title="Reject (J)" className="text-red-400 bg-red-500/5 py-0.5 rounded-sm">{p.J}</div>
          </div>
        </div>
        {actualIndex < processInventory.length - 1 && (
          <div className="mx-1 text-slate-700 animate-pulse font-extrabold select-none">➜</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl shadow-xl border border-slate-850 mb-8 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">Aero Retread Process Flow</h2>
          <p className="text-slate-400 text-xs mt-0.5">Visual shop floor flow and real-time inventory counts</p>
        </div>
        <div className="text-[10px] text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850 font-bold uppercase tracking-wider">
          Sequence 1 to 13
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-center justify-center mb-5">
        {processInventory.slice(0, 7).map((p, index) => renderProcessCard(p, index, index))}
      </div>
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {processInventory.slice(7).map((p, index) => renderProcessCard(p, index, index + 7))}
      </div>
    </div>
  );
}
