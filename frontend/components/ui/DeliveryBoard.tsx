import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import { Clock, Package, Truck, RefreshCw, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transactionsApi } from "@/lib/api/transactions";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import toast from "react-hot-toast";

interface DeliveryBoardProps {
  deliveries: TransactionResponse[];
  onUpdate: () => void;
}

// 1. We add the missing variables as props here
const Column = ({
  title,
  icon: Icon,
  items,
  colorClass,
  borderClass,
  t,
  updatingId,
  handleUpdateStatus,
  nextStatus,
  getNextStatusLabel
}: any) => (
  <div className={`flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border ${borderClass} overflow-hidden h-[500px]`}>
    <div className={`p-4 border-b ${borderClass} bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-10`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
        {items.length}
      </span>
    </div>
    <div className="p-4 flex-1 overflow-y-auto space-y-3 hide-scrollbar">
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <Icon className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">{t.empty}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {items.map((delivery: TransactionResponse) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={delivery.id} 
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{delivery.customerName || "Walk-in Customer"}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">#{delivery.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <p className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(delivery.totalAmount)}</p>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 space-y-1">
              <p className="line-clamp-2 leading-relaxed">{delivery.deliveryLocation}</p>
              <p className="text-xs text-slate-400">{new Date(delivery.transactionDate).toLocaleTimeString()}</p>
            </div>

            {delivery.deliveryStatus !== "IN_TRANSIT" && (
              <button
                onClick={() => handleUpdateStatus(delivery.id, nextStatus(delivery.deliveryStatus || "PENDING"))}
                disabled={updatingId === delivery.id}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/20 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {updatingId === delivery.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {getNextStatusLabel(delivery.deliveryStatus || "PENDING")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  </div>
);

export function DeliveryBoard({ deliveries, onUpdate }: DeliveryBoardProps) {
  const { t } = useLanguage();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pending = deliveries.filter(d => d.deliveryStatus === "PENDING");
  const preparing = deliveries.filter(d => d.deliveryStatus === "PREPARING");
  const outForDelivery = deliveries.filter(d => d.deliveryStatus === "IN_TRANSIT");

  const nextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDING": return "PREPARING";
      case "PREPARING": return "IN_TRANSIT";
      default: return currentStatus;
    }
  };

  const getNextStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return t.startPreparing || "Start Preparing";
      case "PREPARING": return t.outForDelivery || "Out for Delivery";
      default: return "";
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await transactionsApi.updateDeliveryStatus(id, newStatus);
      toast.success(t.deliveryUpdated);
      onUpdate();
    } catch (error) {
      toast.error(t.errorUpdatingDelivery);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Column
        title={t.pending}
        icon={Clock}
        items={pending}
        colorClass="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
        borderClass="border-amber-100 dark:border-amber-500/10"
        // 2. We pass the missing data down into the component here
        t={t}
        updatingId={updatingId}
        handleUpdateStatus={handleUpdateStatus}
        nextStatus={nextStatus}
        getNextStatusLabel={getNextStatusLabel}
      />
      <Column
        title={t.preparing}
        icon={Package}
        items={preparing}
        colorClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
        borderClass="border-blue-100 dark:border-blue-500/10"
        t={t}
        updatingId={updatingId}
        handleUpdateStatus={handleUpdateStatus}
        nextStatus={nextStatus}
        getNextStatusLabel={getNextStatusLabel}
      />
      <Column
        title={t.outForDelivery}
        icon={Truck}
        items={outForDelivery}
        colorClass="bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
        borderClass="border-brand-100 dark:border-brand-500/10"
        t={t}
        updatingId={updatingId}
        handleUpdateStatus={handleUpdateStatus}
        nextStatus={nextStatus}
        getNextStatusLabel={getNextStatusLabel}
      />
    </div>
  );
}
