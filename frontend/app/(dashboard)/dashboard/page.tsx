"use client";

import {
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  Clock,
  Loader2,
  Receipt,
  TrendingDown,
  Archive,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Banknote,
  Smartphone,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { reportApi } from "@/lib/api/reports";
import { DashboardMetricsResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import { ExportReportModal } from "@/components/ExportReportModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { DeliveryBoard } from "@/components/ui/DeliveryBoard";
import { TransactionResponse } from "@/lib/api/types";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

type Timeframe = "today" | "month" | "year";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accentFrom,
  accentTo,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 overflow-hidden group hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300">
      {/* Top gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentFrom} ${accentTo} rounded-t-2xl`} />
      {/* Ambient glow blob */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${accentFrom} ${accentTo} opacity-[0.07] blur-2xl group-hover:opacity-[0.12] transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl ${iconBg} border border-current/10 flex items-center justify-center shrink-0 ml-4`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchDashboardData = () => {
    Promise.all([
      transactionsApi.getDashboardMetrics(),
      transactionsApi.getPendingDeliveries()
    ])
      .then(([metricsData, deliveriesData]) => {
        setMetrics(metricsData);
        setPendingDeliveries(deliveriesData.filter(d => d.deliveryStatus !== "DELIVERED" && d.deliveryStatus !== "CANCELLED"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const getMetricsForTimeframe = () => {
    if (!metrics) return { revenue: 0, expenses: 0, purchases: 0, profit: 0, transactions: 0 };
    switch (timeframe) {
      case "year":
        return {
          revenue: metrics.thisYearRevenue,
          expenses: metrics.thisYearExpense,
          purchases: metrics.thisYearPurchases,
          profit: metrics.thisYearProfit,
          transactions: metrics.thisYearTransactionsCount,
        };
      case "month":
        return {
          revenue: metrics.thisMonthRevenue,
          expenses: metrics.thisMonthExpense,
          purchases: metrics.thisMonthPurchases,
          profit: metrics.thisMonthProfit,
          transactions: metrics.thisMonthTransactionsCount,
        };
      case "today":
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

  const timeframeBtns: { key: Timeframe; label: string }[] = [
    { key: "today",  label: t.today },
    { key: "month",  label: t.thisMonth },
    { key: "year",   label: t.thisYear },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 sm:p-8 overflow-hidden shadow-lg shadow-brand-500/20"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-200" />
              <span className="text-sm font-medium text-brand-100 uppercase tracking-wider">Welcome back</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2 flex items-center flex-wrap gap-2">
              Hello, 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-white capitalize">
                {user?.username || 'Admin'}
              </span>
              !
              <motion.span 
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1, ease: "easeInOut" }}
                className="inline-block origin-[70%_70%] ml-1"
              >
                👋
              </motion.span>
            </h1>
            <p className="text-brand-100 max-w-xl text-sm sm:text-base leading-relaxed">
              {t.dashboardSub || "Here's what's happening with your store today. Keep up the great work!"}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden sm:flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-xl border border-white/20 shadow-inner"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-brand-100 font-medium mt-0.5">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Page Header Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.dashboardOverview}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl
              bg-gradient-to-r from-emerald-500 to-teal-600
              shadow-[0_0_16px_rgba(16,185,129,0.25)]
              hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]
              transition-all duration-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </motion.button>

          {/* Timeframe selector */}
          <div className="flex bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] p-1 rounded-xl gap-1">
            {timeframeBtns.map(({ key, label }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeframe(key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  timeframe === key
                    ? "bg-white dark:bg-indigo-500/[0.18] text-slate-900 dark:text-indigo-300 shadow-sm dark:shadow-none border border-slate-200/60 dark:border-indigo-500/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label={t.revenue}
            value={formatCurrency(currentMetrics.revenue)}
            icon={TrendingUp}
            accentFrom="from-emerald-400"
            accentTo="to-teal-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/[0.12]"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            label={t.purchasesCogs || "Purchases (COGS)"}
            value={formatCurrency(currentMetrics.purchases)}
            icon={Package}
            accentFrom="from-amber-400"
            accentTo="to-orange-500"
            iconBg="bg-amber-50 dark:bg-amber-500/[0.12]"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            label={t.expenses || "Expenses"}
            value={formatCurrency(currentMetrics.expenses)}
            icon={TrendingDown}
            accentFrom="from-rose-400"
            accentTo="to-red-500"
            iconBg="bg-rose-50 dark:bg-rose-500/[0.12]"
            iconColor="text-rose-600 dark:text-rose-400"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            label={t.profit}
            value={formatCurrency(currentMetrics.profit)}
            icon={DollarSign}
            accentFrom="from-indigo-400"
            accentTo="to-violet-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/[0.12]"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
        </motion.div>
      </motion.div>

      {/* ── Secondary Row ────────────────────────────────────────────────── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >

        {/* Left column: Inventory + Debts */}
        <div className="space-y-5">

          {/* Inventory card */}
          <motion.div variants={itemVariants} className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 overflow-hidden hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-2xl" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/[0.1] flex items-center justify-center">
                <Archive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t.inventory || "Inventory"}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.05]">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t.inventoryValue}</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {metrics ? formatCurrency(metrics.totalInventoryValue) : "$0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-white/[0.05]">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t.totalProductsLabel || "Total Products"}</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{metrics?.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-amber-600 dark:text-amber-400">{t.lowStockAlerts}</span>
                <span className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${
                  (metrics?.lowStockProductsCount || 0) > 0
                    ? "bg-amber-100 dark:bg-amber-500/[0.15] text-amber-700 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400"
                }`}>
                  {metrics?.lowStockProductsCount || 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Outstanding debts card */}
          <motion.div variants={itemVariants} className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 overflow-hidden hover:border-rose-300 dark:hover:border-rose-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-red-500 rounded-t-2xl" />
            <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-rose-500/[0.05] blur-2xl" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/[0.1] flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              {t.outstandingDebts}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1">
                  {t.unpaidAccounts}
                </p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {metrics ? formatCurrency(metrics.totalUnpaidSales) : "$0.00"}
                </p>
              </div>
              <div className="pt-3 border-t border-rose-100 dark:border-rose-500/[0.12]">
                <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-1">
                  {t.unpaidPurchases || "Unpaid Purchases"}
                </p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                  {metrics ? formatCurrency(metrics.totalUnpaidPurchases) : "$0.00"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Recent Transactions */}
        <motion.div variants={itemVariants} className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 lg:col-span-2 flex flex-col h-[525px] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-400 to-violet-500 rounded-t-2xl" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.12] border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.recentTransactions}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.latestSales}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-slate-500">{t.transactionsToday || "Transactions"}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">
                {currentMetrics.transactions}
              </p>
            </div>
          </div>

          {/* Transaction list */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2"
          >
            {!metrics?.recentTransactions || metrics.recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 py-12">
                <Clock className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t.noRecentTransactions}</p>
              </div>
            ) : (
              metrics.recentTransactions.map((tx) => (
                <motion.div
                  variants={itemVariants}
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.05] hover:border-slate-200 dark:hover:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Payment method icon */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.07] flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      {tx.paymentMethod === "CASH"
                        ? <Banknote className="w-4 h-4" />
                        : <Smartphone className="w-4 h-4" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tx.customerName || t.walkInCustomer}
                      </p>
                      {(tx.deliveryLocation || tx.customerAddress) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5">
                          📍 {tx.deliveryLocation || tx.customerAddress}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(tx.transactionDate).toLocaleString()} · #{tx.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(tx.totalAmount)}
                    </p>
                    {tx.paymentStatus === "UNPAID" && (tx.paidAmount || 0) > 0 && (
                      <p className="text-xs text-rose-500 font-medium">
                        Due: {formatCurrency(Math.max(0, tx.totalAmount - (tx.paidAmount || 0)))}
                      </p>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      tx.paymentStatus === "PAID"
                        ? "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400"
                    }`}>
                      {tx.paymentStatus === "PAID"
                        ? <CheckCircle2 className="w-2.5 h-2.5" />
                        : <XCircle className="w-2.5 h-2.5" />
                      }
                      {tx.paymentStatus}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Third Row: Delivery Board ─────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="mt-8 relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 lg:col-span-2 hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-2xl" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/[0.12] border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.activeDeliveries}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t.liveDeliveryBoard}</p>
            </div>
          </div>
          <Link 
            href="/dashboard/deliveries" 
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 px-4 py-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl transition-colors"
          >
            {t.manageDeliveries}
          </Link>
        </div>
        <DeliveryBoard deliveries={pendingDeliveries} onUpdate={fetchDashboardData} />
      </motion.div>

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={reportApi.exportComprehensiveExcel}
      />
    </div>
  );
}