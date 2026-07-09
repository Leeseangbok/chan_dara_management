"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { customersApi } from "@/lib/api/customers";
import { Customer } from "@/lib/api/types";
import { Plus, Edit2, Trash2, Search, User, Phone, MapPin, Loader2, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionResponse } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/currency";

import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomers(await customersApi.list());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  const openCreateModal = () => {
    setForm({ name: "", phone: "", address: "", notes: "" });
    setModalMode("create");
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setForm({
      name: c.name,
      phone: c.phone || "",
      address: c.address || "",
      notes: c.notes || ""
    });
    setModalMode("edit");
    setSelectedCustomer(c);
    setIsModalOpen(true);
  };

  const openHistoryModal = async (c: Customer) => {
    setSelectedCustomer(c);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const history = await transactionsApi.getByCustomer(c.id);
      setCustomerHistory(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await customersApi.create(form);
      } else if (selectedCustomer) {
        await customersApi.update(selectedCustomer.id, form);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await customersApi.delete(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.customersOverview}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.customersSub}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      <div className="relative max-w-md text-gray-700">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
        <input
          type="text"
          placeholder={t.searchCustomers}
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
                <th className="px-6 py-4">{t.customerName.replace(' *', '')}</th>
                <th className="px-6 py-4">{t.phone}</th>
                <th className="px-6 py-4">{t.address}</th>
                <th className="px-6 py-4 text-right">{t.totalUnpaid}</th>
                <th className="px-6 py-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t.noCustomersYet}</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone || "-"}</td>
                    <td className="px-6 py-4 text-gray-600">{c.address || "-"}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      {c.totalUnpaid > 0 ? formatCurrency(c.totalUnpaid) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openHistoryModal(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Transaction History">
                          <Clock className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Customer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Customer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
                {modalMode === "create" ? t.addCustomer : "កែប្រែអតិថិជន"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.customerName}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? t.processing : t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* History Modal */}
      {historyModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>ប្រវត្តិប្រតិបត្តិការ</h3>
                <p className="text-sm text-gray-500">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                  Loading history...
                </div>
              ) : customerHistory.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                  <Clock className="w-12 h-12 mb-3 opacity-30" />
                  No transactions found for this customer.
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {customerHistory.map(tx => (
                    <div key={tx.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {/* Transaction Header */}
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{new Date(tx.transactionDate).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">#{tx.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 w-full sm:w-auto justify-between">
                          <p className="font-bold text-lg text-indigo-700">{formatCurrency(tx.totalAmount)}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {tx.paymentStatus}
                            </span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-1 rounded">
                              {tx.paymentMethod === 'CASH' ? 'CASH' : 'QR CODE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Items */}
                      <div className="p-4">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                            <tr>
                              <th className="px-3 py-2 rounded-l-lg font-semibold">{t.items}</th>
                              <th className="px-3 py-2 text-center font-semibold">បរិមាណ</th>
                              <th className="px-3 py-2 text-right font-semibold">{t.price}</th>
                              <th className="px-3 py-2 rounded-r-lg text-right font-semibold">សរុបរង</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {tx.items.map(item => (
                              <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-2.5 font-medium text-gray-900">{item.productName}</td>
                                <td className="px-3 py-2.5 text-center text-gray-600">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
