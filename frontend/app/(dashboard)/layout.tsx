/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Globe,
  Menu,
  X,
  Activity,
  Truck,
  Store,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  ReceiptText,
  Wallet,
  UserCog,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { LiveClock } from "@/components/ui/LiveClock";
import { useTheme } from "next-themes";

// ─── Per-nav icon color config ────────────────────────────────────────────────
const navIconColors: Record<string, string> = {
  "/dashboard":             "text-indigo-400",
  "/dashboard/inventory":   "text-emerald-400",
  "/dashboard/sales":       "text-sky-400",
  "/dashboard/customers":   "text-violet-400",
  "/dashboard/suppliers":   "text-amber-400",
  "/dashboard/purchases":   "text-orange-400",
  "/dashboard/expenses":    "text-rose-400",
  "/dashboard/deliveries":  "text-teal-400",
  "/dashboard/staff":       "text-purple-400",
  "/dashboard/activity":    "text-slate-400",
  "/dashboard/settings":    "text-indigo-300",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allNavItems = [
    { name: t.dashboard,   href: "/dashboard",            icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"], section: "main" },
    { name: t.inventory,   href: "/dashboard/inventory",  icon: Package, roles: ["ADMIN", "MANAGER"], section: "main" },
    { name: t.sales,       href: "/dashboard/sales",      icon: ReceiptText, roles: ["ADMIN", "MANAGER", "STAFF"], section: "main" },
    { name: t.customers,   href: "/dashboard/customers",  icon: Users, roles: ["ADMIN", "MANAGER", "STAFF"], section: "main" },
    { name: t.suppliers,   href: "/dashboard/suppliers",  icon: UserCog, roles: ["ADMIN", "MANAGER"], section: "main" },
    { name: t.purchases,   href: "/dashboard/purchases",  icon: ShoppingCart, roles: ["ADMIN", "MANAGER"], section: "main" },
    { name: t.expenses,    href: "/dashboard/expenses",   icon: Wallet, roles: ["ADMIN", "MANAGER"], section: "main" },
    { name: "Deliveries",  href: "/dashboard/deliveries", icon: Truck, roles: ["ADMIN", "MANAGER", "STAFF"], section: "main" },
    { name: t.staff,       href: "/dashboard/staff",      icon: Users, roles: ["ADMIN"], section: "management" },
    { name: "Activity Log",href: "/dashboard/activity",   icon: Activity, roles: ["ADMIN", "MANAGER"], section: "management" },
    { name: t.settings,    href: "/dashboard/settings",   icon: Settings, roles: ["ADMIN", "MANAGER", "STAFF"], section: "management" },
  ];

  const userRole = user?.role || "STAFF";
  const mainNavItems = allNavItems.filter(item => item.section === "main" && item.roles.includes(userRole));
  const managementNavItems = allNavItems.filter(item => item.section === "management" && item.roles.includes(userRole));

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#080a10]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.5)] glow-brand">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]
        shadow-[4px_0_30px_rgba(0,0,0,0.25)]
        dark:shadow-[4px_0_30px_rgba(0,0,0,0.6)]
        transform transition-transform duration-300 ease-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--sidebar-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)] flex-shrink-0">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Chan Dara</span>
          </div>
          <button 
            className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] rounded-lg transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Nav section label */}
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Main Menu
          </p>

          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const iconColor = navIconColors[item.href] ?? "text-slate-400";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl
                  transition-all duration-200 active:scale-[0.98]
                  ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                  }
                `}
              >
                {/* Left active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 nav-glow-bar" />
                )}

                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive ? "text-indigo-500 dark:text-indigo-400" : `${iconColor} opacity-60 group-hover:opacity-100`
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400 dark:text-indigo-500" />}
              </Link>
            );
          })}

          {/* Section 2: Management */}
          <p className="px-3 mt-4 mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Management
          </p>

          {managementNavItems.map((item) => {
            const isActive = pathname === item.href;
            const iconColor = navIconColors[item.href] ?? "text-slate-400";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl
                  transition-all duration-200 active:scale-[0.98]
                  ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/[0.12] text-indigo-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 nav-glow-bar" />
                )}
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive ? "text-indigo-500 dark:text-indigo-400" : `${iconColor} opacity-60 group-hover:opacity-100`
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-400 dark:text-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[var(--sidebar-border)] shrink-0 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold uppercase text-xs shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              {user?.username?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/[0.08] active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full">

        {/* Header */}
        <header className="h-16 flex items-center px-4 md:px-8 justify-between shrink-0 sticky top-0 z-20
          bg-[var(--header-bg)] backdrop-blur-md
          border-b border-[var(--sidebar-border)]
          shadow-[0_1px_0_rgba(0,0,0,0.04)]
          dark:shadow-[0_1px_0_rgba(255,255,255,0.03)]">

          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] rounded-lg active:scale-95 transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb title */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-slate-400 dark:text-slate-600">Chan Dara</span>
              <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
              <h2
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight"
                style={{ fontFamily: language === "km" ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}
              >
                {allNavItems.find((item) => item.href === pathname)?.name || t.dashboard}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LiveClock />

            <NotificationBell />

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] rounded-lg transition-all active:scale-95"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "km" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] rounded-lg transition-all active:scale-95"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === "en" ? "ខ្មែរ" : "English"}</span>
            </button>

            {/* POS Button — gradient + glow */}
            <Link 
              href="/pos" 
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg
                bg-gradient-to-r from-indigo-500 to-violet-600
                shadow-[0_0_16px_rgba(99,102,241,0.35)]
                hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
                hover:from-indigo-400 hover:to-violet-500
                hover:-translate-y-px
                transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              {t.pos}
            </Link>
          </div>
        </header>
        
        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl animate-slide-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
