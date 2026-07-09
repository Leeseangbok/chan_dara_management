"use client";

import { CartLine } from "@/lib/pos/cartTypes";
import { ImagePlus, Minus, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency } from "@/lib/utils/currency";
import { CurrencyInput } from "../ui/CurrencyInput";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

interface CartPanelProps {
    cart: CartLine[];
    onIncrement: (productId: string) => void;
    onDecrement: (productId: string) => void;
    onRemove: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdatePrice: (productId: string, price: number) => void;
}

export function CartPanel({ cart, onIncrement, onDecrement, onRemove, onUpdateQuantity, onUpdatePrice }: CartPanelProps) {
    const { t } = useLanguage();
    
    const total = cart.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0
    );

    if (cart.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🛒</span>
                </div>
                <p className="font-medium text-gray-600 mb-1">{t.cartEmptyTitle}</p>
                <p className="text-sm">{t.cartEmptySub}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-3">
                    {cart.map((line) => {
                        const atMaxStock = line.quantity >= line.product.stockQuantity;
                        const subtotal = line.unitPrice * line.quantity;
                        
                        return (
                            <div key={line.product.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col gap-3 group transition-all hover:border-indigo-100">
                                <div className="flex gap-3 items-start">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                        {line.product.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={`${API_BASE}${line.product.imageUrl}`} alt={line.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImagePlus className="w-5 h-5 text-gray-300" />
                                        )}
                                    </div>
                                    
                                    {/* Title & Delete */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{line.product.name}</h4>
                                                {line.product.nameKh && (
                                                    <p className="text-xs text-indigo-600 mt-0.5 line-clamp-1" style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}>
                                                        {line.product.nameKh}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onRemove(line.product.id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 gap-2">
                                    {/* Price Override */}
                                    <div className="relative flex items-center w-32">
                                        <CurrencyInput 
                                            value={line.unitPrice === 0 ? "" : line.unitPrice}
                                            onChangeValue={(val) => onUpdatePrice(line.product.id, val)}
                                            className="w-full pl-3 pr-8 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        />
                                        <span className="absolute right-3 text-gray-500 text-sm font-medium">៛</span>
                                    </div>

                                    {/* Quantity Stepper */}
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-8">
                                        <button
                                            onClick={() => onDecrement(line.product.id)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input 
                                            type="number"
                                            min="1"
                                            max={line.product.stockQuantity}
                                            value={line.quantity || ""}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (!isNaN(val) && val > 0 && val <= line.product.stockQuantity) {
                                                    onUpdateQuantity(line.product.id, val);
                                                }
                                            }}
                                            className="w-10 h-full bg-transparent text-center text-sm font-semibold text-gray-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 z-10 appearance-none m-0"
                                            style={{ MozAppearance: "textfield" }}
                                        />
                                        <button
                                            onClick={() => onIncrement(line.product.id)}
                                            disabled={atMaxStock}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    
                                    {/* Subtotal */}
                                    <div className="text-right flex-1 min-w-[70px]">
                                        <div className="text-sm font-bold text-gray-900">{formatCurrency(subtotal)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total Footer */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-sm">{t.items}</span>
                    <span className="font-medium text-gray-900">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">{t.totalAmount}</span>
                    <span className="text-2xl font-bold text-indigo-600">{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );
}