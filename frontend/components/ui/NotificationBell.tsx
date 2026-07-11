"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, PackageSearch } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { transactionsApi } from "@/lib/api/transactions";
import { Product, TransactionResponse } from "@/lib/api/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { DeliveryDetailModal } from "./DeliveryDetailModal";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<TransactionResponse[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<TransactionResponse | null>(null);
  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has low stock alerts enabled
    const enabled = typeof window !== "undefined" ? localStorage.getItem("notif_low_stock") !== "false" : true;
    if (!enabled) return;

    // Fetch low stock items and pending deliveries
    let previousDeliveries: string[] = [];
    let initialLoad = true;

    const fetchNotifications = async () => {
      try {
        const [products, deliveries] = await Promise.all([
          productsApi.list(),
          transactionsApi.getPendingDeliveries()
        ]);

        const lowStock = products.filter(p => p.stockQuantity <= 10);
        setLowStockProducts(lowStock);

        let newDeliveries = deliveries.filter(d => d.deliveryStatus === "PENDING" || d.deliveryStatus === "PREPARING");
        // Sort by newest first
        newDeliveries.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        
        setPendingDeliveries(newDeliveries);

        // Check for newly added deliveries
        const currentDeliveryIds = newDeliveries.map(d => d.id);

        let added: TransactionResponse[] = [];
        if (initialLoad) {
          added = newDeliveries;
          initialLoad = false;
        } else {
          added = newDeliveries.filter(d => !previousDeliveries.includes(d.id));
        }

        if (added.length > 0) {
          toast.custom((t) => (
              <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} cursor-pointer max-w-sm w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors`}
                onClick={() => {
                  toast.dismiss(t.id);
                  if (added.length === 1) {
                    setSelectedDelivery(added[0]);
                  } else {
                    setIsOpen(true);
                  }
                }}
              >
                <div className="p-4 w-full">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Bell className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 pt-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        New Delivery Request!
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {added.length} new delivery order(s) pending.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ), { position: 'bottom-right', duration: 5000 });
        }

        previousDeliveries = currentDeliveryIds;
      } catch (error) {
        console.error(error);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(intervalId);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] rounded-lg transition-all active:scale-95"
        title={t.notifications}
      >
        <Bell className="w-4 h-4" />
        {(lowStockProducts.length > 0 || pendingDeliveries.length > 0) && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t.notifications}</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 && pendingDeliveries.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <PackageSearch className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {pendingDeliveries.map(delivery => (
                  <button
                    key={delivery.id}
                    onClick={() => {
                      setIsOpen(false);
                      setSelectedDelivery(delivery);
                    }}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="shrink-0 mt-0.5 p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Delivery Update</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold">{delivery.customerName || "Walk-in Customer"}</span> has a <span className="font-semibold lowercase">{delivery.deliveryStatus}</span> delivery.
                      </p>
                    </div>
                  </button>
                ))}

                {lowStockProducts.map(product => (
                  <Link
                    href="/dashboard/inventory"
                    key={product.id}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="shrink-0 mt-0.5 p-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Low Stock Alert</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold">{product.name}</span> is running low ({product.stockQuantity} remaining).
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </div>
  );
}
