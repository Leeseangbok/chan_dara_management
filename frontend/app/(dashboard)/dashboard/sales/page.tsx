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
  Undo2
} from "lucide-react";
import React from "react";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SalesHistoryPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = (txId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(txId)) {
        newSet.delete(txId);
      } else {
        newSet.add(txId);
      }
      return newSet;
    });
  };

  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchQuery.toLowerCase();
    const idMatch = tx.id.toLowerCase().includes(searchLower);
    const customerMatch = tx.customerName?.toLowerCase().includes(searchLower) || false;
    return idMatch || customerMatch;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.salesHistory}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.salesHistorySub}</p>
        </div>
      </div>

      <div className="relative max-w-md text-gray-700">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
        <input
          type="text"
          placeholder={t.searchSales}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
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
                  const isExpanded = expandedRows.has(tx.id);
                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => toggleRow(tx.id)}
                      >
                        <td className="px-6 py-4">
                          <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">
                          #{tx.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(tx.transactionDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {tx.customerName || <span className="text-gray-400 italic">Walk-in</span>}
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
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="inline-flex items-center justify-center p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                            title="Return / Void Transaction"
                            onClick={() => alert("Return / Void feature will be implemented in Phase 2.")}
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="p-0 border-b-2 border-indigo-100">
                            <div className="px-16 py-6 bg-white shadow-inner">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-indigo-600" />
                                Receipt Details
                              </h4>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-500 border-b border-gray-100">
                                    <th className="pb-2 text-left font-medium">Item</th>
                                    <th className="pb-2 text-right font-medium">Price</th>
                                    <th className="pb-2 text-right font-medium">Qty</th>
                                    <th className="pb-2 text-right font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {tx.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-2 text-gray-900">{item.productName}</td>
                                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                      <td className="py-2 text-right font-medium text-gray-900">{item.quantity}</td>
                                      <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
