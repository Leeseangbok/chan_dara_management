/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { customersApi } from "@/lib/api/customers";
import { Customer } from "@/lib/api/types";
import { Plus, Edit2, Trash2, Search, User, Loader2, X, Clock, ChevronRight } from "lucide-react";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { formatCurrency } from "@/lib/utils/currency";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── Shared input class ────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all placeholder-slate-400 dark:placeholder-slate-600";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

export default function CustomersPage() {
  const { t, language } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<TransactionResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try { setCustomers(await customersApi.list()); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    ), [customers, searchQuery]);

  const openCreateModal = () => { setForm({ name: "", phone: "", address: "", notes: "" }); setModalMode("create"); setSelectedCustomer(null); setIsModalOpen(true); };
  const openEditModal = (c: Customer) => { setForm({ name: c.name, phone: c.phone || "", address: c.address || "", notes: c.notes || "" }); setModalMode("edit"); setSelectedCustomer(c); setIsModalOpen(true); };

  const openHistoryModal = async (c: Customer) => {
    setSelectedCustomer(c); setHistoryModalOpen(true); setLoadingHistory(true);
    try { setCustomerHistory(await transactionsApi.getByCustomer(c.id)); }
    catch (e) { console.error(e); }
    finally { setLoadingHistory(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (modalMode === "create") await customersApi.create(form);
      else if (selectedCustomer) await customersApi.update(selectedCustomer.id, form);
      setIsModalOpen(false);
      await loadData();
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try { await customersApi.delete(id); await loadData(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.customersOverview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.customersSub}</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-indigo-500 to-violet-600
            shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
            hover:from-indigo-400 hover:to-violet-500 hover:-translate-y-px transition-all active:scale-95">
          <Plus className="w-4 h-4" /> {t.addCustomer}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input type="text" placeholder={t.searchCustomers} value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.customerName.replace(" *", "")}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.phone}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.address}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.totalUnpaid}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-500" />
                </td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400 dark:text-slate-600">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.noCustomersYet}</p>
                </td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredCustomers.map((c) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={c.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/[0.12] flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{c.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{c.address || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      {c.totalUnpaid > 0
                        ? <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(c.totalUnpaid)}</span>
                        : <span className="text-sm text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openHistoryModal(c)} className="p-2 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.1] transition-all active:scale-90" title="Transaction History"><Clock className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEditModal(c)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all active:scale-90" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden flex flex-col divide-y divide-slate-100/60 dark:divide-white/[0.04]">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-600">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t.noCustomersYet}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((c) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={c.id}
                  className="p-4 flex flex-col gap-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/[0.12] flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.name}</h4>
                        {c.phone && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">{t.totalUnpaid}</div>
                      {c.totalUnpaid > 0
                        ? <div className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(c.totalUnpaid)}</div>
                        : <div className="text-sm text-slate-300 dark:text-slate-600">—</div>}
                    </div>
                  </div>

                  {c.address && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {c.address}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-white/[0.04]">
                    <button onClick={() => openHistoryModal(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-violet-50 dark:hover:bg-violet-500/[0.1] transition-all">
                      <Clock className="w-3.5 h-3.5" />
                      History
                    </button>
                    <button onClick={() => openEditModal(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#13161f] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: language === "km" ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
                {modalMode === "create" ? t.addCustomer : "Edit Customer"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelCls}>{t.customerName}</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>{t.phone}</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>{t.address}</label><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls + " resize-none"} /></div>
              <div><label className={labelCls}>Notes</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
                  {t.cancel}
                </button>
                <button type="submit" disabled={isSubmitting || !form.name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none transition-all">
                  {isSubmitting ? t.processing : t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* History Modal */}
      {historyModalOpen && selectedCustomer && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#13161f] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction History</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {loadingHistory ? (
                <div className="py-12 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>
              ) : customerHistory.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <Clock className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm">No transactions found.</p>
                </div>
              ) : customerHistory.map(tx => (
                <div key={tx.id} className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.05] flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(tx.transactionDate).toLocaleString()}</p>
                      <p className="text-xs font-mono text-slate-400">#{tx.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(tx.totalAmount)}</p>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${tx.paymentStatus === "PAID" ? "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400"}`}>{tx.paymentStatus}</span>
                      <a href={`/dashboard/sales/${tx.id}`} className="text-xs text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1 rounded-lg font-semibold hover:opacity-90 transition-opacity">View</a>
                    </div>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 text-left">Item</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Subtotal</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {tx.items.map(item => (
                          <tr key={item.productId}>
                            <td className="py-2 font-medium text-slate-900 dark:text-slate-100">{item.productName}</td>
                            <td className="py-2 text-center text-slate-500 dark:text-slate-400">{item.quantity}</td>
                            <td className="py-2 text-right text-slate-500 dark:text-slate-400 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
