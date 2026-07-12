/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/lib/api/types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Plus, Search, Loader2, Building2, Edit2, Phone, Mail, MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const inputCls = "w-full px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

// Avatar gradient colors cycled per supplier
const avatarGrads = [
  "from-indigo-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

export default function SuppliersPage() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState(""); const [contactName, setContactName] = useState(""); const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); const [address, setAddress] = useState(""); const [notes, setNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  async function fetchSuppliers() {
    try { setSuppliers(await suppliersApi.list()); }
    catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);



  const openCreateModal = () => { setEditingSupplier(null); setName(""); setContactName(""); setPhone(""); setEmail(""); setAddress(""); setNotes(""); setIsModalOpen(true); };
  const openEditModal = (s: Supplier) => { setEditingSupplier(s); setName(s.name); setContactName(s.contactName || ""); setPhone(s.phone || ""); setEmail(s.email || ""); setAddress(s.address || ""); setNotes(s.notes || ""); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Company name is required");
    setFormLoading(true);
    try {
      const payload = { name: name.trim(), contactName: contactName.trim() || null, phone: phone.trim() || null, email: email.trim() || null, address: address.trim() || null, notes: notes.trim() || null };
      if (editingSupplier) { await suppliersApi.update(editingSupplier.id, payload); toast.success("Supplier updated"); }
      else { await suppliersApi.create(payload); toast.success("Supplier added"); }
      setIsModalOpen(false); fetchSuppliers();
    } catch (error: any) { toast.error(error.response?.data?.message || "Operation failed"); }
    finally { setFormLoading(false); }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactName && s.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.suppliersOverview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.suppliersSub}</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={openCreateModal}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-indigo-500 to-violet-600
            shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
            transition-all">
          <Plus className="w-4 h-4" /> {t.addSupplier}
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input type="text" placeholder="Search suppliers…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" /><p className="text-sm">Loading suppliers…</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
            <Building2 className="w-12 h-12 mb-2 opacity-30" /><p className="text-sm">No suppliers found.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSuppliers.map((s, i) => (
              <motion.div key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="relative rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] p-5 shadow-sm hover:border-slate-300 dark:hover:border-white/[0.14] hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-200 flex flex-col overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-11 h-11 bg-gradient-to-br ${avatarGrads[i % avatarGrads.length]} text-white rounded-2xl flex items-center justify-center font-bold text-base uppercase shadow-lg`}>
                    {s.name.substring(0, 2)}
                  </div>
                  <button onClick={() => openEditModal(s)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{s.name}</h3>
                {s.contactName && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{s.contactName}</p>}
                {!s.contactName && <div className="h-5 mb-3" />}
                <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                  {s.phone && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" /><span className="truncate">{s.phone}</span></div>}
                  {s.email && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" /><span className="truncate">{s.email}</span></div>}
                  {s.address && <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" /><span className="line-clamp-2">{s.address}</span></div>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#13161f] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className={labelCls}>Company Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required /></div>
                <div><label className={labelCls}>Contact Person</label><input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls + " resize-none"} /></div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1] rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl shadow-[0_0_14px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none transition-all">
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingSupplier ? "Save Changes" : "Add Supplier"}
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
