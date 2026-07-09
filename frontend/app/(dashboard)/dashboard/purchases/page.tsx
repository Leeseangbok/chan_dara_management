"use client";

import { useState, useEffect } from "react";
import { purchasesApi } from "@/lib/api/purchases";
import { PurchaseOrder } from "@/lib/api/types";
import { Plus, Search, Loader2, PackageSearch, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import React from "react";

export default function PurchasesPage() {
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const data = await purchasesApi.list();
      setPurchases(data);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (poId: string) => {
    if (!window.confirm("Are you sure you want to mark this PO as received? This will update inventory stock and average cost.")) return;

    setActionLoading(poId);
    try {
      await purchasesApi.markReceived(poId);
      toast.success("Purchase Order received and inventory updated!");
      fetchPurchases();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to receive PO");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (poId: string) => {
    if (!window.confirm("Are you sure you want to cancel this PO?")) return;

    setActionLoading(poId);
    try {
      await purchasesApi.markCancelled(poId);
      toast.success("Purchase Order cancelled");
      fetchPurchases();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel PO");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPo(expandedPo === id ? null : id);
  };

  const filteredPurchases = purchases.filter(p =>
    p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.purchasesOverview}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.purchasesSub}</p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t.newPo}</span>
        </Link>
      </div>

      <div className="relative max-w-md text-gray-700">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by PO number or supplier..."
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
                <th className="px-6 py-4">{t.poNumber}</th>
                <th className="px-6 py-4">{t.supplier}</th>
                <th className="px-6 py-4">{t.date}</th>
                <th className="px-6 py-4">{t.totalAmount}</th>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <React.Fragment key={po.id}>
                    <tr className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => toggleExpand(po.id)}>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        {expandedPo === po.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                        )}
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{po.supplier.name}</div>
                        <div className="text-xs text-gray-500">{po.supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ${po.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                          po.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {po.status === 'PENDING' && (
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleReceive(po.id)}
                              disabled={actionLoading === po.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                            >
                              {actionLoading === po.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Receive
                            </button>
                            <button
                              onClick={() => handleCancel(po.id)}
                              disabled={actionLoading === po.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-200"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-sm text-gray-500 italic">Added to Inventory</span>
                        )}
                      </td>
                    </tr>

                    {expandedPo === po.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                              <span>Order Details</span>
                              {po.createdBy && <span className="text-xs font-normal text-gray-500">Created by: {po.createdBy}</span>}
                            </h4>
                            {po.notes && (
                              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="font-medium text-gray-900 mr-2">Notes:</span> {po.notes}
                              </p>
                            )}
                            <div className="overflow-hidden rounded-lg border border-gray-100">
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-500 font-medium">
                                    <th className="px-4 py-2">Product</th>
                                    <th className="px-4 py-2 text-right">Quantity</th>
                                    <th className="px-4 py-2 text-right">Unit Cost</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {po.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-medium text-gray-900">{item.productName}</td>
                                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                                      <td className="px-4 py-2 text-right">${item.unitCost.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-right font-medium text-gray-900">${item.subtotal.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
