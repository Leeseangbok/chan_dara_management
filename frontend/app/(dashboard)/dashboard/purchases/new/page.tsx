"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { purchasesApi } from "@/lib/api/purchases";
import { productsApi } from "@/lib/api/products";
import { Supplier, Product } from "@/lib/api/types";
import { ArrowLeft, Plus, Search, Trash2, Loader2, Save, PackageSearch, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { toPng } from 'html-to-image';
import { formatCurrency } from "@/lib/utils/currency";

interface SelectedItem {
  product: Product;
  quantity: number;
  unitCost: number;
  deliveryCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const listRef = useRef<HTMLDivElement>(null);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    Promise.all([
      suppliersApi.list(),
      productsApi.list()
    ]).then(([supData, prodData]) => {
      setSuppliers(supData);
      setProducts(prodData);
    }).catch(err => {
      toast.error("Failed to load data");
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleAddProduct = (product: Product) => {
    if (selectedItems.find(i => i.product.id === product.id)) {
      toast.error("Product already added to list");
      return;
    }

    setSelectedItems([
      ...selectedItems,
      { product, quantity: 1, unitCost: product.costPrice || 0, deliveryCost: 0 }
    ]);

    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.product.id !== productId));
  };

  const updateItem = (productId: string, field: "quantity" | "unitCost" | "deliveryCost", value: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.product.id === productId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const totalAmount = selectedItems.reduce((acc, item) => acc + (item.quantity * (item.unitCost + item.deliveryCost)), 0);

  const handleExportImage = async () => {
    if (selectedItems.length === 0) return toast.error("Please add products first");
    if (listRef.current === null) return;
    try {
      const dataUrl = await toPng(listRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `purchase-list-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Purchase list exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export image");
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) return toast.error("Please select a supplier");
    if (selectedItems.length === 0) return toast.error("Please add at least one product");

    // validate items
    for (const item of selectedItems) {
      if (item.quantity <= 0) return toast.error(`Quantity for ${item.product.name} must be > 0`);
      if (item.unitCost < 0) return toast.error(`Unit cost for ${item.product.name} cannot be negative`);
    }

    setSaving(true);
    try {
      await purchasesApi.create({
        supplierId: selectedSupplierId,
        notes: notes.trim() || null,
        items: selectedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          deliveryCost: item.deliveryCost
        }))
      });

      toast.success("Purchase Order created successfully");
      router.push("/dashboard/purchases");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create PO");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new PO to order stock from a supplier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">No suppliers found. Please add a supplier first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Optional notes for this PO..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Total Items</span>
              <span className="font-medium text-gray-900">{selectedItems.length}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-gray-900 font-semibold text-lg">Total Amount</span>
              <span className="font-bold text-2xl text-indigo-600">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExportImage}
                disabled={selectedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-6 py-3.5 rounded-xl transition-all font-semibold shadow-sm"
              >
                <ImageIcon className="w-5 h-5" />
                Export List as Image
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !selectedSupplierId || selectedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-3.5 rounded-xl transition-all font-bold shadow-sm"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Creating PO..." : "Create Purchase Order"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>

            {/* Product Search */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>

              {showDropdown && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No products found.</div>
                  ) : (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className="w-full flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-left transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku} • Stock: {p.stockQuantity}</div>
                        </div>
                        <Plus className="w-4 h-4 text-indigo-600" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Items Table */}
            <div className="flex-1 overflow-x-auto">
              {selectedItems.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <PackageSearch className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No products added yet.</p>
                  <p className="text-xs mt-1">Search and select products above.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                      <th className="px-4 py-3 rounded-tl-xl">Product</th>
                      <th className="px-4 py-3 w-32">Unit Cost (៛)</th>
                      <th className="px-4 py-3 w-32">Delivery (៛)</th>
                      <th className="px-4 py-3 w-24">Qty</th>
                      <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                      <th className="px-4 py-3 rounded-tr-xl w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {selectedItems.map((item) => (
                      <tr key={item.product.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.product.id, "unitCost", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.deliveryCost}
                            onChange={(e) => updateItem(item.product.id, "deliveryCost", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.product.id, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency((item.unitCost + item.deliveryCost) * item.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveProduct(item.product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Hidden Div for Image Export */}
      <div className="absolute -left-[9999px] top-0">
        <div ref={listRef} className="bg-white p-8 w-[600px] border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Purchase List</h2>
            <p className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</p>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedItems.map((item) => (
                <tr key={item.product.id}>
                  <td className="px-4 py-3 text-gray-900 text-lg">{item.product.name}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-bold text-lg">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
