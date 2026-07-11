/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Loader2, Search, Receipt, ArrowDownUp, Banknote, Smartphone,
  CheckCircle2, XCircle, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DateRangeFilter, DateFilterState, applyDateFilter } from "@/components/ui/DateRangeFilter";

export default function SalesHistoryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: "all" });

  async function fetchTransactions() {
    try {
      const data = await transactionsApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);



  const filteredTransactions = transactions.filter(tx => {
    const s = searchQuery.toLowerCase();
    return tx.id.toLowerCase().includes(s) || (tx.customerName?.toLowerCase().includes(s) ?? false);
  }).filter(tx => applyDateFilter(tx.transactionDate, dateFilter));

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.transactionDate).getTime();
    const dateB = new Date(b.transactionDate).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.salesHistory}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.salesHistorySub}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t.searchSales}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all whitespace-nowrap"
          >
            <ArrowDownUp className="w-4 h-4" />
            <span className="hidden sm:inline">{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.receiptId}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.date}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.customers}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{t.payment}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.totalAmount}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm">Loading sales history…</p>
                </td></tr>
              ) : sortedTransactions.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-600">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No transactions found.</p>
                </td></tr>
              ) : (
                sortedTransactions.map((tx) => (
                  <tr key={tx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/sales/${tx.id}`)}>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      #{tx.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tx.customerName || <span className="text-slate-400 italic font-normal">Walk-in</span>}
                      </p>
                      {tx.customerAddress && <p className="text-xs text-slate-400 truncate max-w-[140px]">{tx.customerAddress}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                          {tx.paymentMethod === "CASH" ? <Banknote className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {tx.paymentMethod}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${tx.paymentStatus === "PAID"
                          ? "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400"}`}>
                          {tx.paymentStatus === "PAID" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {tx.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(tx.totalAmount)}</p>
                      {tx.paymentStatus === "UNPAID" && (tx.paidAmount || 0) > 0 && (
                        <p className="text-xs text-rose-500 font-medium tabular-nums">
                          Due: {formatCurrency(Math.max(0, tx.totalAmount - (tx.paidAmount || 0)))}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/dashboard/sales/${tx.id}`)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90"
                        title="View Details">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
