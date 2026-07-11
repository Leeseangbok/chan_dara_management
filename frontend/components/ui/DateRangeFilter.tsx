import React from "react";
import { Calendar } from "lucide-react";

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "specific_date" | "date_range";

export interface DateFilterState {
  type: DateFilterType;
  specificDate?: string;
  startDate?: string;
  endDate?: string;
}

interface DateRangeFilterProps {
  filter: DateFilterState;
  onChange: (filter: DateFilterState) => void;
}

export function DateRangeFilter({ filter, onChange }: DateRangeFilterProps) {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, type: e.target.value as DateFilterType });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
      <div className="relative w-full sm:w-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-slate-400" />
        </div>
        <select
          className="w-full sm:w-44 pl-9 pr-3 py-2 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-900"
          value={filter.type}
          onChange={handleTypeChange}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="specific_date">Specific Date</option>
          <option value="date_range">Date Range</option>
        </select>
      </div>

      {filter.type === "specific_date" && (
        <input
          type="date"
          className="w-full sm:w-auto border border-slate-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
          value={filter.specificDate || ""}
          onChange={(e) => onChange({ ...filter, specificDate: e.target.value })}
        />
      )}

      {filter.type === "date_range" && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            className="w-full sm:w-auto border border-slate-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
            value={filter.startDate || ""}
            onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
            placeholder="Start"
          />
          <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
          <input
            type="date"
            className="w-full sm:w-auto border border-slate-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
            value={filter.endDate || ""}
            onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
            placeholder="End"
          />
        </div>
      )}
    </div>
  );
}

// Utility to filter data based on the selected filter state
export function applyDateFilter(itemDateIso: string, filter: DateFilterState): boolean {
  if (filter.type === "all") return true;

  const date = new Date(itemDateIso);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter.type) {
    case "today":
      return date.getTime() === today.getTime();
      
    case "this_week": {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      return date >= firstDay;
    }
      
    case "this_month": {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= firstDay;
    }
      
    case "specific_date": {
      if (!filter.specificDate) return true;
      const specific = new Date(filter.specificDate);
      specific.setHours(0, 0, 0, 0);
      return date.getTime() === specific.getTime();
    }
      
    case "date_range": {
      const start = filter.startDate ? new Date(filter.startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      
      const end = filter.endDate ? new Date(filter.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      if (start && end) return date >= start && date <= end;
      if (start) return date >= start;
      if (end) return date <= end;
      return true;
    }
      
    default:
      return true;
  }
}
