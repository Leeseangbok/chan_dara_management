"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Translations } from "./translations";
import { en } from "./en";
import { km } from "./km";

type Language = "en" | "km";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app_lang") as Language;
    if (stored === "en" || stored === "km") {
      setLanguage(stored);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
  };

  // During SSR or first render, provide the default language but hide content to avoid hydration mismatch
  const content = mounted ? children : <div className="invisible">{children}</div>;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: language === "en" ? en : km,
      }}
    >
      {content}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
