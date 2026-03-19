import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import { retreadData } from '../data/retreadData';
import { PROCESS_NAMES, processHeaders } from '../constants';
import ProcessFlow from './ProcessFlow';
import ParetoChart from './ParetoChart';

export default function Dashboard() {
  const [data, setData] = useState<any[]>(retreadData);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [paretoKeys, setParetoKeys] = useState<string[]>(["SIZE", "STAT"]);
  const [paretoLimit, setParetoLimit] = useState<number>(10);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({
    H: true,
    R: true,
    I: true,
    T: true,
    J: true,
  });

  const toggleStatus = (status: string) => {
    setVisibleStatuses(prev => ({ ...prev, [status]: !prev[status] }));
  };

  useEffect(() => {
    setFilters({});
  }, [selectedProcess]);

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
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setSelectedProcess(null);
        },
      });
    }
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
        // Same logic to find current process
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
    : [];

  return (
    <div className="p-6 bg-slate-950 min-h-screen font-sans text-slate-100">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">Aero Retread Inventory Dashboard</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Upload CSV Data</label>
        <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700" />
      </div>

      <h2 className="text-lg font-semibold mb-4 text-slate-200">INVENTORY SUMMARY</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Total Inventory</h2>
          <p className="text-4xl font-semibold text-slate-100">{totalInventory}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Casing ready to buff</h2>
          <p className="text-4xl font-semibold text-slate-100">
            {(() => {
              const p = processInventory.find(item => item.name === 'HOT');
              return p ? (p.C + p.H + p.R + p.I + p.T + p.J) : 0;
            })()}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase">Green tire inventory</h2>
          <p className="text-4xl font-semibold text-slate-100">
            {(() => {
              const p = processInventory.find(item => item.name === 'ORB');
              return p ? (p.C + p.H + p.R + p.I + p.T + p.J) : 0;
            })()}
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

      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 mb-8 h-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Inventory by Process & Status</h2>
          <div className="flex gap-2">
            {Object.entries({ H: 'Hold', R: 'Reprocess', I: 'In Process', T: 'Tech', J: 'Reject' }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${visibleStatuses[key] ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processInventory} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} onClick={(data) => {
            if (data && data.activeLabel) {
              const initial = Object.keys(PROCESS_NAMES).find(key => PROCESS_NAMES[key] === data.activeLabel);
              if (initial) setSelectedProcess(initial);
            }
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="fullName" tick={{ fontSize: 8, fill: '#94a3b8' }} height={80} interval={0} dy={15} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ paddingTop: '20px', color: '#94a3b8', cursor: 'pointer' }} 
              onClick={(props: any) => {
                const statusMap: Record<string, string> = {
                  'Hold (H)': 'H',
                  'Reprocess (R)': 'R',
                  'In Process (I)': 'I',
                  'Tech (T)': 'T',
                  'Reject (J)': 'J'
                };
                const statusKey = statusMap[props.value];
                if (statusKey) {
                  toggleStatus(statusKey);
                }
              }}
            />
            {visibleStatuses.H && (
              <Bar dataKey="H" stackId="a" fill="#eab308" name="Hold (H)">
                {processInventory.map((entry, index) => (
                  <Cell key={`cell-${index}`} stroke="#000" strokeWidth={1} />
                ))}
              </Bar>
            )}
            {visibleStatuses.R && <Bar dataKey="R" stackId="a" fill="#a16207" name="Reprocess (R)" />}
            {visibleStatuses.I && <Bar dataKey="I" stackId="a" fill="#16a34a" name="In Process (I)" />}
            {visibleStatuses.T && <Bar dataKey="T" stackId="a" fill="#f8fafc" name="Tech (T)" />}
            {visibleStatuses.J && <Bar dataKey="J" stackId="a" fill="#dc2626" name="Reject (J)" />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ProcessFlow processInventory={processInventory} onProcessClick={setSelectedProcess} selectedProcess={selectedProcess} />


      {selectedProcess && (
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-slate-700">Show Top:</label>
            <select 
              value={paretoLimit} 
              onChange={(e) => setParetoLimit(Number(e.target.value))}
              className="p-2 border border-slate-300 rounded-md text-sm"
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
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Orders in {selectedProcess} ({PROCESS_NAMES[selectedProcess]})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {selectedOrders.length > 0 && Object.keys(selectedOrders[0]).map(header => (
                    <th key={header} className="pb-2 px-2 font-semibold text-slate-300 relative group">
                      <div className="flex items-center gap-1">
                        {header}
                        <button
                          onClick={() => {
                            const newFilters = { ...filters };
                            if (newFilters[header]) delete newFilters[header];
                            else newFilters[header] = [];
                            setFilters(newFilters);
                          }}
                          className={`text-xs ${filters.hasOwnProperty(header) ? 'text-indigo-400' : 'text-slate-500'}`}
                        >
                          ▼
                        </button>
                      </div>
                      {filters.hasOwnProperty(header) && (
                        <div className="absolute top-full left-0 z-10 bg-slate-800 border border-slate-700 shadow-lg p-2 rounded-md w-48 max-h-60 overflow-y-auto">
                          {Array.from(new Set(selectedOrders.map(o => String(o[header])))).sort().map(val => (
                            <label key={val} className="flex items-center gap-2 text-xs py-1 cursor-pointer hover:bg-slate-700 text-slate-200">
                              <input
                                type="checkbox"
                                checked={filters[header].length === 0 || filters[header].includes(val)}
                                onChange={(e) => {
                                  const allValues = Array.from(new Set(selectedOrders.map(o => String(o[header]))));
                                  const current = filters[header].length === 0 ? allValues : filters[header];
                                  let next;
                                  if (e.target.checked) {
                                    // Add to selected
                                    next = [...current, val];
                                  } else {
                                    // Remove from selected
                                    next = current.filter(v => v !== val);
                                  }
                                  // If all values are selected, we can clear the filter to indicate 'all'
                                  if (next.length === allValues.length) {
                                    next = [];
                                  }
                                  setFilters({ ...filters, [header]: next });
                                }}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedOrders
                  .filter(order =>
                    Object.keys(filters).every(header =>
                      filters[header].length === 0 || filters[header].includes(String(order[header]))
                    )
                  )
                  .map((order, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800">
                    {Object.keys(order).map(header => (
                      <td key={header} className="py-2 px-2 text-xs font-mono text-slate-400">{String(order[header])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
