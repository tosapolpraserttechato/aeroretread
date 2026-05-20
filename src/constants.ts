import { 
  Wind, 
  Scan, 
  Thermometer, 
  Disc, 
  Wrench, 
  Layers, 
  RotateCw, 
  Flame, 
  ShieldCheck, 
  Eye, 
  Gauge, 
  CheckCircle2, 
  ClipboardCheck 
} from 'lucide-react';

export const PROCESS_NAMES: Record<string, string> = {
  INI: "PRE-AIR",
  HO1: "PRE-SDS",
  HOT: "HOT HOUSE",
  BUF: "BUFFING",
  REP: "REPAIRING",
  BLD: "BUILDING",
  ORB: "ORBITREAD",
  CUR: "CURING",
  "Q-C": "QA CURE",
  HO2: "POST-SDS",
  INJ: "POST-AIR",
  FIN: "FF",
  "Q-F": "QA FF"
};

export const processHeaders = Object.keys(PROCESS_NAMES);

export const PROCESS_ICONS: Record<string, any> = {
  INI: Wind,
  HO1: Scan,
  HOT: Thermometer,
  BUF: Disc,
  REP: Wrench,
  BLD: Layers,
  ORB: RotateCw,
  CUR: Flame,
  "Q-C": ShieldCheck,
  HO2: Eye,
  INJ: Gauge,
  FIN: CheckCircle2,
  "Q-F": ClipboardCheck
};

export const PROCESS_COLORS: Record<string, { text: string, bg: string, border: string }> = {
  INI: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  HO1: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  HOT: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  BUF: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  REP: { text: 'text-orange-455', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  BLD: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ORB: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
  CUR: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  "Q-C": { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  HO2: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  INJ: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  FIN: { text: 'text-emerald-355', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  "Q-F": { text: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20' }
};
