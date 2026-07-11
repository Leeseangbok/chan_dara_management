"use client";

import { useState } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { X, Lock, Loader2 } from "lucide-react";
import { usersApi } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/AuthContext";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      await usersApi.update(user.id, { password: newPassword, role: user.role });
      toast.success("Password changed successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Change Password
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                placeholder="Confirm new password"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
