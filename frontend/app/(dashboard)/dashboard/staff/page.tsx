/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { usersApi } from "@/lib/api/users";
import { User, Role } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Plus, Search, Loader2, ShieldAlert, User as UserIcon, Edit2, Shield, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function StaffPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  async function fetchUsers() {
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);



  const openCreateModal = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setRole("STAFF");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(""); // Keep blank to not update password
    setRole(u.role);
    setIsActive(u.active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!editingUser && !password) return toast.error("Password is required for new users");

    setFormLoading(true);
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          role,
          active: isActive,
          ...(password ? { password } : {})
        });
        toast.success("Staff updated successfully");
      } else {
        await usersApi.create({
          username: username.trim(),
          password,
          role
        });
        toast.success("Staff created successfully");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/[0.1] text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
          You do not have permission to view or manage staff. Please contact an Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.staffOverview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.staffSub}</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-indigo-500 to-violet-600
            shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
            hover:-translate-y-px transition-all active:scale-95">
          <Plus className="w-4 h-4" /> {t.addUser}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input type="text" placeholder="Search by username…" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        <div className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.status}</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Created At</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No staff found.</p>
                    </td>
                  </tr>
                ) : (
                    filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${u.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-500/[0.15] text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-400'}`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.username}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/[0.1] text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${u.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-300' : u.role === 'MANAGER' ? 'bg-sky-100 dark:bg-sky-500/[0.12] text-sky-700 dark:text-sky-300' : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-400'}`}>{u.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${u.active ? 'bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(u.createAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden flex flex-col divide-y divide-slate-100/60 dark:divide-white/[0.04]">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                Loading staff...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No staff found.</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-500/[0.15] text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-400'}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{u.username}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/[0.1] text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${u.role === 'ADMIN' ? 'bg-indigo-100 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-300' : u.role === 'MANAGER' ? 'bg-sky-100 dark:bg-sky-500/[0.12] text-sky-700 dark:text-sky-300' : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-400'}`}>
                            {u.role}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${u.active ? 'bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/[0.12] text-rose-700 dark:text-rose-400'}`}>
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => openEditModal(u)}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Joined: {new Date(u.createAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#13161f] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingUser ? "Edit Staff Member" : "Add New Staff"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  required
                />
                {editingUser && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Username cannot be changed.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {editingUser ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={editingUser?.id === currentUser?.id}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> You cannot change your own role.
                  </p>
                )}
              </div>

              {editingUser && editingUser.id !== currentUser?.id && (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Account Status</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable or disable this account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-slate-100 dark:border-slate-800/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 dark:bg-brand-500"></div>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1] rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl shadow-[0_0_14px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none transition-all">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Save Changes" : "Create Staff"}
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
