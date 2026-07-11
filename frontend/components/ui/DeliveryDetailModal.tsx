import { ModalPortal } from "@/components/ui/ModalPortal";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import { X, Truck, MapPin, Clock, Package, RefreshCw } from "lucide-react";
import { useState } from "react";
import { transactionsApi } from "@/lib/api/transactions";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import toast from "react-hot-toast";

interface DeliveryDetailModalProps {
  delivery: TransactionResponse;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function DeliveryDetailModal({ delivery, onClose, onStatusChange }: DeliveryDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TransactionResponse["deliveryStatus"]>(delivery.deliveryStatus || "PENDING");
  const { t } = useLanguage();

  const nextStatus = (current: string): TransactionResponse["deliveryStatus"] => {
    switch (current) {
      case "PENDING": return "PREPARING";
      case "PREPARING": return "IN_TRANSIT";
      default: return current as TransactionResponse["deliveryStatus"];
    }
  };

  const getNextStatusLabel = (current: string) => {
    switch (current) {
      case "PENDING": return t.startPreparing || "Start Preparing";
      case "PREPARING": return t.outForDelivery || "Out for Delivery";
      default: return t.update || "Update";
    }
  };

  const handleUpdateStatus = async (newStatus: TransactionResponse["deliveryStatus"]) => {
    if (!newStatus) return;
    setIsUpdating(true);
    try {
      await transactionsApi.updateDeliveryStatus(delivery.id, newStatus);
      setCurrentStatus(newStatus);
      toast.success(t.deliveryUpdated);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      toast.error(t.errorUpdatingDelivery);
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800/60 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.deliveryDetails}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">#{delivery.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.customer}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{delivery.customerName || t.walkInCustomer}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.status}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-md uppercase">
                    {currentStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.total}</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(delivery.totalAmount)}</span>
                </div>
                <div className="flex items-start gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{delivery.deliveryLocation || t.noLocationProvided}</p>
                </div>
                <div className="flex items-start gap-2 pt-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{new Date(delivery.transactionDate).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  {t.itemsLabel || "Items"}
                </h3>
                <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 max-h-40 overflow-y-auto">
                  {delivery.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{item.productName}</span>
                      <span className="font-medium text-slate-900 dark:text-white">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {currentStatus && currentStatus !== "IN_TRANSIT" && currentStatus !== "DELIVERED" && currentStatus !== "CANCELLED" && (
                <button
                  onClick={() => handleUpdateStatus(nextStatus(currentStatus))}
                  disabled={isUpdating}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {getNextStatusLabel(currentStatus)}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
