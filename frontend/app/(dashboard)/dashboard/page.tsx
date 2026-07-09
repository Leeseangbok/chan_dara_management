"use client";

import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  AlertCircle,
  Clock,
  Loader2,
  Receipt
} from "lucide-react";
import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { DashboardMetricsResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DashboardOverview() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = [
    { name: t.todaysSales, value: metrics ? formatCurrency(metrics.todaySalesTotal) : "$0.00", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { name: t.transactionsToday, value: metrics?.todayTransactionsCount || 0, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { name: t.totalCustomers, value: metrics?.totalCustomers || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: t.lowStockAlerts, value: metrics?.lowStockProductsCount || 0, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboardOverview}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.dashboardSub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unpaid Analytics Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t.outstandingDebts}</h3>
              <p className="text-xs text-gray-500">{t.unpaidAccounts}</p>
            </div>
          </div>
          <div className="text-center py-6 border-2 border-dashed border-red-100 rounded-xl bg-red-50/50">
            <span className="block text-sm font-medium text-red-600 uppercase tracking-wider mb-2">{t.totalUnpaid}</span>
            <span className="text-3xl font-black text-red-600">
              {metrics ? formatCurrency(metrics.totalUnpaidAmount) : "$0.00"}
            </span>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col h-[400px]">
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
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {!metrics?.recentTransactions || metrics.recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
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
                          {new Date(tx.transactionDate).toLocaleString()} • #{tx.id.substring(0,8).toUpperCase()}
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
