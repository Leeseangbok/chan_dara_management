/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { purchasesApi } from "@/lib/api/purchases";
import { PurchaseOrder } from "@/lib/api/types";
import { Plus, Search, Loader2, PackageSearch, ChevronDown, ChevronUp, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { toPng } from 'html-to-image';
import { useRef } from "react";
import { motion } from "framer-motion";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import React from "react";

export default function PurchasesPage() {
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const poImageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleExportImage = async (po: PurchaseOrder) => {
    const el = poImageRefs.current[po.id];
    if (!el) return toast.error("Could not generate image");
    try {
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `purchase-list-${po.poNumber}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Purchase list exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export image");
    }
  };

  async function fetchPurchases() {
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

  useEffect(() => {
    fetchPurchases();
  }, []);


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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.purchasesOverview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.purchasesSub}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
          <Link href="/dashboard/purchases/new"
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-indigo-500 to-violet-600
              shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
              transition-all">
            <Plus className="w-4 h-4" /> {t.newPo}
          </Link>
        </motion.div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input type="text" placeholder="Search by PO number or supplier…"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.poNumber}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.supplier}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.date}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.totalAmount}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.status}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No purchase orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <React.Fragment key={po.id}>
                    <tr className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => toggleExpand(po.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                          {expandedPo === po.id ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
                          <span className="font-mono text-sm">{po.poNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{po.supplier.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{po.supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          po.status === 'RECEIVED' ? 'bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400' :
                          po.status === 'PENDING'  ? 'bg-amber-100 dark:bg-amber-500/[0.12] text-amber-700 dark:text-amber-400' :
                                                     'bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400'
                        }`}>{po.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {po.status === 'PENDING' && (
                          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleReceive(po.id)} disabled={actionLoading === po.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/[0.18] rounded-lg text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-500/[0.2]">
                              {actionLoading === po.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Receive
                            </button>
                            <button onClick={() => handleCancel(po.id)} disabled={actionLoading === po.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/[0.1] text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/[0.18] rounded-lg text-xs font-semibold transition-colors border border-rose-200 dark:border-rose-500/[0.2]">
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        )}
                        {po.status === 'RECEIVED' && <span className="text-xs text-slate-400 dark:text-slate-500 italic">Added to Inventory</span>}
                      </td>
                    </tr>

                    {expandedPo === po.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-slate-50/50 dark:bg-white/[0.01]">
                          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.07] bg-white dark:bg-[#13161f]">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                              <span>Order Details</span>
                              <div className="flex items-center gap-4">
                                {po.createdBy && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Created by: {po.createdBy}</span>}
                                <button
                                  onClick={() => handleExportImage(po)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  Export List
                                </button>
                              </div>
                            </h4>
                            {po.notes && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                <span className="font-medium text-slate-900 dark:text-white mr-2">Notes:</span> {po.notes}
                              </p>
                            )}
                              <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/[0.07]">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.05] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                      <th className="px-4 py-2.5">Product</th>
                                      <th className="px-4 py-2.5 text-right">Quantity</th>
                                      <th className="px-4 py-2.5 text-right">Unit Cost</th>
                                      <th className="px-4 py-2.5 text-right">Delivery</th>
                                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04]">
                                    {po.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{item.productName}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{item.quantity}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(item.unitCost)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(item.deliveryCost || 0)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(item.subtotal)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                              </table>
                            </div>
                            {/* Hidden Div for Image Export */}
                            <div className="absolute -left-[9999px] top-0">
                              <div ref={(el) => { poImageRefs.current[po.id] = el; }} className="bg-white dark:bg-slate-900 p-8 w-[600px] border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-none">
                                <div className="text-center mb-6">
                                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase List</h2>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm">{po.supplier.name} - {new Date(po.createdAt).toLocaleDateString()}</p>
                                </div>
                                <table className="w-full text-left text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 font-medium">
                                      <th className="px-4 py-3">Item Name</th>
                                      <th className="px-4 py-3 text-right">Quantity</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {po.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="px-4 py-3 text-slate-900 dark:text-white text-lg">{item.productName}</td>
                                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-bold text-lg">{item.quantity}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
        </motion.div>
      </div>
    </div>
  );
}
