"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { ArrowLeft, Loader2, Receipt, Trash2, Edit2, Plus, DollarSign, Check } from "lucide-react";
import { EditTransactionModal } from "@/components/ui/EditTransactionModal";

export default function TransactionDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useLanguage();
  const { hasRole } = useAuth();

  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QR_CODE">("CASH");
  const [isPaying, setIsPaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const data = await transactionsApi.getById(id);
      setTransaction(data);
    } catch (error) {
      console.error("Failed to fetch transaction", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) return;
    try {
      setIsPaying(true);
      const updatedTx = await transactionsApi.addPayment(id, {
        amount: Number(paymentAmount),
        paymentMethod
      });
      setTransaction(updatedTx);
      setPaymentAmount("");
    } catch (error) {
      console.error("Failed to add payment", error);
      alert("Failed to add payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleSaveItems = async (newItems: any[]) => {
    try {
      const updatedTx = await transactionsApi.updateItems(id, {
        items: newItems,
        paymentMethod: transaction!.paymentMethod,
        paymentStatus: transaction!.paymentStatus,
        customerId: transaction!.customerId || undefined
      });
      setTransaction(updatedTx);
    } catch (e) {
      console.error(e);
      alert("Failed to update items.");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this transaction? This will revert inventory.")) {
      try {
        await transactionsApi.delete(id);
        router.push("/dashboard/sales");
      } catch (error) {
        console.error("Failed to delete", error);
        alert("Failed to delete transaction.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
        Transaction not found.
      </div>
    );
  }

  const dueAmount = Math.max(0, transaction.totalAmount - (transaction.paidAmount || 0));

  return (
    <div className="flex flex-col h-full bg-transparent p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/sales")}
            className="p-2 hover:bg-white dark:bg-slate-900 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:border-slate-800/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              Receipt #{transaction.id.substring(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {new Date(transaction.transactionDate).toLocaleString()} • Cashier: {transaction.cashierId.substring(0,8)}
            </p>
          </div>
        </div>
          {hasRole("ADMIN", "MANAGER") && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] rounded-xl text-sm font-semibold transition-all"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Items</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/[0.05] text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/[0.1] rounded-xl text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Items */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-transparent">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Purchased Items</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              transaction.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {transaction.paymentStatus}
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-sm font-medium">
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transaction.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-transparent">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">{item.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand-600 dark:text-brand-400">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Summary & Payment */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Summary</h3>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Customer</span>
              <span className="font-medium text-slate-900 dark:text-white">{transaction.customerName || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Payment Method</span>
              <span className="font-medium text-slate-900 dark:text-white">{transaction.paymentMethod}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Amount</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Paid Amount</span>
                <span className="font-bold text-green-600">{formatCurrency(transaction.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-white text-lg font-bold pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <span>Due Amount</span>
                <span className={dueAmount > 0 ? "text-red-600" : "text-slate-900 dark:text-white"}>{formatCurrency(dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Add Payment Section */}
          {transaction.paymentStatus !== "PAID" && hasRole("ADMIN", "MANAGER") && dueAmount > 0 && (
            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-2xl border border-brand-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none p-6 space-y-4">
              <h3 className="text-lg font-bold text-brand-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Log Payment
              </h3>
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-1">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder={dueAmount.toString()}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "QR_CODE")}
                  className="w-full px-4 py-2 border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-900"
                >
                  <option value="CASH">Cash</option>
                  <option value="QR_CODE">QR Code</option>
                </select>
              </div>
              <button
                onClick={handleAddPayment}
                disabled={isPaying || !paymentAmount}
                className="w-full py-2 bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isPaying ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isEditing && (
        <EditTransactionModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          items={transaction.items}
          onSave={handleSaveItems}
        />
      )}
    </div>
  );
}
