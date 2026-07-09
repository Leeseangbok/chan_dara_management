"use client";

import { useEffect, useState } from "react";
import { activityLogsApi } from "@/lib/api/activityLogs";
import { ActivityLogResponse } from "@/lib/api/types";
import { Loader2, Activity, User, PlusCircle, Pencil, Trash2, Tag, ShoppingCart, Users, HelpCircle, PackageOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DateRangeFilter, DateFilterState, applyDateFilter } from "@/components/ui/DateRangeFilter";

export default function ActivityLogPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: "all" });

  const filteredLogs = logs.filter((log) => applyDateFilter(log.createdAt, dateFilter));

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await activityLogsApi.getRecentLogs();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE": return <PlusCircle className="w-4 h-4 text-green-500" />;
      case "UPDATE": return <Pencil className="w-4 h-4 text-blue-500" />;
      case "DELETE": return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case "PRODUCT": return <Tag className="w-4 h-4 text-indigo-500" />;
      case "TRANSACTION": return <ShoppingCart className="w-4 h-4 text-indigo-500" />;
      case "CUSTOMER": return <Users className="w-4 h-4 text-indigo-500" />;
      case "INVENTORY": return <PackageOpen className="w-4 h-4 text-indigo-500" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track system events and user actions</p>
        </div>
        <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto min-h-[400px] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Loading activity logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity recorded for this period.</p>
            </div>
          ) : (
            <div className="relative border-l border-gray-200 ml-3 md:ml-6 space-y-8 pb-8">
              {filteredLogs.map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-3 md:-left-[13px] top-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  
                  {/* Log Content */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.username}
                        </span>
                        <span className="text-gray-400 text-sm">performed</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {log.action}
                        </span>
                        <span className="text-gray-400 text-sm">on</span>
                        <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {getEntityIcon(log.entityType)}
                          {log.entityType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
