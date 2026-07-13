"use client";

import { useState, useEffect } from "react";
import { expensesApi } from "@/lib/api/expenses";
import { Expense, ExpenseCategory } from "@/lib/api/types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Plus, Loader2, Receipt, Trash2, Edit2, Calendar, Search, X, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["UTILITIES", "RENT", "PAYROLL", "MAINTENANCE", "SUPPLIES", "MARKETING", "OTHER"];

const categoryColors: Record<string, string> = {
  UTILITIES: "bg-sky-100 dark:bg-sky-500/[0.12] text-sky-700 dark:text-sky-400",
  RENT: "bg-violet-100 dark:bg-violet-500/[0.12] text-violet-700 dark:text-violet-400",
  PAYROLL: "bg-indigo-100 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-400",
  MAINTENANCE: "bg-amber-100 dark:bg-amber-500/[0.12] text-amber-700 dark:text-amber-400",
  SUPPLIES: "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400",
  MARKETING: "bg-pink-100 dark:bg-pink-500/[0.12] text-pink-700 dark:text-pink-400",
  OTHER: "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400",
};

const inputCls = "w-full px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>("UTILITIES");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    try { setExpenses(await expensesApi.list()); }
    catch { toast.error("Failed to load expenses"); }
    finally { setLoading(false); }
  };

  const openCreateModal = () => { setEditingExpense(null); setCategory("UTILITIES"); setAmount(""); setDescription(""); setExpenseDate(new Date().toISOString().split("T")[0]); setIsModalOpen(true); };
  const openEditModal = (e: Expense) => { setEditingExpense(e); setCategory(e.category); setAmount(e.amount.toString()); setDescription(e.description); setExpenseDate(e.expenseDate); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try { await expensesApi.delete(id); toast.success("Expense deleted"); fetchExpenses(); }
    catch (error: any) { toast.error(error.response?.data?.message || "Failed to delete"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast.error("Please enter a valid amount");
    if (!description.trim()) return toast.error("Description is required");
    setFormLoading(true);
    try {
      const payload = { category, amount: parseFloat(amount), description: description.trim(), expenseDate };
      if (editingExpense) { await expensesApi.update(editingExpense.id, payload); toast.success("Expense updated"); }
      else { await expensesApi.create(payload); toast.success("Expense added"); }
      setIsModalOpen(false); fetchExpenses();
    } catch (error: any) { toast.error(error.response?.data?.message || "Operation failed"); }
    finally { setFormLoading(false); }
  };

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.expensesOverview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.expensesSub}</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-rose-500 to-red-600
            shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:shadow-[0_0_24px_rgba(239,68,68,0.45)]
            hover:-translate-y-px transition-all active:scale-95">
          <Plus className="w-4 h-4" /> {t.logExpense}
        </button>
      </div>

      {/* Summary + Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 to-red-500 rounded-t-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Filtered</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/[0.1] flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex items-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Search by description or category…" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.date}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.category}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.description}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.amount}</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400 dark:text-slate-600">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No expenses found.</p>
                </td></tr>
              ) : filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${categoryColors[e.category] || categoryColors.OTHER}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{e.description}</p>
                    {e.loggedBy && <p className="text-[10px] text-slate-400 mt-0.5">By: {e.loggedBy}</p>}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">${e.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(e)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all active:scale-90" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden flex flex-col divide-y divide-slate-100/60 dark:divide-white/[0.04]">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-600">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No expenses found.</p>
            </div>
          ) : filteredExpenses.map((e) => (
            <div key={e.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${categoryColors[e.category] || categoryColors.OTHER}`}>
                    {e.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(e.expenseDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">${e.amount.toFixed(2)}</div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{e.description}</p>
                {e.loggedBy && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logged by {e.loggedBy}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] mt-1">
                <button onClick={() => openEditModal(e)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => handleDelete(e.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#13161f] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Date *</label><input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={inputCls} required /></div>
                  <div><label className={labelCls}>Amount ($) *</label><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} required /></div>
                </div>
                <div><label className={labelCls}>Category *</label><select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputCls}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className={labelCls}>Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls + " resize-none"} required placeholder="What was this expense for?" /></div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1] rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-[0_0_14px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] disabled:opacity-50 disabled:shadow-none transition-all">
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingExpense ? "Save Changes" : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
