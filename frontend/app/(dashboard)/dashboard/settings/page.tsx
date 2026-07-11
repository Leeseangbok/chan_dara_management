"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Sun, Moon, Monitor, Globe, Bell, Shield, Database, Palette,
  Save, Loader2, ChevronRight, CheckCircle, Lock, User as UserIcon,
  DollarSign, Clock, Building, HelpCircle, Download
} from "lucide-react";
import toast from "react-hot-toast";
import { ChangePasswordModal } from "@/components/ui/ChangePasswordModal";
import { productsApi } from "@/lib/api/products";

// ─── Reusable primitives ─────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, iconColor, children }: {
  title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
    <div className="px-6 py-4 border-b border-slate-100/80 dark:border-white/[0.06] flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </div>
);

const SettingRow = ({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-6">
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${checked ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-slate-200 dark:bg-white/[0.1]"}`}>
    <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-1 ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  // Notification preferences (client-side only, persisted in localStorage)
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Session & UI states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("biz_name") || "Chan Dara POS" : "Chan Dara POS");
  const [currency, setCurrency] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("biz_currency") || "USD" : "USD");
  const [timezone, setTimezone] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("biz_timezone") || "Asia/Phnom_Penh" : "Asia/Phnom_Penh");
  const [exchangeRate, setExchangeRate] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("biz_ex_rate") || "4100" : "4100");
  const [isSavingBiz, setIsSavingBiz] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const handleFetchNbc = async () => {
    setIsFetchingRate(true);
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate.toLocaleString("en-US"));
        toast.success("NBC Exchange Rate Fetched!");
      } else {
        toast.error("Failed to fetch rate");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const products = await productsApi.list();
      const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,SKU,Name,Category,Price,Cost,Stock\n"
        + products.map(p => `${p.id},${p.sku},"${p.name || ''}",${p.category?.name || ''},${p.price},${p.costPrice},${p.stockQuantity}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `chan_dara_products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Products data exported successfully!");
    } catch (e) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBusiness = async () => {
    setIsSavingBiz(true);
    await new Promise(r => setTimeout(r, 800)); // Simulated API save
    localStorage.setItem("biz_name", businessName);
    localStorage.setItem("biz_currency", currency);
    localStorage.setItem("biz_timezone", timezone);
    localStorage.setItem("biz_ex_rate", exchangeRate);
    setIsSavingBiz(false);
    toast.success("Business settings saved!");
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const inputCls = "w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}>
          {t.settings}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your preferences, business details, and system configuration.
        </p>
      </div>

      {/* Account */}
      <SectionCard title={t.accountSettings} icon={UserIcon} iconColor="bg-blue-50 dark:bg-blue-500/[0.1] text-blue-600 dark:text-blue-400">
        <SettingRow label={t.username}>
          <div className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-white/[0.04] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1]">
            {user?.username}
          </div>
        </SettingRow>
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label={t.role}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-400">
              <Shield className="w-3 h-3" /> {user?.role}
            </span>
          </SettingRow>
        </div>
        <SettingRow label={t.changePassword} description="Update your account password">
          <button onClick={() => setIsChangePasswordOpen(true)} className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            <Lock className="w-3.5 h-3.5" /> {t.changePassword} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </SettingRow>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title={t.appearance} icon={Palette} iconColor="bg-violet-50 dark:bg-violet-500/[0.1] text-violet-600 dark:text-violet-400">
        <SettingRow label={t.theme} description={t.themeDesc}>
          <div className="flex gap-2">
            {themeOptions.map(opt => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button key={opt.value} onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${active
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                    : "bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12]"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {opt.value === "light" ? t.light : opt.value === "dark" ? t.dark : t.system}
                </button>
              );
            })}
          </div>
        </SettingRow>

        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label="Language" description={t.languageDesc}>
            <div className="flex gap-2">
              {(["en", "km"] as const).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${language === lang
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                    : "bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12]"}`}>
                  <Globe className="w-3.5 h-3.5" />
                  {lang === "en" ? "English" : "ខ្មែរ"}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title={t.notifications} icon={Bell} iconColor="bg-amber-50 dark:bg-amber-500/[0.1] text-amber-600 dark:text-amber-400">
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label={t.lowStockAlert} description={t.lowStockDesc}>
            <Toggle checked={lowStockAlert} onChange={setLowStockAlert} />
          </SettingRow>
        </div>
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label={t.dailySummary} description={t.dailySummaryDesc}>
            <Toggle checked={dailySummary} onChange={setDailySummary} />
          </SettingRow>
        </div>
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label="Sound Effects" description="Play sounds for key POS actions">
            <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
          </SettingRow>
        </div>
      </SectionCard>

      {/* Business Info */}
      <SectionCard title={t.businessInfo} icon={Building} iconColor="bg-emerald-50 dark:bg-emerald-500/[0.1] text-emerald-600 dark:text-emerald-400">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.businessName}</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.exchangeRateSetting}</label>
            <div className="flex items-center gap-3">
              <input type="text" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className={inputCls} />
              <button
                onClick={handleFetchNbc}
                disabled={isFetchingRate}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow-sm transition-colors disabled:opacity-50 shrink-0">
                {isFetchingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : t.fetchNbc}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />Currency
              </label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
                <option value="USD">USD — US Dollar</option>
                <option value="KHR">KHR — Cambodian Riel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" />Timezone
              </label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (ICT)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.05] flex justify-end">
          <button onClick={handleSaveBusiness} disabled={isSavingBiz}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-indigo-500 to-violet-600
              shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]
              disabled:opacity-60 disabled:shadow-none transition-all">
            {isSavingBiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingBiz ? "Saving…" : t.saveSettings}
          </button>
        </div>
      </SectionCard>


      {/* Data */}
      <SectionCard title={t.dataSystem} icon={Database} iconColor="bg-sky-50 dark:bg-sky-500/[0.1] text-sky-600 dark:text-sky-400">
        <SettingRow label={t.exportData} description={t.exportDataDesc}>
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/[0.1] border border-sky-200 dark:border-sky-500/[0.2] rounded-xl hover:bg-sky-100 dark:hover:bg-sky-500/[0.18] transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </SettingRow>
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label={t.appVersion} description="Current application version">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.07] px-2.5 py-1.5 rounded-lg">v1.0.0</span>
          </SettingRow>
        </div>
        <div className="border-t border-slate-100 dark:border-white/[0.05] pt-4">
          <SettingRow label="Help & Support" description="Reach out if you encounter any issues">
            <a href="mailto:support@chandara.app" className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Contact Support <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </SettingRow>
        </div>
      </SectionCard>
      
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </div>
  );
}
