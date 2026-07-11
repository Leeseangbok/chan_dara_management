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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Report</h2>
              <p className="text-xs text-gray-500">Download Excel report by period</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Filter Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Filter Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setFilterType('day')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${filterType === 'day' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Specific Day
              </button>
              <button 
                onClick={() => setFilterType('month')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${filterType === 'month' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Specific Month
              </button>
              <button 
                onClick={() => setFilterType('year')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${filterType === 'year' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Specific Year
              </button>
              <button 
                onClick={() => setFilterType('range')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${filterType === 'range' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Custom Range
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dynamic Inputs */}
          <div>
            {filterType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="date" 
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            )}
            
            {filterType === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="month" 
                    value={singleMonth}
                    onChange={(e) => setSingleMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            )}

            {filterType === 'year' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="number" 
                    min="2000"
                    max="2100"
                    value={singleYear}
                    onChange={(e) => setSingleYear(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            )}

            {filterType === 'range' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
