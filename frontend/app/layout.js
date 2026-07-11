import { Geist, Geist_Mono, Noto_Sans_Khmer } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-sans-khmer",
  subsets: ["khmer"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Chan Dara",
  description: "Point of Sale & Inventory Management System",
};

import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKhmer.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans text-slate-900 dark:text-slate-50">
        {/* ── Background design layers ── */}
        <div className="noise-layer" aria-hidden="true" />
        <div className="vignette-layer" aria-hidden="true" />
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />

        <Providers>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
            </AuthProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
