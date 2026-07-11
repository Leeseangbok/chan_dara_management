import { useState } from "react";
import { X, Calendar, Download, Loader2 } from "lucide-react";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (params: { startDate: string, endDate: string, title: string }) => Promise<void>;
}

type FilterType = 'day' | 'month' | 'year' | 'range';

export function ExportReportModal({ isOpen, onClose, onExport }: ExportReportModalProps) {
  const [filterType, setFilterType] = useState<FilterType>('day');
  
  // States for different types
  const [singleDate, setSingleDate] = useState("");
  const [singleMonth, setSingleMonth] = useState("");
  const [singleYear, setSingleYear] = useState(new Date().getFullYear().toString());
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    let startIso = "";
    let endIso = "";
    let title = "";

    try {
      if (filterType === 'day') {
        if (!singleDate) throw new Error("Please select a date");
        startIso = new Date(`${singleDate}T00:00:00`).toISOString();
        endIso = new Date(`${singleDate}T23:59:59.999`).toISOString();
        title = `Daily Report (${singleDate})`;
      } 
      else if (filterType === 'month') {
        if (!singleMonth) throw new Error("Please select a month");
        // singleMonth format: "YYYY-MM"
        const [year, month] = singleMonth.split('-');
        const startDateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDateObj = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        startIso = startDateObj.toISOString();
        endIso = endDateObj.toISOString();
        title = `Monthly Report (${singleMonth})`;
      }
      else if (filterType === 'year') {
        if (!singleYear) throw new Error("Please select a year");
        const startDateObj = new Date(parseInt(singleYear), 0, 1);
        const endDateObj = new Date(parseInt(singleYear), 11, 31, 23, 59, 59, 999);
        startIso = startDateObj.toISOString();
        endIso = endDateObj.toISOString();
        title = `Yearly Report (${singleYear})`;
      }
      else if (filterType === 'range') {
        if (!startDate || !endDate) throw new Error("Please select both start and end dates");
        startIso = new Date(`${startDate}T00:00:00`).toISOString();
        endIso = new Date(`${endDate}T23:59:59.999`).toISOString();
        title = `Custom Report (${startDate} to ${endDate})`;
      }

      setExporting(true);
      await onExport({ startDate: startIso, endDate: endIso, title });
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to generate report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Export Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download Excel report by period</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950 rounded-2xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Filter Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Filter Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setFilterType('day')}
                className={`px-4 py-2 text-sm font-medium rounded-2xl border transition-colors ${filterType === 'day' ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                Specific Day
              </button>
              <button 
                onClick={() => setFilterType('month')}
                className={`px-4 py-2 text-sm font-medium rounded-2xl border transition-colors ${filterType === 'month' ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                Specific Month
              </button>
              <button 
                onClick={() => setFilterType('year')}
                className={`px-4 py-2 text-sm font-medium rounded-2xl border transition-colors ${filterType === 'year' ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                Specific Year
              </button>
              <button 
                onClick={() => setFilterType('range')}
                className={`px-4 py-2 text-sm font-medium rounded-2xl border transition-colors ${filterType === 'range' ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                Custom Range
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Dynamic Inputs */}
          <div>
            {filterType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="date" 
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
              </div>
            )}
            
            {filterType === 'month' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Month</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="month" 
                    value={singleMonth}
                    onChange={(e) => setSingleMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
              </div>
            )}

            {filterType === 'year' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="number" 
                    min="2000"
                    max="2100"
                    value={singleYear}
                    onChange={(e) => setSingleYear(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
              </div>
            )}

            {filterType === 'range' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 rounded-2xl font-medium hover:bg-slate-50 dark:bg-slate-950 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:bg-brand-600 disabled:bg-brand-400 text-white rounded-2xl font-medium transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
