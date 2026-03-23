import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { retreadData } from '../data/retreadData';
import { PROCESS_NAMES, processHeaders } from '../constants';
import ProcessFlow from './ProcessFlow';
import ParetoChart from './ParetoChart';
import SummaryCards from './SummaryCards';
import InventoryChart from './InventoryChart';
import DataTable from './DataTable';
import { RetreadData, ProcessInventoryCounts } from '../types';

export default function Dashboard() {
  function processData(rawData: any[]): RetreadData[] {
    if (!rawData || rawData.length === 0) return [];

    // 1. Trim headers and create new objects with trimmed keys
    const trimmedData = rawData.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim()] = row[key];
      });
      return newRow as RetreadData;
    });

    const columnsToFill = ["MATERIAL", "SIZE", "CUSTOMER", "AIRLINE"];
    const lastValues: Record<string, any> = {};
    
    return trimmedData.map((row) => {
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

      return processedRow;
    });
  }

  const [data, setData] = useState<RetreadData[]>(() => processData(retreadData));
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [paretoKeys, setParetoKeys] = useState<string[]>(["SIZE", "STAT"]);
  const [paretoLimit, setParetoLimit] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({
    H: true,
    R: true,
    I: true,
    T: true,
    J: true,
  });

  const toggleStatus = useCallback((status: string) => {
    setVisibleStatuses(prev => ({ ...prev, [status]: !prev[status] }));
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const findMatch = (target: string) => headers.find(h => h.toUpperCase() === target) || headers[0];
      setParetoKeys([findMatch("SIZE"), findMatch("STAT")]);
    }
  }, [data]);

  const availableHeaders = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

  const handleKeyChange = useCallback((index: number, key: string) => {
    setParetoKeys(prev => {
      const newKeys = [...prev];
      newKeys[index] = key;
      return newKeys;
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setData(processData(results.data));
            setSelectedProcess(null);
          } else {
            setError("The uploaded CSV file is empty or invalid.");
          }
          setIsLoading(false);
        },
        error: (err) => {
          setError(`Error parsing CSV: ${err.message}`);
          setIsLoading(false);
        }
      });
    }
  };

  const processInventory = useMemo<ProcessInventoryCounts[]>(() => {
    return processHeaders.map(header => {
      const counts = { C: 0, R: 0, I: 0, T: 0, J: 0, H: 0 };
      data.forEach(item => {
        let currentProcess = null;
        for (let i = processHeaders.length - 1; i >= 0; i--) {
          const proc = processHeaders[i];
          const status = item[proc];
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
  }, [data]);

  const totalInventory = useMemo(() => {
    return processInventory.reduce((acc, curr) => acc + curr.C + curr.R + curr.I + curr.T + curr.J + curr.H, 0);
  }, [processInventory]);

  const statusCounts = useMemo(() => {
    const counts = { C: 0, R: 0, I: 0, T: 0, J: 0, H: 0 };
    data.forEach(item => {
      const stat = item["STAT"];
      if (stat && counts.hasOwnProperty(stat)) {
        counts[stat as keyof typeof counts]++;
      }
    });
    return counts;
  }, [data]);

  const selectedOrders = useMemo(() => {
    if (!selectedProcess) return [];
    return data.filter(item => {
      let currentProcess = null;
      for (let i = processHeaders.length - 1; i >= 0; i--) {
        const proc = processHeaders[i];
        const status = item[proc];
        if (status === 'C' || status === 'H') {
          currentProcess = proc;
          break;
        }
      }
      return currentProcess === selectedProcess;
    });
  }, [data, selectedProcess]);

  return (
    <div className="p-6 bg-slate-950 min-h-screen font-sans text-slate-100">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Aero Retread Inventory Dashboard</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Upload CSV Data</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full max-w-md text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 disabled:opacity-50"
          />
          {isLoading && <span className="text-sm text-indigo-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> Loading data...</span>}
        </div>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      <SummaryCards
        totalInventory={totalInventory}
        processInventory={processInventory}
        statusCounts={statusCounts}
      />

      <InventoryChart
        processInventory={processInventory}
        visibleStatuses={visibleStatuses}
        toggleStatus={toggleStatus}
        setSelectedProcess={setSelectedProcess}
      />

      <ProcessFlow
        processInventory={processInventory}
        onProcessClick={setSelectedProcess}
        selectedProcess={selectedProcess}
      />

      {selectedProcess && (
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-slate-700">Show Top:</label>
            <select 
              value={paretoLimit} 
              onChange={(e) => setParetoLimit(Number(e.target.value))}
              className="p-2 border border-slate-700 bg-slate-800 rounded-md text-sm text-slate-100"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={0}>All</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paretoKeys.map((key, index) => (
              <div key={index} className="space-y-2">
                <select 
                  value={key} 
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  className="w-full p-2 border border-slate-700 bg-slate-800 rounded-md text-sm text-slate-100"
                >
                  {availableHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <ParetoChart 
                  data={selectedOrders} 
                  title={`Pareto Chart of ${key} in ${selectedProcess}`} 
                  dataKey={key} 
                  nameKey="name" 
                  limit={paretoLimit === 0 ? undefined : paretoLimit}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProcess && (
        <DataTable
          key={selectedProcess}
          selectedProcess={selectedProcess}
          selectedOrders={selectedOrders}
        />
      )}
    </div>
  );
}
