"use client";

import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Loader2,
  Search,
  Receipt,
  ChevronDown,
  ChevronUp,
  Undo2,
  ArrowDownUp,
  Calendar
} from "lucide-react";
import React from "react";

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await transactionsApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };



  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchQuery.toLowerCase();
    const idMatch = tx.id.toLowerCase().includes(searchLower);
    const customerMatch = tx.customerName?.toLowerCase().includes(searchLower) || false;
    
    if (idMatch || customerMatch) return true;
    return false;
  }).filter(tx => applyDateFilter(tx.transactionDate, dateFilter));

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.transactionDate).getTime();
    const dateB = new Date(b.transactionDate).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.salesHistory}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.salesHistorySub}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="relative w-full sm:w-80 text-gray-700">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
          <input
            type="text"
            placeholder={t.searchSales}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />

          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 transition-colors"
            title="Toggle sort order"
          >
            <ArrowDownUp className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm font-medium">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">{t.receiptId}</th>
                <th className="px-6 py-4">{t.date}</th>
                <th className="px-6 py-4">{t.customers}</th>
                <th className="px-6 py-4 text-center">{t.payment}</th>
                <th className="px-6 py-4 text-right">{t.totalAmount}</th>
                <th className="px-6 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading sales history...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/sales/${tx.id}`)}
                    >
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                          <Search className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">
                        #{tx.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(tx.transactionDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{tx.customerName || <span className="text-gray-400 italic">Walk-in</span>}</span>
                          {tx.customerAddress && <span className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{tx.customerAddress}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {tx.paymentMethod}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tx.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {tx.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-gray-900">{formatCurrency(tx.totalAmount)}</span>
                          {tx.paymentStatus === 'UNPAID' && (tx.paidAmount || 0) > 0 && (
                            <span className="text-xs text-red-500 font-medium">
                              Due: {formatCurrency(Math.max(0, tx.totalAmount - (tx.paidAmount || 0)))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                          title="View Details"
                          onClick={() => router.push(`/dashboard/sales/${tx.id}`)}
                        >
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
