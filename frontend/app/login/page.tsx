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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setLanguage(language === "en" ? "km" : "en")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm transition-colors"
        >
          <Globe className="w-4 h-4" />
          {language === "en" ? "ខ្មែរ" : "English"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
        style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-6">
          <span className="text-indigo-600 font-bold text-xl">CD</span>
        </div>
        
        <h1 className="mb-6 text-2xl font-bold text-gray-900 tracking-tight">
          {t.loginToYourAccount}
        </h1>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              {t.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 text-gray-700 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all bg-gray-50/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 text-gray-700 pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all bg-gray-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
          className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
        >
          {isSubmitting ? t.signingIn : t.signIn}
        </button>
      </form>
    </div>
  );
}
