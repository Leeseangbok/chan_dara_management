/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { transactionsApi } from "@/lib/api/transactions";
import { Product, Category, ApiErrorBody } from "@/lib/api/types";
import { CartLine } from "@/lib/pos/cartTypes";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { AxiosError } from "axios";
import { useAuth } from "@/lib/auth/AuthContext";
import { Search, Tag, AlertCircle, ArrowLeft, Globe, LogOut, X, ShoppingCart, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LiveClock } from "@/components/ui/LiveClock";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";

export default function PosPage() {
    const { t, language, setLanguage } = useLanguage();
    const { hasRole, logout } = useAuth();
    const router = useRouter();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Cart & Checkout
    const [cart, setCart] = useState<CartLine[]>([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Mobile state
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [prodsData, catsData] = await Promise.all([
                productsApi.list(),
                categoriesApi.list(),
            ]);
            setProducts(prodsData);
            setCategories(catsData);
        } catch {
            setErrorMessage("Failed to load catalog. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.nameKh && p.nameKh.includes(searchQuery)) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategoryId ? p.category?.id === selectedCategoryId : true;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategoryId]);

    function addToCart(product: Product) {
        setErrorMessage(null);
        setSuccessMessage(null);
        setCart((prev) => {
            const existing = prev.find((line) => line.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stockQuantity) return prev;
                return prev.map((line) =>
                    line.product.id === product.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line
                );
            }
            return [...prev, { product, quantity: 1, unitPrice: product.price }];
        });
    }

    function updateLineQuantity(productId: string, quantity: number) {
        setCart((prev) =>
            prev.map((line) =>
                line.product.id === productId ? { ...line, quantity } : line
            )
        );
    }

    function updateLinePrice(productId: string, price: number) {
        setCart((prev) =>
            prev.map((line) =>
                line.product.id === productId ? { ...line, unitPrice: price } : line
            )
        );
    }

    function incrementLine(productId: string) {
        setCart((prev) =>
            prev.map((line) =>
                line.product.id === productId && line.quantity < line.product.stockQuantity
                    ? { ...line, quantity: line.quantity + 1 }
                    : line
            )
        );
    }

    function decrementLine(productId: string) {
        setCart((prev) =>
            prev.map((line) =>
                line.product.id === productId
                    ? { ...line, quantity: line.quantity - 1 }
                    : line
            ).filter((line) => line.quantity > 0)
        );
    }

    function removeLine(productId: string) {
        setCart((prev) => prev.filter((line) => line.product.id !== productId));
    }

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    }, [cart]);
    
    const cartItemCount = useMemo(() => {
        return cart.reduce((sum, line) => sum + line.quantity, 0);
    }, [cart]);

    async function handleConfirmCheckout(payload: { paymentMethod: "CASH"|"QR_CODE", paymentStatus: "PAID"|"UNPAID", customerId: string | null, deliveryStatus?: "NONE"|"PENDING", deliveryLocation?: string }) {
        if (cart.length === 0) return;

        setIsSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const response = await transactionsApi.create({
                items: cart.map((line) => ({
                    productId: line.product.id,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice !== line.product.price ? line.unitPrice : undefined,
                })),
                paymentMethod: payload.paymentMethod,
                paymentStatus: payload.paymentStatus,
                customerId: payload.customerId || undefined,
                deliveryStatus: payload.deliveryStatus,
                deliveryLocation: payload.deliveryLocation
            });

            setSuccessMessage(`Sale completed successfully! (ID: ${response.id.substring(0, 8)})`);
            setCart([]);
            setIsCheckoutModalOpen(false);
            setIsMobileCartOpen(false);
            await loadData();
        } catch (err) {
            const axiosErr = err as AxiosError<ApiErrorBody>;
            const status = axiosErr.response?.status;
            const body = axiosErr.response?.data;

            if (status === 409) {
                setErrorMessage(body?.message ?? "Stock changed before checkout completed. Please review your cart.");
                await loadData();
            } else if (status === 400) {
                setErrorMessage(body?.message ?? "Invalid sale — please check the cart.");
            } else {
                setErrorMessage("Something went wrong processing the sale. Please try again.");
            }
            setIsCheckoutModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex h-[100dvh] bg-transparent font-sans relative overflow-hidden" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
            {/* Left Column: POS Grid */}
            <div className="flex-1 flex flex-col min-w-0 h-full pb-20 lg:pb-0">
                {/* Top Bar: Search & Categories */}
                <div className="glass-card border-x-0 border-t-0 shrink-0 z-10">
                    <div className="flex flex-col border-b border-slate-100 dark:border-slate-800/60">
                        {/* Row 1: Controls & Tools */}
                        <div className="p-3 lg:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 lg:gap-4 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex w-full sm:w-1/2 lg:w-1/3 items-center gap-3">
                                <Link href="/dashboard" className="p-2 bg-white/50 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.08] rounded-xl text-slate-600 dark:text-slate-400 transition-colors shrink-0" title={t.dashboard}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder={t.searchPlaceholder}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl transition-all outline-none font-medium text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 hover:bg-slate-200 rounded-full transition-colors"
                                            title="Clear search"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-end">
                                <div className="hidden sm:block">
                                    <LiveClock />
                                </div>
                                <div className="flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                    <NotificationBell />
                                </div>
                                <button
                                    onClick={() => setLanguage(language === "en" ? "km" : "en")}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center"
                                    title={language === "en" ? "Switch to Khmer" : "ប្តូរទៅភាសាអង់គ្លេស"}
                                >
                                    <Globe className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/[0.05] hover:bg-rose-100 dark:hover:bg-rose-500/[0.1] border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors flex items-center justify-center"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Categories */}
                        <div className="w-full overflow-x-auto hide-scrollbar bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
                            <div className="flex items-center gap-2 min-w-max p-3 lg:px-4">
                                <button
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedCategoryId === null
                                        ? "bg-brand-600 text-white shadow-md shadow-brand-500/25"
                                        : "bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {t.allItems}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${selectedCategoryId === cat.id
                                            ? "bg-brand-600 text-white shadow-md shadow-brand-500/25"
                                            : "bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <Tag className="w-4 h-4" />
                                        {language === "km" && cat.nameKh ? cat.nameKh : cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 overflow-y-auto bg-transparent p-2 lg:p-0">
                    <ProductGrid
                        products={filteredProducts}
                        isLoading={isLoading}
                        onAddToCart={addToCart}
                    />
                </div>
            </div>

            {/* Mobile View Cart Button */}
            {!isMobileCartOpen && (
                <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
                    <button
                        onClick={() => setIsMobileCartOpen(true)}
                        className="w-full bg-brand-600 dark:bg-brand-500 text-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between font-bold hover:bg-brand-700 dark:bg-brand-600 active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            <span>{t.currentSale} ({cartItemCount})</span>
                        </div>
                        <span>{formatCurrency(cartTotal)}</span>
                    </button>
                </div>
            )}

            {/* Mobile Cart Overlay Backdrop */}
            {isMobileCartOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileCartOpen(false)}
                />
            )}

            {/* Right Column: Cart Panel */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800/60 shadow-2xl lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            className="p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 rounded-xl lg:hidden transition-colors"
                            onClick={() => setIsMobileCartOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.currentSale}</h2>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                            {t.clearAll}
                        </button>
                    )}
                </div>

                {errorMessage && (
                    <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 shrink-0">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{errorMessage}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mx-4 mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium shrink-0">
                        {successMessage}
                    </div>
                )}

                <div className="flex-1 overflow-hidden relative">
                    <CartPanel
                        cart={cart}
                        onIncrement={incrementLine}
                        onDecrement={decrementLine}
                        onRemove={removeLine}
                        onUpdateQuantity={updateLineQuantity}
                        onUpdatePrice={updateLinePrice}
                    />
                </div>

                <div className="p-4 lg:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 shrink-0 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-2xl bg-brand-600 dark:bg-brand-500 text-white text-lg font-bold
                             hover:bg-brand-700 dark:bg-brand-600 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-lg
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {t.checkout}
                        {cart.length > 0 && <span className="ml-2 font-normal opacity-90">({formatCurrency(cartTotal)})</span>}
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                totalAmount={cartTotal}
                isSubmitting={isSubmitting}
                onClose={() => setIsCheckoutModalOpen(false)}
                onConfirm={handleConfirmCheckout}
            />
        </div>
    );
}