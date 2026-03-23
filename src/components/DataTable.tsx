import React, { useState, useEffect, useRef } from 'react';
import { PROCESS_NAMES } from '../constants';
import { RetreadData } from '../types';

interface DataTableProps {
  selectedProcess: string;
  selectedOrders: RetreadData[];
}

export default function DataTable({ selectedProcess, selectedOrders }: DataTableProps) {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Click outside to close filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFilterToggle = (header: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openFilter === header) {
      setOpenFilter(null);
    } else {
      setOpenFilter(header);
      if (!filters[header]) {
        setFilters({ ...filters, [header]: [] });
      }
    }
  };

  const handleCheckboxChange = (header: string, val: string, checked: boolean) => {
    const allValues = Array.from(new Set(selectedOrders.map(o => String(o[header]))));
    const current = filters[header].length === 0 ? allValues : filters[header];
    let next;

    if (checked) {
      next = [...current, val];
    } else {
      next = current.filter(v => v !== val);
    }

    if (next.length === allValues.length) {
      next = [];
    }

    setFilters({ ...filters, [header]: next });
  };

  const clearFilter = (header: string) => {
    const newFilters = { ...filters };
    delete newFilters[header];
    setFilters(newFilters);
  };

  const filteredOrders = selectedOrders.filter(order =>
    Object.keys(filters).every(header =>
      filters[header].length === 0 || filters[header].includes(String(order[header]))
    )
  );

  if (selectedOrders.length === 0) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 text-center text-slate-400">
        No orders found for {PROCESS_NAMES[selectedProcess]}.
      </div>
    );
  }

  const headers = Object.keys(selectedOrders[0]);

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Orders in {selectedProcess} ({PROCESS_NAMES[selectedProcess]})</h2>
        <span className="text-sm text-slate-400">Showing {filteredOrders.length} / {selectedOrders.length}</span>
      </div>
      <div className="overflow-x-auto relative" ref={filterRef}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {headers.map(header => (
                <th key={header} className="pb-2 px-2 font-semibold text-slate-300 relative">
                  <div className="flex items-center gap-1">
                    {header}
                    <button
                      onClick={(e) => handleFilterToggle(header, e)}
                      className={`text-xs p-1 rounded hover:bg-slate-700 ${filters.hasOwnProperty(header) && filters[header].length > 0 ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                      ▼
                    </button>
                  </div>
                  {openFilter === header && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700 shadow-xl p-3 rounded-md w-56 max-h-60 flex flex-col">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                         <span className="text-xs font-semibold text-slate-200">Filter {header}</span>
                         <button onClick={() => clearFilter(header)} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {Array.from(new Set(selectedOrders.map(o => String(o[header])))).sort().map(val => (
                          <label key={val} className="flex items-center gap-2 text-xs py-1.5 cursor-pointer hover:bg-slate-700 text-slate-200 px-1 rounded">
                            <input
                              type="checkbox"
                              checked={filters[header]?.length === 0 || filters[header]?.includes(val)}
                              onChange={(e) => handleCheckboxChange(header, val, e.target.checked)}
                              className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
                            />
                            <span className="truncate">{val}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                {headers.map(header => (
                  <td key={header} className="py-2 px-2 text-xs font-mono text-slate-400">{String(order[header])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
