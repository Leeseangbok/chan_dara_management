"use client";

import { useState, useEffect } from "react";
import { productsApi } from "@/lib/api/products";
import { Product, TransactionItemResponse, SaleLineItemRequest } from "@/lib/api/types";
import { X, Plus, Trash2, Save, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TransactionItemResponse[];
  onSave: (newItems: SaleLineItemRequest[]) => Promise<void>;
}

export function EditTransactionModal({ isOpen, onClose, items, onSave }: EditTransactionModalProps) {
  const [currentItems, setCurrentItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number; }[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentItems(items.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice })));
      fetchProducts();
    }
  }, [isOpen, items]);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.list();
      setAllProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const handleAdd = (product: Product) => {
    setCurrentItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price }];
    });
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCurrentItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleRemove = (productId: string) => {
    setCurrentItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSave = async () => {
    if (currentItems.length === 0) {
      alert("Transaction must have at least one item.");
      return;
    }
    setIsSaving(true);
    try {
      const payload: SaleLineItemRequest[] = currentItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }));
      await onSave(payload);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Transaction Items</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: Current Items */}
          <div className="p-6 border-r border-slate-100 dark:border-slate-800/60 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Current Items</h3>
            <div className="space-y-4">
              {currentItems.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" 
                      className="w-16 px-2 py-1 border border-slate-100 dark:border-slate-800/60 rounded text-center"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    />
                    <button onClick={() => handleRemove(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {currentItems.length === 0 && (
                <p className="text-slate-400 text-sm italic">No items in transaction. Add some products.</p>
              )}
            </div>
          </div>

          {/* Right: Add Products */}
          <div className="p-6 bg-transparent overflow-y-auto">
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Add Products</h3>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="space-y-2">
               {filteredProducts.slice(0, 10).map(product => (
                 <div key={product.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl hover:border-brand-300 transition-colors cursor-pointer" onClick={() => handleAdd(product)}>
                   <div>
                     <p className="font-medium text-slate-900 dark:text-white text-sm">{product.name}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(product.price)} • Stock: {product.stockQuantity}</p>
                   </div>
                   <button className="w-8 h-8 flex items-center justify-center bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-100 dark:bg-brand-900/50">
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
               ))}
               {filteredProducts.length === 0 && (
                 <p className="text-slate-400 text-sm italic">No products found.</p>
               )}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 rounded-2xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || currentItems.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 dark:bg-brand-500 text-white font-medium hover:bg-brand-700 dark:bg-brand-600 rounded-2xl transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
