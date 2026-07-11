"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AxiosError } from "axios";
import { ApiErrorBody } from "@/lib/api/types";
import { Globe, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const role = await login(username, password);
      if (role === "ADMIN" || role === "MANAGER") {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      const message = axiosErr.response?.data?.message;
      setErrorMessage(message ?? "Invalid username or password.");
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-transparent relative">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setLanguage(language === "en" ? "km" : "en")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.08] rounded-full shadow-sm transition-all"
        >
          <Globe className="w-4 h-4" />
          {language === "en" ? "ខ្មែរ" : "English"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl glass-card p-8 animate-slide-up"
        style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-6 shadow-[0_0_16px_rgba(99,102,241,0.4)]">
          <span className="text-white font-bold text-xl">CD</span>
        </div>
        
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t.loginToYourAccount}
        </h1>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all bg-white/50 dark:bg-white/[0.03]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all bg-white/50 dark:bg-white/[0.03]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 font-semibold text-white shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-all hover:from-indigo-400 hover:to-violet-500 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:transform-none"
        >
          {isSubmitting ? t.signingIn : t.signIn}
        </button>
      </form>
    </div>
  );
}
