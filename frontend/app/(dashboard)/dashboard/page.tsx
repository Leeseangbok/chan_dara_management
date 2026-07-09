"use client";

import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  Clock,
  Loader2,
  Receipt,
  TrendingDown,
  Archive
} from "lucide-react";
import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { DashboardMetricsResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";

import { useLanguage } from "@/lib/i18n/LanguageContext";

type Timeframe = 'today' | 'month' | 'year';

export default function DashboardOverview() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');

  useEffect(() => {
    transactionsApi.getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Helper to extract the selected timeframe's data
  const getMetricsForTimeframe = () => {
    if (!metrics) return { revenue: 0, expenses: 0, purchases: 0, profit: 0, transactions: 0 };
    switch (timeframe) {
      case 'year':
        return {
          revenue: metrics.thisYearRevenue,
          expenses: metrics.thisYearExpense,
          purchases: metrics.thisYearPurchases,
          profit: metrics.thisYearProfit,
          transactions: metrics.thisYearTransactionsCount,
        };
      case 'month':
        return {
          revenue: metrics.thisMonthRevenue,
          expenses: metrics.thisMonthExpense,
          purchases: metrics.thisMonthPurchases,
          profit: metrics.thisMonthProfit,
          transactions: metrics.thisMonthTransactionsCount,
        };
      case 'today':
      default:
        return {
          revenue: metrics.todayRevenue,
          expenses: metrics.todayExpense,
          purchases: metrics.todayPurchases,
          profit: metrics.todayProfit,
          transactions: metrics.todayTransactionsCount,
        };
    }
  };

  const currentMetrics = getMetricsForTimeframe();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboardOverview}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.dashboardSub}</p>
        </div>

        {/* Timeframe Selector (Option A Implementation) */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.today}
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.thisMonth}
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${timeframe === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.thisYear}
          </button>
        </div>
      </div>

      {/* Financial Overview (Updates based on Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t.revenue}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(currentMetrics.revenue)}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t.purchasesCogs || 'Purchases (COGS)'}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(currentMetrics.purchases)}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-50 text-orange-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t.expenses || 'Expenses'}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(currentMetrics.expenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-b-4 border-b-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">{t.profit}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(currentMetrics.profit)}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inventory & Outstanding Debts Column */}
        <div className="lg:col-span-1 space-y-6">

          {/* Inventory Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5 text-indigo-500" />
              {t.inventory || 'Inventory'}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t.inventoryValue}</span>
                <span className="font-bold text-gray-900">{metrics ? formatCurrency(metrics.totalInventoryValue) : "$0.00"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t.totalProductsLabel || 'Total Products'}</span>
                <span className="font-bold text-gray-900">{metrics?.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center text-orange-600">
                <span className="text-sm">{t.lowStockAlerts}</span>
                <span className="font-bold">{metrics?.lowStockProductsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Outstanding Debts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 bg-red-50/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t.outstandingDebts}
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-red-600 uppercase tracking-wider mb-1">{t.unpaidAccounts}</span>
                <span className="text-2xl font-black text-red-600">
                  {metrics ? formatCurrency(metrics.totalUnpaidSales) : "$0.00"}
                </span>
              </div>
              <div className="pt-2 border-t border-red-100">
                <span className="block text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">{t.unpaidPurchases || 'Unpaid Purchases'}</span>
                <span className="text-xl font-bold text-orange-600">
                  {metrics ? formatCurrency(metrics.totalUnpaidPurchases) : "$0.00"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Transactions & Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col h-[525px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.recentTransactions}</h3>
                <p className="text-xs text-gray-500">{t.latestSales}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{t.transactionsToday || 'Transactions'}</p>
              <p className="text-xl font-bold text-gray-900">{currentMetrics.transactions}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {!metrics?.recentTransactions || metrics.recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p>{t.noRecentTransactions}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs shadow-sm">
                        {tx.paymentMethod === 'CASH' ? '💵' : '📱'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tx.customerName || t.walkInCustomer}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.transactionDate).toLocaleString()} • #{tx.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(tx.totalAmount)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${tx.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}