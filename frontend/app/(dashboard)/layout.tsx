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
  Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.inventory, href: "/dashboard/inventory", icon: Package },
    { name: t.sales, href: "/dashboard/sales", icon: ShoppingCart },
    { name: t.customers, href: "/dashboard/customers", icon: Users },
    { name: t.suppliers, href: "/dashboard/suppliers", icon: Users },
    { name: t.purchases, href: "/dashboard/purchases", icon: ShoppingCart },
    { name: t.expenses, href: "/dashboard/expenses", icon: LayoutDashboard },
    { name: t.staff, href: "/dashboard/staff", icon: Users },
    { name: t.settings, href: "/dashboard/settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm relative z-20">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">Chan Dara</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase text-sm">
              {user?.username?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center px-8 justify-between shrink-0 sticky top-0 z-20">
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
            {navItems.find((item) => item.href === pathname)?.name || t.dashboard}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === "en" ? "km" : "en")}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "ខ្មែរ" : "English"}
            </button>
            <Link 
              href="/pos" 
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm hover:shadow transition-all"
            >
              {t.pos}
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
