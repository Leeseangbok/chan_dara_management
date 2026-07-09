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
import { Search, Tag, AlertCircle, ArrowLeft, Globe, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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

    async function handleConfirmCheckout(payload: { paymentMethod: "CASH"|"QR_CODE", paymentStatus: "PAID"|"UNPAID", customerId: string | null }) {
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
                customerId: payload.customerId
            });

            setSuccessMessage(`Sale completed successfully! (ID: ${response.id.substring(0, 8)})`);
            setCart([]);
            setIsCheckoutModalOpen(false);
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
        <div className="flex h-screen bg-gray-100 font-sans" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
            {/* Left Column: POS Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar: Search & Categories */}
                <div className="bg-white border-b border-gray-200 z-10 shadow-sm">
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                        {hasRole("ADMIN", "MANAGER") && (
                            <Link href="/dashboard" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors shrink-0" title={t.dashboard}>
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        )}
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-100/80 hover:bg-gray-100 text-gray-700 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl transition-all outline-none font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex items-center">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedCategoryId === null
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                        : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {t.allItems}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${selectedCategoryId === cat.id
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                            : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Tag className="w-4 h-4" />
                                        {language === "km" && cat.nameKh ? cat.nameKh : cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setLanguage(language === "en" ? "km" : "en")}
                                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                                title={language === "en" ? "Switch to Khmer" : "ប្តូរទៅភាសាអង់គ្លេស"}
                            >
                                <Globe className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors flex items-center justify-center"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    <ProductGrid
                        products={filteredProducts}
                        isLoading={isLoading}
                        onAddToCart={addToCart}
                    />
                </div>
            </div>

            {/* Right Column: Cart Panel */}
            <div className="w-[420px] bg-white border-l border-gray-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] flex flex-col z-20">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t.currentSale}</h2>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                            {t.clearAll}
                        </button>
                    )}
                </div>

                {errorMessage && (
                    <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{errorMessage}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="m-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                        {successMessage}
                    </div>
                )}

                <CartPanel
                    cart={cart}
                    onIncrement={incrementLine}
                    onDecrement={decrementLine}
                    onRemove={removeLine}
                    onUpdateQuantity={updateLineQuantity}
                    onUpdatePrice={updateLinePrice}
                />

                <div className="p-5 bg-white border-t border-gray-100 relative z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-xl bg-indigo-600 text-white text-lg font-bold
                             hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg
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