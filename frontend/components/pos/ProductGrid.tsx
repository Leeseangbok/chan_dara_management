import { Product } from "@/lib/api/types";
import React from "react";
import { ImagePlus, PackageX } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency } from "@/lib/utils/currency";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

const LoadingSpinner = () => (
    <svg className="animate-spin h-6 w-6 text-indigo-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface ProductGridProps {
    products: Product[];
    isLoading: boolean;
    onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, isLoading, onAddToCart }: ProductGridProps) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full min-h-[300px]">
                <LoadingSpinner />
                <span className="mt-4 font-medium">Loading products...</span>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full min-h-[300px]">
                <PackageX className="w-12 h-12 mb-3 text-gray-300" />
                <span className="font-medium text-gray-500">{t.noProductsFound}</span>
                <span className="text-sm">{t.noProductsSub}</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {products.map((product) => {
                const outOfStock = product.stockQuantity <= 0;
                const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
                
                return (
                    <button
                        key={product.id}
                        disabled={outOfStock}
                        onClick={() => onAddToCart(product)}
                        className={`group relative text-left rounded-2xl border transition-all duration-200 overflow-hidden bg-white flex flex-col
                            ${outOfStock
                                ? "opacity-60 cursor-not-allowed border-gray-200"
                                : "border-gray-200 hover:border-indigo-500 hover:shadow-lg active:scale-[0.98]"
                            }`}
                    >
                        {/* Image Container */}
                        <div className="w-full aspect-square bg-gray-50 relative border-b border-gray-100 flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={`${API_BASE}${product.imageUrl}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <ImagePlus className="w-8 h-8 text-gray-300" />
                            )}
                            
                            {/* Stock Badges */}
                            {outOfStock && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{t.soldOut}</span>
                                </div>
                            )}
                            {lowStock && !outOfStock && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    Only {product.stockQuantity}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-3 flex flex-col flex-1">
                            <div className="font-semibold text-sm text-gray-900 line-clamp-1">
                                {product.name}
                            </div>
                            {product.nameKh && (
                                <div className="text-xs text-indigo-600 line-clamp-1 mt-0.5" style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}>
                                    {product.nameKh}
                                </div>
                            )}
                            <div className="text-[10px] text-gray-400 font-mono mt-1 mb-2">{product.sku}</div>
                            
                            <div className="mt-auto flex items-end justify-between">
                                <span className="font-bold text-gray-900 text-base">
                                    {formatCurrency(product.price)}
                                </span>
                                {!outOfStock && !lowStock && (
                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                        {product.stockQuantity} {t.inStock}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
