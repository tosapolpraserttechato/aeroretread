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
