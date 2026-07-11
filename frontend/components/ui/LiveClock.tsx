/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Calendar } from "lucide-react";

export function LiveClock() {
  const { language } = useLanguage();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    // Return a skeleton or empty div to avoid hydration mismatch while loading
    return <div className="w-32 h-8 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />;
  }

  const formattedDate = new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(time);

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[150px] justify-center">
      <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
      <span className="whitespace-nowrap">{formattedDate}</span>
    </div>
  );
}
