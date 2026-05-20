import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, LineChart, Line, AreaChart, Area } from 'recharts';
import Papa from 'papaparse';
import { retreadData } from '../data/retreadData';
import { PROCESS_NAMES, processHeaders } from '../constants';
import ProcessFlow from './ProcessFlow';
import ParetoChart from './ParetoChart';
import { 
  Upload, Sparkles, Filter, Eye, EyeOff, Sliders, 
  BarChart2, ShieldAlert, CheckCircle2, AlertTriangle, 
  Clock, ArrowRight, Table, ChevronDown, RefreshCw, Layers, Info, Search, Download, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, History, Activity, TrendingUp
} from 'lucide-react';

export interface DailyLog {
  fileName: string;
  timestamp: number;
  data: any[];
}

export default function Dashboard() {
  function processData(rawData: any[]) {
    if (!rawData || rawData.length === 0) return [];

    // 1. Trim headers and create new objects with trimmed keys
    const trimmedData = rawData.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim()] = row[key];
      });
      return newRow;
    });

    const columnsToFill = ["MATERIAL", "SIZE", "CUSTOMER", "AIRLINE"];
    const lastValues: Record<string, any> = {};
    
    return trimmedData.map((row, idx) => {
      const processedRow = { ...row };
      
      // 2. Forward Fill
      columnsToFill.forEach((col) => {
        const val = processedRow[col];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          lastValues[col] = val;
        } else if (lastValues[col] !== undefined) {
          processedRow[col] = lastValues[col];
        }
      });

      // 3. Data Formatting (Remove .0 from MATERIAL and CUSTOMER)
      ["MATERIAL", "CUSTOMER"].forEach(col => {
        if (processedRow[col] !== undefined && processedRow[col] !== null) {
          let val = String(processedRow[col]);
          if (val.endsWith(".0")) {
            processedRow[col] = val.slice(0, -2);
          }
        }
      });

      // 4. Determine current process and derive STAT if not already present
      let currentProcess = null;
      for (let i = processHeaders.length - 1; i >= 0; i--) {
        const proc = processHeaders[i];
        const status = processedRow[proc];
        if (status === 'C' || status === 'H') {
          currentProcess = proc;
          break;
        }
      }
      if (!currentProcess) {
        for (let i = processHeaders.length - 1; i >= 0; i--) {
          const proc = processHeaders[i];
          if (processedRow[proc] !== undefined && String(processedRow[proc]).trim() !== "") {
            currentProcess = proc;
            break;
          }
        }
      }
      if (!currentProcess) {
        currentProcess = processHeaders[0];
      }

      processedRow["CURRENT_PROCESS"] = PROCESS_NAMES[currentProcess] || currentProcess;

      if (!processedRow["STAT"]) {
        let derivedStat = "I"; // Default
        const val = String(processedRow[currentProcess] || "").trim();
        if (val === "C") {
          derivedStat = "I";
        } else if (["H", "R", "I", "T", "J"].includes(val)) {
          derivedStat = val;
        }
        processedRow["STAT"] = derivedStat;
      }

      // Find actual reason in the row if present under common names
      const reasonKey = Object.keys(processedRow).find(k => 
        ["REASON", "REJECT_REASON", "HOLD_REASON", "DEFECT_REASON", "COMMENT", "REMARKS", "DISPOSITION", "HOLD_REJECT_REASON"].includes(k.toUpperCase())
      );
      if (reasonKey && processedRow[reasonKey] !== undefined && processedRow[reasonKey] !== null && String(processedRow[reasonKey]).trim() !== "") {
        processedRow["HOLD_REJECT_REASON"] = String(processedRow[reasonKey]).trim();
      } else {
        processedRow["HOLD_REJECT_REASON"] = "N/A";
      }

      // 5. Calculate or simulate Days in Process
      let days = 0;
      const dateKey = Object.keys(processedRow).find(k => 
        ["DATE", "REC_DATE", "RECEIVE_DATE", "START_DATE", "TIMESTAMP", "ENTRY_DATE"].includes(k.toUpperCase())
      );
      
      if (dateKey && processedRow[dateKey]) {
        const entryDate = new Date(processedRow[dateKey]);
        if (!isNaN(entryDate.getTime())) {
          const diffTime = Math.abs(new Date().getTime() - entryDate.getTime());
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          days = simulateDays(processedRow, idx);
        }
      } else if (processedRow["DAYS_IN_PROCESS"] !== undefined) {
        days = parseInt(processedRow["DAYS_IN_PROCESS"]) || 0;
      } else if (processedRow["DAYS"] !== undefined) {
        days = parseInt(processedRow["DAYS"]) || 0;
      } else {
        days = simulateDays(processedRow, idx);
      }

      processedRow["DAYS_IN_PROCESS"] = days;

      return processedRow;
    });
  }

  function simulateDays(row: any, index: number) {
    const status = row["STAT"] || "I";
    const seed = (index * 13 + (parseInt(row["MATERIAL"]) || 0)) % 10;
    
    if (status === 'H') {
      return 10 + seed; // 10 to 19 days
    } else if (status === 'J') {
      return 12 + seed; // 12 to 21 days
    } else if (status === 'R') {
      return 7 + seed;  // 7 to 16 days
    } else if (status === 'T') {
      return 5 + seed;  // 5 to 14 days
    } else {
      return 1 + (seed % 5); // 1 to 5 days
    }
  }

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    try {
      const saved = localStorage.getItem('retread_daily_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });


  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);
  const data = dailyLogs[selectedLogIndex]?.data || [];

  useEffect(() => {
    try {
      localStorage.setItem('retread_daily_logs', JSON.stringify(dailyLogs));
    } catch (e) {
      console.error(e);
    }
  }, [dailyLogs]);

  const [showOnlyAging, setShowOnlyAging] = useState<boolean>(false);

  const handleLoadMockData = () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const day1Data = retreadData.map((row, idx) => {
      const newRow = { ...row };
      newRow["DAYS_IN_PROCESS"] = (idx % 4) + 1;
      return processData([newRow])[0];
    });

    const day2Data = retreadData.map((row, idx) => {
      const newRow = { ...row };
      if (idx % 3 === 0) {
        newRow["BUF"] = "C";
        newRow["REP"] = "C";
        newRow["BLD"] = "I";
      }
      newRow["DAYS_IN_PROCESS"] = (idx % 4) + 2;
      return processData([newRow])[0];
    });

    const day3Data = retreadData.map((row, idx) => {
      const newRow = { ...row };
      if (idx % 3 === 0) {
        newRow["BUF"] = "C";
        newRow["REP"] = "C";
        newRow["BLD"] = "C";
        newRow["ORB"] = "C";
        newRow["CUR"] = "C";
        newRow["Q-C"] = "C";
        newRow["FIN"] = "I";
      } else if (idx % 5 === 0) {
        newRow["BUF"] = "C";
        newRow["REP"] = "C";
        newRow["BLD"] = "C";
        newRow["ORB"] = "C";
        newRow["CUR"] = "H";
      }
      newRow["DAYS_IN_PROCESS"] = (idx % 4) + 3;
      return processData([newRow])[0];
    });

    const logs: DailyLog[] = [
      {
        fileName: "retread_inventory_2026_05_18.csv",
        timestamp: now - 2 * dayMs,
        data: day1Data
      },
      {
        fileName: "retread_inventory_2026_05_19.csv",
        timestamp: now - dayMs,
        data: day2Data
      },
      {
        fileName: "retread_inventory_2026_05_20.csv",
        timestamp: now,
        data: day3Data
      }
    ];

    setDailyLogs(logs);
    setSelectedLogIndex(2);
    setSelectedProcess(null);
    setShowOnlyAging(false);
  };

  const handleClearAllData = () => {
    setDailyLogs([]);
    setSelectedLogIndex(0);
    setSelectedProcess(null);
    setShowOnlyAging(false);
  };

  const [searchBarcode, setSearchBarcode] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const getTireHistory = React.useCallback((queryStr: string) => {
    if (!queryStr) return [];
    const query = queryStr.trim().toUpperCase();
    return dailyLogs.map(log => {
      const tire = log.data.find(row => {
        // Try exact match on common serial/barcode/workorder columns first
        const idKeys = ['BARCODE', 'SER_NO', 'SERIAL', 'SERIAL_NO', 'SERIAL_NUMBER', 'TIRE_ID', 'TIRE_NO', 'TIRE_NUMBER', 'MATERIAL', 'WORK_ORDER', 'WORK ORDER', 'WO'];
        for (const key of idKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            if (String(row[key]).trim().toUpperCase() === query) {
              return true;
            }
          }
        }
        // Fallback: Check all fields in the row
        return Object.keys(row).some(key => {
          const val = row[key];
          if (val === undefined || val === null || typeof val === 'object') return false;
          return String(val).trim().toUpperCase() === query;
        });
      });
      return {
        timestamp: log.timestamp,
        date: new Date(log.timestamp).toLocaleDateString() + ' ' + new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        fileName: log.fileName,
        tire: tire || null
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [dailyLogs]);

  const trackerResults = React.useMemo(() => {
    return getTireHistory(searchBarcode);
  }, [searchBarcode, getTireHistory]);

  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [tableViewMode, setTableViewMode] = useState<'summary' | 'matrix'>('summary');

  const getTableHeaders = (sampleRow: any) => {
    if (!sampleRow) return [];
    if (tableViewMode === 'summary') {
      const coreKeys = ['BARCODE', 'WORK_ORDER', 'WORK ORDER', 'MATERIAL', 'SIZE', 'CUSTOMER', 'AIRLINE', 'CURRENT_PROCESS', 'DAYS_IN_PROCESS', 'STAT'];
      return coreKeys.filter(key => key in sampleRow);
    } else {
      return Object.keys(sampleRow).filter(k => k !== 'CURRENT_PROCESS');
    }
  };
  const [paretoKeys, setParetoKeys] = useState<string[]>(["SIZE", "STAT"]);
  const [paretoLimit, setParetoLimit] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison'>('dashboard');

  const STAT_COLORS: Record<string, string> = {
    I: '#10b981', // emerald-500
    H: '#eab308', // yellow-500
    R: '#ea580c', // orange-600
    T: '#64748b', // slate-500
    J: '#ef4444', // red-500
    OTHER: '#475569' // slate-600
  };

  const STAT_LABELS: Record<string, string> = {
    I: 'In Process',
    H: 'Hold',
    R: 'Reprocess',
    T: 'Tech',
    J: 'Reject',
    OTHER: 'Other'
  };

  // --- Comparison Analytics Logic ---
  const comparisonData = React.useMemo(() => {
    if (dailyLogs.length === 0) return [];
    
    return dailyLogs.map(log => {
      let total = 0;
      const totalByStat: Record<string, number> = { I: 0, H: 0, R: 0, T: 0, J: 0, OTHER: 0 };
      const processCounts: Record<string, Record<string, number>> = {};
      processHeaders.forEach(proc => processCounts[proc] = { I: 0, H: 0, R: 0, T: 0, J: 0, OTHER: 0 });
      
      log.data.forEach(row => {
        let currentProcess = null;
        for (let i = processHeaders.length - 1; i >= 0; i--) {
          const proc = processHeaders[i];
          const val = row[proc];
          if (val === 'C' || val === 'H') {
            currentProcess = proc;
            break;
          }
        }
        
        let stat = String(row['STAT'] || '').toUpperCase();
        if (!['I', 'H', 'R', 'T', 'J'].includes(stat)) stat = 'OTHER';

        if (currentProcess) {
          total++;
          totalByStat[stat]++;
          processCounts[currentProcess][stat]++;
        }
      });

      // Calculate Average Lead Time and Value-Added Ratio
      let sumDays = 0;
      let countDays = 0;
      log.data.forEach(row => {
        const d = parseInt(row['DAYS_IN_PROCESS']);
        if (!isNaN(d)) {
          sumDays += d;
          countDays++;
        }
      });
      const avgLeadTime = countDays > 0 ? parseFloat((sumDays / countDays).toFixed(1)) : 0;
      const vaCount = totalByStat['I'];
      const vaRatio = total > 0 ? parseFloat(((vaCount / total) * 100).toFixed(1)) : 0;

      const entry: any = {
        date: new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fileName: log.fileName,
        timestamp: log.timestamp,
        Total: total,
        avgLeadTime,
        vaRatio
      };
      
      ['I', 'H', 'R', 'T', 'J', 'OTHER'].forEach(s => {
        entry[`Total_${s}`] = totalByStat[s];
      });

      processHeaders.forEach(proc => {
        entry[proc] = Object.values(processCounts[proc]).reduce((a, b) => a + b, 0);
        ['I', 'H', 'R', 'T', 'J', 'OTHER'].forEach(s => {
          entry[`${proc}_${s}`] = processCounts[proc][s];
        });
      });

      return entry;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [dailyLogs]);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({
    H: true,
    R: true,
    I: true,
    T: true,
    J: true,
    OTHER: true,
  });

  const toggleStatus = (status: string) => {
    setVisibleStatuses(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const [excludeBottleneck, setExcludeBottleneck] = useState<boolean>(true);
  const [chartStyle, setChartStyle] = useState<'stacked' | 'grouped'>('stacked');
  const [yAxisCap, setYAxisCap] = useState<number | 'auto'>('auto');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setFilters({});
    setCurrentPage(1);
    setSortConfig(null);
  }, [selectedProcess]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, globalSearch, sortConfig]);

  useEffect(() => {
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const findMatch = (target: string) => headers.find(h => h.toUpperCase() === target) || headers[0];
      setParetoKeys([findMatch("SIZE"), findMatch("STAT")]);
    }
  }, [data]);

  const availableHeaders = data.length > 0 ? Object.keys(data[0]) : [];

  const handleKeyChange = (index: number, key: string) => {
    const newKeys = [...paretoKeys];
    newKeys[index] = key;
    setParetoKeys(newKeys);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newLog: DailyLog = {
            fileName: file.name,
            timestamp: file.lastModified || Date.now(),
            data: processData(results.data)
          };
          setDailyLogs(prev => [...prev, newLog].sort((a, b) => a.timestamp - b.timestamp));
          setSelectedProcess(null);
        },
      });
    });
  };

  const exportToCSV = (exportData: any[], filename: string) => {
    if (exportData.length === 0) return;
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processInventory = processHeaders.map(header => {
    const counts = { C: 0, R: 0, I: 0, T: 0, J: 0, H: 0 };
    data.forEach(item => {
      // Find the last process column (from right to left) that has 'C' or 'H'
      let currentProcess = null;
      for (let i = processHeaders.length - 1; i >= 0; i--) {
        const proc = processHeaders[i];
        const status = item[proc as keyof typeof item];
        if (status === 'C' || status === 'H') {
          currentProcess = proc;
          break;
        }
      }
      
      if (currentProcess === header) {
        const stat = item["STAT"];
        if (stat && counts.hasOwnProperty(stat)) {
          counts[stat as keyof typeof counts]++;
        }
      }
    });
    return { name: header, fullName: PROCESS_NAMES[header], ...counts };
  });

  const totalInventory = processInventory.reduce((acc, curr) => acc + curr.C + curr.R + curr.I + curr.T + curr.J + curr.H, 0);



  const statusCounts = { C: 0, R: 0, I: 0, T: 0, J: 0, H: 0 };
  data.forEach(item => {
    const stat = item["STAT"];
    if (stat && statusCounts.hasOwnProperty(stat)) {
      statusCounts[stat as keyof typeof statusCounts]++;
    }
  });

  const selectedOrders = selectedProcess 
    ? data.filter(item => {
        let currentProcess = null;
        for (let i = processHeaders.length - 1; i >= 0; i--) {
          const proc = processHeaders[i];
          const status = item[proc as keyof typeof item];
          if (status === 'C' || status === 'H') {
            currentProcess = proc;
            break;
          }
        }
        return currentProcess === selectedProcess;
      })
    : (showOnlyAging ? data : []);

  const filteredOrders = selectedOrders.filter(order => {
    const matchesDropdowns = Object.keys(filters).every(header => 
      filters[header].length === 0 || filters[header].includes(String(order[header]))
    );
    if (!matchesDropdowns) return false;

    if (showOnlyAging && (order.DAYS_IN_PROCESS || 0) <= 3) {
      return false;
    }
    
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchesSearch = Object.values(order).some(val => 
        String(val).toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortConfig) {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    const aDays = parseInt(a.DAYS_IN_PROCESS) || 0;
    const bDays = parseInt(b.DAYS_IN_PROCESS) || 0;
    return bDays - aDays;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const bottleneckItem = processInventory.length > 0 ? processInventory.reduce((max, item) => {
    const total = item.C + item.H + item.R + item.I + item.T + item.J;
    const maxTotal = max.C + max.H + max.R + max.I + max.T + max.J;
    return total > maxTotal ? item : max;
  }, processInventory[0]) : { name: 'N/A', fullName: 'None', C: 0, R: 0, I: 0, T: 0, J: 0, H: 0 };

  const filteredChartData = processInventory.filter(item => {
    if (excludeBottleneck && item.name === bottleneckItem.name) {
      return false;
    }
    return true;
  });

  const bottleneckTotal = bottleneckItem.C + bottleneckItem.H + bottleneckItem.R + bottleneckItem.I + bottleneckItem.T + bottleneckItem.J;
  const bottleneckPercentages = {
    I: bottleneckTotal > 0 ? Math.round((bottleneckItem.I / bottleneckTotal) * 100) : 0,
    H: bottleneckTotal > 0 ? Math.round((bottleneckItem.H / bottleneckTotal) * 100) : 0,
    R: bottleneckTotal > 0 ? Math.round((bottleneckItem.R / bottleneckTotal) * 100) : 0,
    T: bottleneckTotal > 0 ? Math.round((bottleneckItem.T / bottleneckTotal) * 100) : 0,
    J: bottleneckTotal > 0 ? Math.round((bottleneckItem.J / bottleneckTotal) * 100) : 0,
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen font-sans text-slate-100">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Enterprise Control
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Real-time sync</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-50 via-slate-100 to-indigo-300">
            Aero Retread Inventory Control Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and manage aircraft tire retreading inventory across all production stages
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-lg shadow-indigo-500/20">
            <Upload size={16} />
            Upload CSV Logs
            <input type="file" multiple accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleLoadMockData}
            className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-750 transition-colors"
          >
            Load Sample History
          </button>

           {dailyLogs.length > 0 && (
            <button
              onClick={handleClearAllData}
              className="flex items-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold border border-red-900/30 transition-colors"
            >
              Clear Data
            </button>
          )}
          
          {dailyLogs.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm font-semibold text-slate-400">View Day:</span>
              <select 
                value={selectedLogIndex}
                onChange={(e) => setSelectedLogIndex(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none cursor-pointer"
              >
                {dailyLogs.map((log, idx) => (
                  <option key={idx} value={idx}>{log.fileName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-8 mt-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'dashboard' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="flex items-center gap-2">
            <BarChart2 size={16} />
            Day View Analytics
          </div>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'comparison' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            Multi-Day Comparison
          </div>
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {dailyLogs.length === 0 ? (
            <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center mt-8">
              <Upload size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-300 mb-2">No Data Available</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Please upload a CSV log file or load our sample history to begin analyzing the inventory data.</p>
              <div className="flex justify-center gap-4">
                <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-lg shadow-indigo-500/20">
                  <Upload size={16} />
                  Upload CSV
                  <input type="file" multiple accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={handleLoadMockData}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl text-sm font-semibold border border-slate-700 transition-colors"
                >
                  Load Sample History
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="relative overflow-hidden bg-slate-900/80 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 group shadow-md shadow-slate-950/50">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Inventory</h2>
              <p className="text-4xl font-extrabold text-slate-55 mt-2 tracking-tight">{totalInventory}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <BarChart2 size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Tires across all active processes
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900/80 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800/60 hover:border-emerald-500/30 transition-all duration-300 group shadow-md shadow-slate-950/50">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Casing Ready To Buff</h2>
              <p className="text-4xl font-extrabold text-slate-55 mt-2 tracking-tight">
                {(() => {
                  const p = processInventory.find(item => item.name === 'HOT');
                  return p ? (p.C + p.H + p.R + p.I + p.T + p.J) : 0;
                })()}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Clock size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Total tires currently at HOT HOUSE
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900/80 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800/60 hover:border-violet-500/30 transition-all duration-300 group shadow-md shadow-slate-950/50">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Green Tire Inventory</h2>
              <p className="text-4xl font-extrabold text-slate-55 mt-2 tracking-tight">
                {(() => {
                  const p = processInventory.find(item => item.name === 'ORB');
                  return p ? (p.C + p.H + p.R + p.I + p.T + p.J) : 0;
                })()}
              </p>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 group-hover:scale-110 transition-transform duration-300">
              <Layers size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            Total tires currently at ORBITREAD
          </div>
        </div>

        <div 
          onClick={() => {
            setShowOnlyAging(!showOnlyAging);
            setSelectedProcess(null); // clear process selection to show all aging tires
          }}
          className={`relative overflow-hidden cursor-pointer p-6 rounded-2xl border transition-all duration-300 group shadow-md shadow-slate-950/50 ${
            showOnlyAging 
              ? 'bg-rose-950/40 border-rose-500 hover:border-rose-450' 
              : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/60 hover:border-rose-500/30'
          }`}
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aging Inventory (&gt;3 Days)</h2>
              <p className="text-4xl font-extrabold text-slate-55 mt-2 tracking-tight text-rose-400">
                {data.filter(row => (parseInt(row.DAYS_IN_PROCESS) || 0) > 3).length}
              </p>
            </div>
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              showOnlyAging ? 'bg-rose-500/20 text-rose-300 scale-110' : 'bg-rose-500/10 text-rose-450 group-hover:scale-110'
            }`}>
              <AlertTriangle size={22} className={showOnlyAging ? 'animate-pulse' : ''} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-550 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>{showOnlyAging ? 'Filtering active - click to clear' : 'Click to filter table for delayed tires'}</span>
          </div>
        </div>
      </div>



      {/* Status Filter Cards */}
      <div className="mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Filter size={12} />
          Toggle Statuses to filter chart
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries({
            H: { label: 'Hold', color: 'bg-yellow-500 text-yellow-500', count: statusCounts.H },
            R: { label: 'Reprocess', color: 'bg-amber-600 text-amber-500', count: statusCounts.R },
            I: { label: 'In Process', color: 'bg-emerald-500 text-emerald-400', count: statusCounts.I },
            T: { label: 'Tech', color: 'bg-slate-300 text-slate-300', count: statusCounts.T },
            J: { label: 'Reject', color: 'bg-red-500 text-red-400', count: statusCounts.J }
          }).map(([key, info]) => {
            const isActive = visibleStatuses[key];
            return (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm ${
                  isActive 
                    ? 'bg-slate-900 border-indigo-500/40 text-slate-200 hover:bg-slate-850' 
                    : 'bg-slate-905/30 border-slate-800 text-slate-500 hover:text-slate-450 hover:bg-slate-900/40'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? info.color : 'bg-slate-700'} transition-colors duration-200`}></span>
                <span>{info.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-600'
                }`}>{info.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Chart and Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left: Interactive Chart (Col-span 8 on large, Full on small) */}
        <div className="lg:col-span-8 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            {/* Chart Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-850">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 size={18} className="text-indigo-400" />
                  Inventory by Process & Status
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Click a bar to inspect process components below
                </p>
              </div>

              {/* Advanced Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Exclude Bottleneck Switch */}
                <button
                  onClick={() => setExcludeBottleneck(!excludeBottleneck)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    excludeBottleneck 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse-subtle' 
                      : 'bg-slate-850 border-slate-750 text-slate-400 hover:bg-slate-750'
                  }`}
                  title="Hide highest volume process to automatically rescale the graph for other processes"
                >
                  {excludeBottleneck ? <EyeOff size={14} /> : <Eye size={14} />}
                  Focus Mode (Excl. {bottleneckItem.fullName})
                </button>

                {/* Chart Style Toggle */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-750">
                  <button
                    onClick={() => setChartStyle('stacked')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      chartStyle === 'stacked' 
                        ? 'bg-indigo-600 text-slate-100 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stacked
                  </button>
                  <button
                    onClick={() => setChartStyle('grouped')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      chartStyle === 'grouped' 
                        ? 'bg-indigo-600 text-slate-100 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Grouped
                  </button>
                </div>

                {/* Y-Axis Zoom / Cap */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-750">
                  <span className="text-[10px] text-slate-500 px-2 font-medium">Y-Cap:</span>
                  <button
                    onClick={() => setYAxisCap('auto')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      yAxisCap === 'auto' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto
                  </button>
                  <input
                    type="number"
                    value={yAxisCap === 'auto' ? '' : yAxisCap}
                    onChange={(e) => setYAxisCap(e.target.value ? Number(e.target.value) : 'auto')}
                    placeholder="Custom"
                    className="w-16 px-2 py-0.5 ml-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded text-[10px] font-bold text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-80 w-full relative">
              {filteredChartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  No processes fit the current filter criteria
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={filteredChartData} 
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }} 
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        const initial = Object.keys(PROCESS_NAMES).find(key => PROCESS_NAMES[key] === data.activeLabel);
                        if (initial) setSelectedProcess(initial);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="fullName" 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: '500' }} 
                      height={40} 
                      interval={0} 
                      dy={10} 
                    />
                    <YAxis 
                      domain={[0, yAxisCap === 'auto' ? 'auto' : yAxisCap]}
                      allowDataOverflow={yAxisCap !== 'auto'}
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px' }} 
                      itemStyle={{ padding: '2px 0' }}
                    />
                    
                    {visibleStatuses.H && (
                      <Bar dataKey="H" stackId={chartStyle === 'stacked' ? 'a' : undefined} fill="#eab308" name="Hold">
                        {filteredChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} cursor="pointer" />
                        ))}
                        <LabelList dataKey="H" position={chartStyle === 'stacked' ? 'center' : 'top'} fill="#ffffff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                      </Bar>
                    )}
                    {visibleStatuses.R && (
                      <Bar dataKey="R" stackId={chartStyle === 'stacked' ? 'a' : undefined} fill="#a16207" name="Reprocess">
                        <LabelList dataKey="R" position={chartStyle === 'stacked' ? 'center' : 'top'} fill="#ffffff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                      </Bar>
                    )}
                    {visibleStatuses.I && (
                      <Bar dataKey="I" stackId={chartStyle === 'stacked' ? 'a' : undefined} fill="#10b981" name="In Process">
                        <LabelList dataKey="I" position={chartStyle === 'stacked' ? 'center' : 'top'} fill="#ffffff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                      </Bar>
                    )}
                    {visibleStatuses.T && (
                      <Bar dataKey="T" stackId={chartStyle === 'stacked' ? 'a' : undefined} fill="#cbd5e1" name="Tech">
                        <LabelList dataKey="T" position={chartStyle === 'stacked' ? 'center' : 'top'} fill="#334155" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                      </Bar>
                    )}
                    {visibleStatuses.J && (
                      <Bar dataKey="J" stackId={chartStyle === 'stacked' ? 'a' : undefined} fill="#ef4444" name="Reject">
                        <LabelList dataKey="J" position={chartStyle === 'stacked' ? 'center' : 'top'} fill="#ffffff" fontSize={10} formatter={(value: number) => value > 0 ? value : ''} />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-500 bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex items-start gap-1.5">
            <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
            <span>
              {excludeBottleneck 
                ? `💡 Focus Mode is Active. The ${bottleneckItem.fullName} process is currently hidden from this chart so that standard processes (which contain smaller, finer numbers) can expand fully and stay readable. Toggle off Focus Mode to see all processes comparatively.`
                : `💡 Standard linear scaling is active. Processes with small inventory counts may look compressed due to the massive volume at ${bottleneckItem.fullName}. Use custom Y-Cap or toggle Focus Mode to adjust readability.`
              }
            </span>
          </div>
        </div>

        {/* Right: Bottleneck Spotlight Card (Col-span 4 on large, Full on small) */}
        <div className={`lg:col-span-4 rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between shadow-xl ${
          excludeBottleneck 
            ? 'bg-gradient-to-b from-slate-900 to-indigo-950/20 border-indigo-500/20 ring-1 ring-indigo-500/10' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            {/* Spotlight Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${excludeBottleneck ? 'bg-amber-450 animate-pulse' : 'bg-slate-600'}`}></span>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles size={16} className={excludeBottleneck ? "text-amber-400 animate-spin-slow" : "text-slate-500"} />
                  {bottleneckItem.fullName} Spotlight
                </h2>
              </div>
              {excludeBottleneck && (
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                  Isolated
                </span>
              )}
            </div>

            {/* Giant Number Stat */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center mb-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Isolated Queue Volume</span>
              <div className="text-5xl font-black text-slate-100 tracking-tight mt-1 flex items-center justify-center gap-2">
                {bottleneckTotal}
                <span className="text-lg font-bold text-slate-400">tires</span>
              </div>
              <p className="text-[10px] text-slate-505 mt-1.5 leading-normal">
                {Math.round((bottleneckTotal / (totalInventory || 1)) * 100)}% of the total retreading inventory is currently holding at {bottleneckItem.fullName}.
              </p>
            </div>

            {/* Sub-status Progress List */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Queue Breakdown</h3>
              
              {/* In Process Progress */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    In Process (I)
                  </span>
                  <span className="font-medium text-slate-300">{bottleneckItem.I} <span className="text-[10px] text-slate-500">({bottleneckPercentages.I}%)</span></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${bottleneckPercentages.I}%` }}></div>
                </div>
              </div>

              {/* Hold Progress */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-yellow-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Hold (H)
                  </span>
                  <span className="font-medium text-slate-300">{bottleneckItem.H} <span className="text-[10px] text-slate-500">({bottleneckPercentages.H}%)</span></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${bottleneckPercentages.H}%` }}></div>
                </div>
              </div>

              {/* Reprocess Progress */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-amber-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                    Reprocess (R)
                  </span>
                  <span className="font-medium text-slate-300">{bottleneckItem.R} <span className="text-[10px] text-slate-500">({bottleneckPercentages.R}%)</span></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${bottleneckPercentages.R}%` }}></div>
                </div>
              </div>

              {/* Tech Progress */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Tech (T)
                  </span>
                  <span className="font-medium text-slate-300">{bottleneckItem.T} <span className="text-[10px] text-slate-500">({bottleneckPercentages.T}%)</span></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${bottleneckPercentages.T}%` }}></div>
                </div>
              </div>

              {/* Reject Progress */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-red-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    Reject (J)
                  </span>
                  <span className="font-medium text-slate-300">{bottleneckItem.J} <span className="text-[10px] text-slate-500">({bottleneckPercentages.J}%)</span></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${bottleneckPercentages.J}%` }}></div>
                </div>
              </div>

            </div>
          </div>
          
          <button 
            onClick={() => setSelectedProcess(bottleneckItem.name)}
            className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/20"
          >
            Inspect {bottleneckItem.fullName} Orders
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* Process Flow Map */}
      <ProcessFlow 
        processInventory={processInventory} 
        onProcessClick={setSelectedProcess} 
        selectedProcess={selectedProcess} 
      />

      {/* Drill-Down Section (Pareto & Orders Table) */}
      {(selectedProcess || showOnlyAging) && (
        <div className="mt-8 border-t border-slate-800/85 pt-8 animate-fade-in">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sliders size={20} className="text-indigo-400" />
                {selectedProcess 
                  ? `Process Analytics: ${PROCESS_NAMES[selectedProcess]} (${selectedProcess})`
                  : 'Aging Tires Spotlight (All Stations)'
                }
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {selectedProcess 
                  ? 'Investigating Pareto distributions and active orders inside this process station'
                  : 'Investigating Pareto distributions and active orders for tires delayed >3 days'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-400">Pareto Top Limit:</label>
              <select 
                value={paretoLimit} 
                onChange={(e) => setParetoLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs font-semibold text-slate-350 cursor-pointer outline-none"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={0}>All Values</option>
              </select>
            </div>
          </div>

          {/* Pareto Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {paretoKeys.map((key, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pareto Field {index + 1}</span>
                </div>
                <select 
                  value={key} 
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  className="w-full p-2.5 border border-slate-800 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs text-slate-350 font-semibold cursor-pointer outline-none focus:border-indigo-500 transition-colors"
                >
                  {availableHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <ParetoChart 
                  data={selectedOrders} 
                  title={selectedProcess ? `Pareto Chart of ${key} in ${selectedProcess}` : `Pareto Chart of ${key} (Aging)`} 
                  dataKey={key} 
                  nameKey="name" 
                  limit={paretoLimit === 0 ? undefined : paretoLimit}
                  onBarClick={(value) => {
                    const newFilters = { ...filters };
                    newFilters[key] = [value];
                    setFilters(newFilters);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Quality Gate Failures Pareto */}
          {selectedOrders.filter(row => 
            (row.STAT === 'H' || row.STAT === 'J') && 
            row.HOLD_REJECT_REASON && 
            row.HOLD_REJECT_REASON !== 'N/A' && 
            String(row.HOLD_REJECT_REASON).trim() !== ''
          ).length > 0 ? (
            <div className="mt-4 mb-8">
              <ParetoChart 
                data={selectedOrders.filter(row => 
                  (row.STAT === 'H' || row.STAT === 'J') && 
                  row.HOLD_REJECT_REASON && 
                  row.HOLD_REJECT_REASON !== 'N/A' && 
                  String(row.HOLD_REJECT_REASON).trim() !== ''
                )} 
                title="Quality Gate Failure Pareto Chart (Hold / Reject Reasons)" 
                dataKey="HOLD_REJECT_REASON" 
                nameKey="name" 
                limit={paretoLimit === 0 ? undefined : paretoLimit}
                onBarClick={(value) => {
                  const newFilters = { ...filters };
                  newFilters["HOLD_REJECT_REASON"] = [value];
                  setFilters(newFilters);
                }}
              />
            </div>
          ) : (
            selectedOrders.some(row => row.STAT === 'H' || row.STAT === 'J') && (
              <div className="mt-4 mb-8 bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-xs italic">
                No quality failure reasons specified for hold/reject tires in the current active dataset.
              </div>
            )
          )}

          {/* Order Details Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-8">
            <div className="p-5 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Table size={16} className="text-indigo-400" />
                  Active Orders List ({filteredOrders.length} of {selectedOrders.length} matches)
                </h3>
                {/* Aging Legend */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Aging System:</span>
                  <span className="flex items-center gap-1 bg-emerald-500/5 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10">
                    <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                    ≤ 4 Days (Recent)
                  </span>
                  <span className="flex items-center gap-1 bg-amber-500/5 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10">
                    <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                    5-8 Days (Medium)
                  </span>
                  <span className="flex items-center gap-1 bg-rose-500/5 text-rose-450 px-1.5 py-0.5 rounded border border-rose-500/10">
                    <span className="h-1 w-1 rounded-full bg-rose-500"></span>
                    &gt; 8 Days (Delayed)
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search any field..."
                    className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs font-medium text-slate-200 outline-none w-48 transition-all shadow-inner"
                  />
                </div>
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={() => setFilters({})}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Clear Filters
                  </button>
                )}
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
                  <button
                    onClick={() => setTableViewMode('summary')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      tableViewMode === 'summary' 
                        ? 'bg-indigo-600 text-slate-100 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    Summary View
                  </button>
                  <button
                    onClick={() => setTableViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      tableViewMode === 'matrix' 
                        ? 'bg-indigo-600 text-slate-100 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    Full Matrix
                  </button>
                </div>

                <button
                  onClick={() => exportToCSV(filteredOrders, `Active_Orders_${selectedProcess}.csv`)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 transition-colors"
                  disabled={filteredOrders.length === 0}
                  title="Export filtered data to CSV"
                >
                  <Download size={14} />
                  Export Data
                </button>
                <button
                  onClick={() => exportToCSV(data, `All_Inventory_Backup.csv`)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20 transition-colors"
                  disabled={data.length === 0}
                  title="Export ALL data to CSV"
                >
                  <Download size={14} />
                  Export All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-850 shadow-sm z-20">
                  <tr>
                    {selectedOrders.length > 0 && getTableHeaders(selectedOrders[0]).map(header => (
                      <th key={header} className="py-3 px-4 font-semibold text-slate-400 relative group min-w-[120px]">
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="uppercase tracking-wider text-[10px] cursor-pointer hover:text-slate-200 flex items-center gap-1 transition-colors select-none"
                            onClick={() => {
                              let direction: 'asc' | 'desc' = 'asc';
                              if (sortConfig && sortConfig.key === header && sortConfig.direction === 'asc') {
                                direction = 'desc';
                              }
                              setSortConfig({ key: header, direction });
                            }}
                          >
                            {header === 'DAYS_IN_PROCESS' ? 'Days in Process' : 
                             header === 'STAT' ? 'Status' : 
                             header === 'CURRENT_PROCESS' ? 'Current Process' : 
                             header === 'HOLD_REJECT_REASON' ? 'Hold/Reject Reason' : 
                             header}
                            {sortConfig?.key === header ? (
                              sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-indigo-400" /> : <ArrowDown size={10} className="text-indigo-400" />
                            ) : null}
                          </span>
                          <button
                            onClick={() => {
                              const newFilters = { ...filters };
                              if (newFilters[header]) delete newFilters[header];
                              else newFilters[header] = [];
                              setFilters(newFilters);
                            }}
                            className={`text-slate-500 hover:text-indigo-400 p-0.5 rounded cursor-pointer transition-colors ${
                              filters.hasOwnProperty(header) ? 'text-indigo-400' : ''
                            }`}
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        
                        {filters.hasOwnProperty(header) && (
                          <div className="absolute top-full left-0 z-30 bg-slate-950 border border-slate-800 shadow-xl p-3 rounded-xl w-52 max-h-64 overflow-y-auto mt-1 backdrop-blur-md">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Filter Values</div>
                            <div className="space-y-1">
                              {Array.from(new Set(selectedOrders.map(o => String(o[header])))).sort().map(val => (
                                <label key={val} className="flex items-center gap-2.5 text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-900 rounded-lg text-slate-350 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={filters[header].length === 0 || filters[header].includes(val)}
                                    className="rounded border-slate-850 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                                    onChange={(e) => {
                                      const allValues = Array.from(new Set(selectedOrders.map(o => String(o[header]))));
                                      const current = filters[header].length === 0 ? allValues : filters[header];
                                      let next;
                                      if (e.target.checked) {
                                        next = [...current, val];
                                      } else {
                                        next = current.filter(v => v !== val);
                                      }
                                      if (next.length === allValues.length) {
                                        next = [];
                                      }
                                      setFilters({ ...filters, [header]: next });
                                    }}
                                  />
                                  <span className="truncate">{val || '(Empty)'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {paginatedOrders.map((order, idx) => {
                    const tireId = String(order.BARCODE || order.WORK_ORDER || order['WORK ORDER'] || order.MATERIAL || '');
                    const isExpanded = expandedOrderId === tireId;
                    const headers = getTableHeaders(order);

                    return (
                      <React.Fragment key={idx}>
                        <tr className={`hover:bg-slate-850/40 transition-colors ${isExpanded ? 'bg-indigo-950/10' : ''}`}>
                          {headers.map(header => {
                            const cellVal = String(order[header]);
                            const isStatField = header.toUpperCase() === 'STAT';
                            const isDaysField = header === 'DAYS_IN_PROCESS';
                            const isCurrentProcessField = header === 'CURRENT_PROCESS';
                            const isWorkOrderField = ['WORK_ORDER', 'WORK ORDER', 'BARCODE'].includes(header.toUpperCase());

                            return (
                              <td key={header} className="py-3 px-4 font-mono text-slate-355">
                                {isStatField ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                    cellVal === 'I' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    cellVal === 'H' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    cellVal === 'R' ? 'bg-amber-600/10 text-amber-500 border-amber-600/20' :
                                    cellVal === 'T' ? 'bg-slate-350/10 text-slate-350 border-slate-300/20' :
                                    cellVal === 'J' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-slate-800 text-slate-400 border-slate-700/50'
                                  }`}>
                                    {cellVal === 'I' ? 'In Process' :
                                     cellVal === 'H' ? 'Hold' :
                                     cellVal === 'R' ? 'Reprocess' :
                                     cellVal === 'T' ? 'Tech' :
                                     cellVal === 'J' ? 'Reject' : cellVal}
                                  </span>
                                ) : isDaysField ? (
                                  (() => {
                                    const daysNum = parseInt(cellVal) || 0;
                                    let colorClass = "";
                                    let dotColor = "";
                                    if (daysNum <= 4) {
                                      colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                      dotColor = "bg-emerald-400";
                                    } else if (daysNum <= 8) {
                                      colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                      dotColor = "bg-amber-400";
                                    } else {
                                      colorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                                      dotColor = "bg-rose-500";
                                    }
                                    return (
                                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${colorClass}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
                                        {daysNum} {daysNum === 1 ? 'Day' : 'Days'}
                                      </span>
                                    );
                                  })()
                                ) : isCurrentProcessField ? (
                                  <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-xs whitespace-nowrap">
                                    {cellVal}
                                  </span>
                                ) : isWorkOrderField ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tireId) {
                                        setExpandedOrderId(prev => prev === tireId ? null : tireId);
                                      }
                                    }}
                                    className="text-indigo-400 hover:text-indigo-350 font-bold hover:underline cursor-pointer flex items-center gap-1.5 text-left outline-none"
                                    title="Click to view history timeline for this tire"
                                  >
                                    <History size={12} className="opacity-70 shrink-0 text-indigo-400" />
                                    <span>{cellVal}</span>
                                  </button>
                                ) : header === 'HOLD_REJECT_REASON' ? (
                                  cellVal === 'N/A' ? (
                                    <span className="text-slate-655 font-medium font-sans">N/A</span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold text-xs whitespace-nowrap">
                                      {cellVal}
                                    </span>
                                  )
                                ) : cellVal || '-'}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {isExpanded && (
                          <tr className="bg-slate-950/60">
                            <td colSpan={headers.length} className="p-4 border-l-2 border-indigo-500">
                              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-inner">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
                                  <div className="flex items-center gap-2">
                                    <History size={16} className="text-indigo-455 animate-pulse" />
                                    <h4 className="font-bold text-slate-200 text-sm">
                                      Tire Movement History: <span className="text-indigo-455 font-mono font-black">{tireId}</span>
                                    </h4>
                                  </div>
                                  <button 
                                    onClick={() => setExpandedOrderId(null)}
                                    className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                                  >
                                    Close History
                                  </button>
                                </div>

                                {/* Timeline Content */}
                                {(() => {
                                  const history = getTireHistory(tireId);
                                  const foundAny = history.some(h => h.tire !== null);

                                  if (!foundAny) {
                                    return (
                                      <div className="text-xs text-slate-500 italic py-3 text-center">
                                        No historical tracking records found in the uploaded logs.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="relative pl-6 border-l-2 border-indigo-500/20 space-y-4 py-2">
                                      {history.map((h, hIdx) => {
                                        if (!h.tire) {
                                          return (
                                            <div key={hIdx} className="relative">
                                              {/* Bullet */}
                                              <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
                                                <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                                              </div>
                                              <div>
                                                <div className="text-[10px] text-slate-500 font-semibold mb-0.5">{h.date} ({h.fileName})</div>
                                                <div className="text-xs text-slate-600 italic">No entry/activity on this date.</div>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={hIdx} className="relative group">
                                            {/* Bullet */}
                                            <div className={`absolute -left-[32px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                                              h.tire.STAT === 'H' ? 'border-yellow-500/40 text-yellow-500' :
                                              h.tire.STAT === 'J' ? 'border-red-500/40 text-red-500' :
                                              h.tire.STAT === 'R' ? 'border-amber-500/40 text-amber-500' :
                                              'border-indigo-500/40 text-indigo-400'
                                            }`}>
                                              <div className={`h-1.5 w-1.5 rounded-full ${
                                                h.tire.STAT === 'H' ? 'bg-yellow-450' :
                                                h.tire.STAT === 'J' ? 'bg-red-450' :
                                                h.tire.STAT === 'R' ? 'bg-amber-450' :
                                                'bg-indigo-455'
                                              }`}></div>
                                            </div>

                                            <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 hover:border-slate-800/80 transition-all">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/40 pb-1.5">
                                                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-sans">
                                                  {h.date} <span className="text-slate-600 font-normal">({h.fileName})</span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-semibold text-slate-500 font-sans">Process:</span>
                                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                                                    {h.tire.CURRENT_PROCESS || 'N/A'}
                                                  </span>
                                                  <span className="text-[10px] font-semibold text-slate-500 font-sans ml-1">Status:</span>
                                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                                      h.tire.STAT === 'I' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                      h.tire.STAT === 'H' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                      h.tire.STAT === 'R' ? 'bg-amber-600/10 text-amber-500 border-amber-600/20' :
                                                      h.tire.STAT === 'T' ? 'bg-slate-350/10 text-slate-350 border-slate-300/20' :
                                                      h.tire.STAT === 'J' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                      'bg-slate-850 text-slate-400 border-slate-700/50'
                                                    }`}>
                                                    {h.tire.STAT === 'I' ? 'In Process' :
                                                     h.tire.STAT === 'H' ? 'Hold' :
                                                     h.tire.STAT === 'R' ? 'Reprocess' :
                                                     h.tire.STAT === 'T' ? 'Tech' :
                                                     h.tire.STAT === 'J' ? 'Reject' : (h.tire.STAT || 'UNKNOWN')}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Details metadata */}
                                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 mt-1">
                                                {Object.keys(h.tire)
                                                  .filter(key => !['CURRENT_PROCESS', 'STAT', 'DAYS_IN_PROCESS', 'HOLD_REJECT_REASON', ...processHeaders].includes(key))
                                                  .map(key => {
                                                    const val = h.tire[key];
                                                    if (val === undefined || val === null || String(val).trim() === '') return null;
                                                    return (
                                                      <div key={key} className="flex gap-1">
                                                        <span className="text-slate-500 font-medium">{key}:</span>
                                                        <span className="text-slate-300 font-bold">{String(val)}</span>
                                                      </div>
                                                    );
                                                  })}
                                                {h.tire.HOLD_REJECT_REASON && h.tire.HOLD_REJECT_REASON !== 'N/A' && (
                                                  <div className="flex gap-1 text-yellow-500 font-semibold">
                                                    <span>Reason:</span>
                                                    <span className="font-bold">{h.tire.HOLD_REJECT_REASON}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
            </>
          )}
      </>
      ) : (
        /* Multi-Day Comparison Tab */
        <div className="space-y-8 animate-fade-in">
          {dailyLogs.length <= 1 ? (
            <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center">
              <TrendingUp size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-300 mb-2">Not Enough Data</h3>
              <p className="text-slate-500 max-w-md mx-auto">Please upload at least 2 daily CSV logs to view the multi-day comparison analytics.</p>
            </div>
          ) : (
            <>
              {/* Filter Statuses */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Filter size={16} className="text-indigo-400" /> Filter Status:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['I', 'H', 'R', 'T', 'J', 'OTHER'].map(key => {
                    const isActive = visibleStatuses[key];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleStatus(key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm ${
                          isActive 
                            ? 'bg-slate-900 border-indigo-500/40 text-slate-200 hover:bg-slate-850' 
                            : 'bg-slate-905/30 border-slate-800 text-slate-500 hover:text-slate-450 hover:bg-slate-900/40'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full transition-colors duration-200`} style={{ backgroundColor: isActive ? STAT_COLORS[key] : '#334155' }}></span>
                        <span>{STAT_LABELS[key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operational Flow Metrics KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Lead Time Card */}
                <div className="relative overflow-hidden bg-slate-900/80 p-6 rounded-2xl border border-slate-800/60 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Lead Time</h2>
                      <p className="text-4xl font-extrabold text-slate-100 mt-2 tracking-tight">
                        {comparisonData[comparisonData.length - 1]?.avgLeadTime} <span className="text-sm font-bold text-slate-400">days</span>
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Clock size={22} />
                    </div>
                  </div>
                  {comparisonData.length > 1 && (
                    (() => {
                      const latest = comparisonData[comparisonData.length - 1].avgLeadTime;
                      const prev = comparisonData[comparisonData.length - 2].avgLeadTime;
                      const diff = parseFloat((latest - prev).toFixed(1));
                      const isGood = diff < 0;
                      return (
                        <div className="mt-4 text-xs flex items-center gap-1.5">
                          <span className={`font-bold px-1.5 py-0.5 rounded ${isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-450'}`}>
                            {diff > 0 ? `+${diff}` : diff} days
                          </span>
                          <span className="text-slate-500">vs yesterday (lower is better)</span>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Value-Added Ratio Card */}
                <div className="relative overflow-hidden bg-slate-900/80 p-6 rounded-2xl border border-slate-800/60 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Value-Added (VA) Ratio</h2>
                      <p className="text-4xl font-extrabold text-slate-100 mt-2 tracking-tight">
                        {comparisonData[comparisonData.length - 1]?.vaRatio}%
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Activity size={22} />
                    </div>
                  </div>
                  {comparisonData.length > 1 && (
                    (() => {
                      const latest = comparisonData[comparisonData.length - 1].vaRatio;
                      const prev = comparisonData[comparisonData.length - 2].vaRatio;
                      const diff = parseFloat((latest - prev).toFixed(1));
                      const isGood = diff > 0;
                      return (
                        <div className="mt-4 text-xs flex items-center gap-1.5">
                          <span className={`font-bold px-1.5 py-0.5 rounded ${isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-450'}`}>
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </span>
                          <span className="text-slate-500">vs yesterday (higher is better)</span>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Total WIP Line Chart */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                  <BarChart2 size={18} className="text-indigo-400" />
                  Total Work-in-Progress (WIP) Trend
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 25, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem' }}
                        labelStyle={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}
                        cursor={{ fill: '#334155', opacity: 0.4 }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                      {['I', 'H', 'R', 'T', 'J', 'OTHER'].filter(s => visibleStatuses[s]).map(s => (
                        <Bar key={s} dataKey={`Total_${s}`} name={STAT_LABELS[s]} stackId="a" fill={STAT_COLORS[s]} maxBarSize={60} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Flow Efficiency Trend Chart */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-emerald-400" />
                  Flow & Process Efficiency (Lead Time vs. Value-Added Ratio)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 25, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#818cf8" tick={{ fill: '#818cf8', fontSize: 12 }} label={{ value: 'Lead Time (Days)', angle: -90, position: 'insideLeft', fill: '#818cf8', style: { textAnchor: 'middle' }, offset: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#34d399" tick={{ fill: '#34d399', fontSize: 12 }} label={{ value: 'Value-Added Ratio (%)', angle: 90, position: 'insideRight', fill: '#34d399', style: { textAnchor: 'middle' }, offset: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem' }}
                        labelStyle={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="avgLeadTime" name="Average Lead Time (Days)" stroke="#818cf8" strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="vaRatio" name="Value-Added Ratio (%)" stroke="#34d399" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Individual Process Trend Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processHeaders.map((key, index) => {
                  const hue = (index * 137.5) % 360; // Golden angle for distributed hues
                  const color = `hsl(${hue}, 80%, 65%)`;
                  const label = PROCESS_NAMES[key] || key;
                  return (
                  <div key={key} className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-5 transition-transform hover:-translate-y-1 duration-300">
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
                      {label} Trend
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickMargin={8} />
                          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem', fontSize: '12px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#818cf8', marginBottom: '4px' }}
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                          />
                          {['I', 'H', 'R', 'T', 'J', 'OTHER'].filter(s => visibleStatuses[s]).map(s => (
                            <Bar key={s} dataKey={`${key}_${s}`} name={STAT_LABELS[s]} stackId="a" fill={STAT_COLORS[s]} maxBarSize={40} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tire Movement Tracker */}
      {dailyLogs.length > 0 && (
        <div className="mt-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-8 animate-fade-in">
        <div className="p-5 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <History size={18} className="text-indigo-400" />
              Tire Movement Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-1">Search for a tire across all uploaded daily logs to track its status changes</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Enter BARCODE or MATERIAL ID" 
              value={searchBarcode}
              onChange={(e) => setSearchBarcode(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-200 outline-none w-full sm:w-64 transition-colors"
            />
          </div>
        </div>
        
        {searchBarcode && (
          <div className="p-6">
            {trackerResults.length > 0 ? (
              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
                {trackerResults.map((res, i) => (
                  <div key={i} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4 border-slate-900 ${res.tire ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm">{res.date}</span>
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-800/50">
                          {res.fileName}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                      {res.tire ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                <Activity size={16} className="text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 font-semibold mb-0.5">Current Process</div>
                                <div className="text-sm font-bold text-slate-200">{res.tire.CURRENT_PROCESS || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
                            
                            <div>
                              <div className="text-xs text-slate-500 font-semibold mb-0.5">Status</div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase inline-block ${
                                  res.tire.STAT === 'I' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  res.tire.STAT === 'H' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                  res.tire.STAT === 'R' ? 'bg-amber-600/10 text-amber-500 border-amber-600/20' :
                                  res.tire.STAT === 'T' ? 'bg-slate-350/10 text-slate-350 border-slate-300/20' :
                                  res.tire.STAT === 'J' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-slate-800 text-slate-400 border-slate-700/50'
                                }`}>
                                {res.tire.STAT === 'I' ? 'In Process' :
                                 res.tire.STAT === 'H' ? 'Hold' :
                                 res.tire.STAT === 'R' ? 'Reprocess' :
                                 res.tire.STAT === 'T' ? 'Tech' :
                                 res.tire.STAT === 'J' ? 'Reject' : (res.tire.STAT || 'UNKNOWN')}
                              </span>
                            </div>

                            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

                            <div>
                              <div className="text-xs text-slate-500 font-semibold mb-0.5">Days in Process</div>
                              <div className="text-sm font-mono text-slate-300">{res.tire.DAYS_IN_PROCESS || 0}</div>
                            </div>
                          </div>

                          {/* Dynamic Metadata Details Grid */}
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 border-t border-slate-800/40 pt-3 mt-1 w-full">
                            {Object.keys(res.tire)
                              .filter(key => !['CURRENT_PROCESS', 'STAT', 'DAYS_IN_PROCESS', 'HOLD_REJECT_REASON', ...processHeaders].includes(key))
                              .map(key => {
                                const val = res.tire[key];
                                if (val === undefined || val === null || String(val).trim() === '') return null;
                                return (
                                  <div key={key} className="flex gap-1.5">
                                    <span className="text-slate-500 font-medium">{key}:</span>
                                    <span className="text-slate-300 font-bold">{String(val)}</span>
                                  </div>
                                );
                              })}
                            {res.tire.HOLD_REJECT_REASON && res.tire.HOLD_REJECT_REASON !== 'N/A' && (
                              <div className="flex gap-1.5 text-yellow-500 font-medium">
                                <span>Defect Reason:</span>
                                <span className="font-bold">{res.tire.HOLD_REJECT_REASON}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No record found for this tire on this date.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No logs found. Upload multiple CSV logs to track movement.</div>
            )}
          </div>
        )}
      </div>
      )}

    </div>
  );
}
