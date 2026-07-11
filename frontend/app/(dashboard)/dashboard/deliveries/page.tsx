"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import { MapPin, Truck, CheckCircle2, Search, X, Package, Clock, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { DateRangeFilter, DateFilterState, applyDateFilter } from "@/components/ui/DateRangeFilter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type SortOption = "DATE_ASC" | "DATE_DESC" | "AMOUNT_DESC";

export default function DeliveriesPage() {
    const { logout } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [deliveries, setDeliveries] = useState<TransactionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: "all" });
    const [sortBy, setSortBy] = useState<SortOption>("DATE_ASC");

    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const loadDeliveries = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await transactionsApi.getPendingDeliveries();
            setDeliveries(data);
        } catch (error) {
            console.error("Failed to load deliveries:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDeliveries();

        // Polling every 10 seconds for new deliveries
        const interval = setInterval(loadDeliveries, 10000);
        return () => clearInterval(interval);
    }, [loadDeliveries]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            await transactionsApi.updateDeliveryStatus(id, newStatus);
            await loadDeliveries();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "PENDING":
                return { color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock, label: t.pending };
            case "PREPARING":
                return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package, label: t.preparing };
            case "READY":
                return { color: "bg-purple-100 text-purple-800 border-purple-200", icon: CheckCircle2, label: t.ready };
            case "IN_TRANSIT":
                return { color: "bg-brand-100 dark:bg-brand-900/50 text-brand-800 border-brand-200", icon: Truck, label: t.inTransit };
            default:
                return { color: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800/60", icon: Package, label: status === "DELIVERED" ? t.delivered : status };
        }
    };

    const nextStatus = (currentStatus: string) => {
        switch (currentStatus) {
            case "PENDING": return "PREPARING";
            case "PREPARING": return "IN_TRANSIT";
            default: return currentStatus;
        }
    };

    const getNextStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return t.startPreparing;
            case "PREPARING": return t.outForDelivery;
            default: return "";
        }
    };

    const filteredAndSortedDeliveries = useMemo(() => {
        let result = deliveries;

        // Apply Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (d) =>
                    d.id.toLowerCase().includes(query) ||
                    (d.customerName && d.customerName.toLowerCase().includes(query)) ||
                    (d.deliveryLocation && d.deliveryLocation.toLowerCase().includes(query))
            );
        }

        // Apply Date Filter
        result = result.filter(d => applyDateFilter(d.transactionDate, dateFilter));

        // Apply Sort
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.transactionDate).getTime();
            const dateB = new Date(b.transactionDate).getTime();
            if (sortBy === "DATE_ASC") return dateA - dateB;
            if (sortBy === "DATE_DESC") return dateB - dateA;
            if (sortBy === "AMOUNT_DESC") return b.totalAmount - a.totalAmount;
            return 0;
        });

        return result;
    }, [deliveries, searchQuery, dateFilter, sortBy]);

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 z-10 shrink-0">
                <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Truck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            {t.deliveries}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.deliveriesSub}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t.searchDeliveries}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-full sm:w-64 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block py-2 px-3"
                        >
                            <option value="DATE_ASC">{t.oldestFirst}</option>
                            <option value="DATE_DESC">{t.newestFirst}</option>
                            <option value="AMOUNT_DESC">{t.highestAmount}</option>
                        </select>

                        <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />

                        <button
                            onClick={loadDeliveries}
                            className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-brand-600 dark:text-brand-400' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 lg:p-6 max-w-7xl mx-auto w-full">
                {isLoading && deliveries.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
                    </div>
                ) : filteredAndSortedDeliveries.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t.noPendingDeliveries}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{t.noDeliveriesDesc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedDeliveries.map((delivery) => {
                            const config = getStatusConfig(delivery.deliveryStatus || "PENDING");
                            const StatusIcon = config.icon;
                            const isUpdating = updatingId === delivery.id;

                            return (
                                <div key={delivery.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-none transition-shadow overflow-hidden flex flex-col">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} mb-2`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {config.label}
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{delivery.customerName || t.walkInCustomer}</h3>
                                            </div>
                                            <span className="font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-xl text-sm">{formatCurrency(delivery.totalAmount)}</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{delivery.deliveryLocation}</p>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(delivery.transactionDate).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.itemsLabel}</p>
                                            <ul className="space-y-1.5">
                                                {delivery.items.map((item, idx) => (
                                                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex justify-between">
                                                        <span className="truncate pr-2">{item.quantity}x {item.productName}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 mt-auto">
                                        {delivery.deliveryStatus !== "IN_TRANSIT" && delivery.deliveryStatus !== "DELIVERED" && delivery.deliveryStatus !== "CANCELLED" && (
                                            <button
                                                onClick={() => handleUpdateStatus(delivery.id, nextStatus(delivery.deliveryStatus || "PENDING"))}
                                                disabled={isUpdating}
                                                className="w-full py-2.5 px-4 bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:bg-brand-600 text-white text-sm font-semibold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                                {getNextStatusLabel(delivery.deliveryStatus || "PENDING")}
                                            </button>
                                        )}
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
