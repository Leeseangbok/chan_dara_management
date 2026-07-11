"use client";

import { useEffect, useState } from "react";
import { activityLogsApi } from "@/lib/api/activityLogs";
import { ActivityLogResponse } from "@/lib/api/types";
import { Loader2, Activity, User, PlusCircle, Pencil, Trash2, Tag, ShoppingCart, Users, HelpCircle, PackageOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DateRangeFilter, DateFilterState, applyDateFilter } from "@/components/ui/DateRangeFilter";

const actionConfig: Record<string, { color: string; bg: string }> = {
  CREATE: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/[0.1]" },
  UPDATE: { color: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-500/[0.1]" },
  DELETE: { color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/[0.1]" },
};

export default function ActivityLogPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: "all" });

  const filteredLogs = logs.filter((log) => applyDateFilter(log.createdAt, dateFilter));

  useEffect(() => {
    activityLogsApi.getRecentLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE": return <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case "UPDATE": return <Pencil className="w-3.5 h-3.5 text-indigo-500" />;
      case "DELETE": return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case "PRODUCT": return <Tag className="w-3.5 h-3.5 text-indigo-500" />;
      case "TRANSACTION": return <ShoppingCart className="w-3.5 h-3.5 text-sky-500" />;
      case "CUSTOMER": return <Users className="w-3.5 h-3.5 text-violet-500" />;
      case "INVENTORY": return <PackageOpen className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.activityLog}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.activityLogSub}</p>
        </div>
        <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" /><p className="text-sm">{t.loadingActivity}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600">
            <Activity className="w-12 h-12 mb-2 opacity-30" /><p className="text-sm">{t.noActivityForPeriod}</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-white/[0.07] ml-3 md:ml-4 space-y-6 pb-6">
            {filteredLogs.map((log) => {
              const cfg = actionConfig[log.action.toUpperCase()] || { color: "text-slate-500", bg: "bg-slate-50 dark:bg-white/[0.04]" };
              return (
                <div key={log.id} className="relative pl-7 md:pl-9">
                  {/* Timeline dot */}
                  <div className="absolute -left-[13px] md:-left-[17px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-[#0d0f18] border-2 border-slate-200 dark:border-white/[0.1] flex items-center justify-center shadow-sm">
                    {getActionIcon(log.action)}
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 hover:border-slate-200 dark:hover:border-white/[0.1] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.username}
                        </span>
                        <span className="text-xs text-slate-400">{t.performed}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400">{t.on}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/[0.1] px-2 py-0.5 rounded-md">
                          {getEntityIcon(log.entityType)}
                          {log.entityType}
                        </span>
                      </div>
                      <time className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] px-3 py-2 rounded-lg border border-slate-100 dark:border-white/[0.05]">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
