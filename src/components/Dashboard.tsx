import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { retreadData } from '../data/retreadData';
import { PROCESS_NAMES, processHeaders } from '../constants';
import ProcessFlow from './ProcessFlow';
import ParetoChart from './ParetoChart';

export default function Dashboard() {
  const [data, setData] = useState<any[]>(retreadData);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [paretoKeys, setParetoKeys] = useState<string[]>(["SIZE", "STAT", "AIRLINE"]);
  const [paretoLimit, setParetoLimit] = useState<number>(10);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  useEffect(() => {
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const findMatch = (target: string) => headers.find(h => h.toUpperCase() === target) || headers[0];
      setParetoKeys([findMatch("SIZE"), findMatch("STAT"), findMatch("AIRLINE")]);
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
    <div className="p-6 bg-stone-50 min-h-screen font-sans text-stone-900">
      <h1 className="text-3xl font-bold mb-6 text-stone-900">Aero Retread Inventory Dashboard</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">Upload CSV Data</label>
        <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8">
        <h2 className="text-sm font-medium text-stone-500 uppercase">Total Inventory</h2>
        <p className="text-4xl font-semibold text-stone-800">{totalInventory}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">Completed (C)</h2>
          <p className="text-2xl font-semibold text-stone-700">{statusCounts.C}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">Hold (H)</h2>
          <p className="text-2xl font-semibold text-yellow-500">{statusCounts.H}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">Reprocess (R)</h2>
          <p className="text-2xl font-semibold text-stone-700">{statusCounts.R}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">In Process (I)</h2>
          <p className="text-2xl font-semibold text-green-700">{statusCounts.I}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">Tech (T)</h2>
          <p className="text-2xl font-semibold text-black">{statusCounts.T}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-xs font-medium text-stone-500 uppercase">Reject (J)</h2>
          <p className="text-2xl font-semibold text-red-700">{statusCounts.J}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 h-96">
        <h2 className="text-lg font-semibold mb-4">Inventory by Process & Status</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processInventory} onClick={(data) => {
            if (data && data.activeLabel) {
              const initial = Object.keys(PROCESS_NAMES).find(key => PROCESS_NAMES[key] === data.activeLabel);
              if (initial) setSelectedProcess(initial);
            }
          }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fullName" tick={{ fontSize: 8 }} height={80} interval={0} dy={15} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="C" stackId="a" fill="#57534e" name="Completed (C)" />
            <Bar dataKey="H" stackId="a" fill="#eab308" name="Hold (H)" />
            <Bar dataKey="R" stackId="a" fill="#854d0e" name="Reprocess (R)" />
            <Bar dataKey="I" stackId="a" fill="#15803d" name="In Process (I)" />
            <Bar dataKey="T" stackId="a" fill="#000000" name="Tech (T)" />
            <Bar dataKey="J" stackId="a" fill="#b91c1c" name="Reject (J)" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paretoKeys.map((key, index) => (
              <div key={index} className="space-y-2">
                <select 
                  value={key} 
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
          <h2 className="text-lg font-semibold">Detailed Process Inventory</h2>
          <button className="text-sm text-slate-500">{isDetailsExpanded ? 'Collapse' : 'Expand'}</button>
        </div>
        {isDetailsExpanded && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3">Process</th>
              <th className="pb-3">Full Name</th>
              <th className="pb-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {processInventory.map(p => (
              <tr key={p.name} onClick={() => setSelectedProcess(p.name)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 font-mono font-bold text-indigo-600">{p.name}</td>
                <td className="py-3 text-slate-600">{p.fullName}</td>
                <td className="py-3 text-indigo-600 font-semibold">{p.C + p.H + p.R + p.I + p.T + p.J}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {selectedProcess && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Orders in {selectedProcess} ({PROCESS_NAMES[selectedProcess]})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {selectedOrders.length > 0 && Object.keys(selectedOrders[0]).map(header => (
                    <th key={header} className="pb-2 px-2 font-semibold text-slate-700">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedOrders.map((order, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                    {Object.keys(order).map(header => (
                      <td key={header} className="py-2 px-2 text-xs font-mono text-slate-600">{String(order[header])}</td>
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
