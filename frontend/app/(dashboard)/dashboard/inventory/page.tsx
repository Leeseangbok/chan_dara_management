/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { productsApi, CreateProductPayload, UpdateProductPayload } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { exchangeRateApi } from "@/lib/api/exchangeRate";
import { Product, Category } from "@/lib/api/types";
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Package, AlertCircle, X, Check, Loader2, ImagePlus, AlertTriangle, Tag, CheckCircle } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency } from "@/lib/utils/currency";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalMode = "create" | "edit" | null;

interface FormState {
  sku: string;
  name: string;
  nameKh: string;
  description: string;
  categoryId: string;
  price: string;
  costPrice: string;
  costPriceDollar: string;
  exchangeRate: string;
  deliveryPrice: string;
  stockQuantity: string;
  parentProductId: string;
  piecesPerParent: string;
}

const getGlobalExchangeRate = () => typeof window !== 'undefined' ? localStorage.getItem('biz_ex_rate') || "4100" : "4100";

const emptyForm: FormState = {
  sku: "", name: "", nameKh: "", description: "",
  categoryId: "", price: "", costPrice: "",
  costPriceDollar: "", exchangeRate: "", deliveryPrice: "0",
  stockQuantity: "0",
  parentProductId: "", piecesPerParent: "",
};

// ─── Image Upload Widget ──────────────────────────────────────────────────────
function ImageUpload({
  currentUrl, onFileChange,
}: {
  currentUrl: string | null;
  onFileChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentUrl ? `${API_BASE}${currentUrl}` : null);
  }, [currentUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(currentUrl ? `${API_BASE}${currentUrl}` : null);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product Image</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative group cursor-pointer border-2 border-dashed border-slate-100 dark:border-slate-800/60 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:bg-brand-900/30/30 dark:hover:bg-brand-900/20 transition-all"
        style={{ height: 160 }}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4" /> Change Image
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            <ImagePlus className="w-8 h-8" />
            <span className="text-sm">Click to upload image</span>
            <span className="text-xs">JPG, PNG, WEBP — max 5MB</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({
  mode, product, categories, products, onClose, onSaved,
}: {
  mode: ModalMode;
  product: Product | null;
  categories: Category[];
  products: Product[];
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    try {
      const rate = await exchangeRateApi.fetchNbcRate();
      setForm(prev => ({ ...prev, exchangeRate: rate.toLocaleString("en-US") }));
    } catch (err) {
      console.error(err);
      // Optional: show a small toast or inline error, but for now just log it
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && product) {
      setForm({
        sku: product.sku,
        name: product.name,
        nameKh: product.nameKh ?? "",
        description: product.description ?? "",
        categoryId: product.category?.id ?? "",
        price: product.price.toLocaleString("en-US"),
        costPrice: product.costPrice.toLocaleString("en-US"),
        costPriceDollar: product.costPriceDollar?.toLocaleString("en-US") ?? "",
        exchangeRate: product.exchangeRate?.toLocaleString("en-US") ?? "4100",
        deliveryPrice: product.deliveryPrice?.toLocaleString("en-US") ?? "0",
        stockQuantity: product.stockQuantity.toLocaleString("en-US"),
        parentProductId: product.parentProductId ?? "",
        piecesPerParent: product.piecesPerParent?.toString() ?? "",
      });
    } else if (mode === "create") {
      setForm({ ...emptyForm, exchangeRate: getGlobalExchangeRate() });
      // Auto-fetch exchange rate on create
      handleFetchRate();
    }
    setImageFile(null);
    setErrors({});
    setApiError(null);
  }, [mode, product]);

  // Auto-generate SKU based on category for new products
  useEffect(() => {
    if (mode === "create") {
      productsApi.generateSku(form.categoryId).then((sku) => {
        setForm((prev) => ({ ...prev, sku }));
      }).catch(console.error);
    }
  }, [form.categoryId, mode]);

  // Auto-calculate costPrice in Riel
  useEffect(() => {
    const cpDollar = Number(form.costPriceDollar.replace(/,/g, "")) || 0;
    const exchRate = Number(form.exchangeRate.replace(/,/g, "")) || 0;
    const delPrice = Number(form.deliveryPrice.replace(/,/g, "")) || 0;
    if (cpDollar > 0 || exchRate > 0 || delPrice > 0) {
      const rawCalculated = (cpDollar * exchRate) + delPrice;
      const calculated = Math.round(rawCalculated / 100) * 100;
      setForm(prev => ({ ...prev, costPrice: calculated.toLocaleString("en-US") }));
    }
  }, [form.costPriceDollar, form.exchangeRate, form.deliveryPrice]);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (!form.name.trim()) e.name = "Name is required";

    const pVal = Number(form.price.replace(/,/g, ""));
    if (!form.price || isNaN(pVal) || pVal < 0) e.price = "Valid price required";

    const cpVal = Number(form.costPrice.replace(/,/g, ""));
    if (!form.costPrice || isNaN(cpVal) || cpVal < 0) e.costPrice = "Valid cost price required";

    const stockVal = Number(form.stockQuantity.replace(/,/g, ""));
    if (isNaN(stockVal) || stockVal < 0) e.stockQuantity = "Stock must be >= 0";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNumberInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("en-US");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    try {
      let saved: Product;
      const base = {
        name: form.name.trim(),
        nameKh: form.nameKh.trim() || null,
        description: form.description.trim() || null,
        categoryId: form.categoryId || null,
        price: parseFloat(form.price.replace(/,/g, "")),
        costPrice: parseFloat(form.costPrice.replace(/,/g, "") || "0"),
        costPriceDollar: parseFloat(form.costPriceDollar.replace(/,/g, "") || "0"),
        exchangeRate: parseFloat(form.exchangeRate.replace(/,/g, "") || "4100"),
        deliveryPrice: parseFloat(form.deliveryPrice.replace(/,/g, "") || "0"),
        stockQuantity: parseInt(form.stockQuantity.replace(/,/g, "") || "0"),
        parentProductId: form.parentProductId || null,
        piecesPerParent: parseInt(form.piecesPerParent.replace(/,/g, "") || "0") || null,
      };

      if (mode === "create") {
        saved = await productsApi.create({ sku: form.sku.trim(), ...base } as CreateProductPayload);
      } else {
        saved = await productsApi.update(product!.id, base as UpdateProductPayload);
      }

      // Upload image if selected
      if (imageFile) {
        saved = await productsApi.uploadImage(saved.id, imageFile);
      }

      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? "An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!mode) return null;

  const cpDollarNum = Number(form.costPriceDollar.replace(/,/g, "")) || 0;
  const exchRateNum = Number(form.exchangeRate.replace(/,/g, "")) || 0;
  const delPriceNum = Number(form.deliveryPrice.replace(/,/g, "")) || 0;
  const exactCostPrice = (cpDollarNum * exchRateNum) + delPriceNum;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}>
              {mode === "create" ? t.addProduct : t.editProduct}
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {apiError && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{apiError}
              </div>
            )}

            {/* Image Upload */}
            <ImageUpload
              currentUrl={mode === "edit" ? (product?.imageUrl ?? null) : null}
              onFileChange={setImageFile}
            />

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.sku} <span className="text-red-500">*</span></label>
              <input type="text" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                disabled={mode === "edit"} placeholder="e.g. PRD-001"
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 dark:bg-slate-950 ${mode === "edit" ? "bg-slate-50 dark:bg-slate-950 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-100 dark:border-slate-800/60 dark:border-slate-700" : "bg-white dark:bg-slate-900"} ${errors.sku ? "border-red-400" : "border-slate-100 dark:border-slate-800/60"}`}
              />
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
            </div>

            {/* Name + Khmer Name side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productNameEn} <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dog Food 10kg"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 ${errors.name ? "border-red-400" : "border-slate-100 dark:border-slate-800/60"}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productNameKh}</label>
                <input type="text" value={form.nameKh}
                  onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
                  placeholder="ឧ. អាហារឆ្កែ ១០គ.ក"
                  lang="km"
                  className="w-full px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-900 dark:text-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30"
                  style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400 pointer-events-none" />
                <select value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-900 dark:text-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 appearance-none">
                  <option value="">-- No Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.nameKh ? ` — ${c.nameKh}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.description}</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Optional product description..."
                className="w-full px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 resize-none"
              />
            </div>

            {/* Price + Cost Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 dark:border-slate-700/50 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 dark:border-slate-700 pb-2">Pricing & Cost Breakdown</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.sellingPrice} <span className="text-red-500">*</span></label>
                  <CurrencyInput
                    value={form.price}
                    onChangeValue={(val) => setForm({ ...form, price: val.toString() })}
                    placeholder="e.g. 50000"
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 ${errors.price ? "border-red-400" : "border-slate-100 dark:border-slate-800/60"}`}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost Price ($) <span className="text-red-500">*</span></label>
                  <CurrencyInput
                    value={form.costPriceDollar}
                    onChangeValue={(val) => setForm({ ...form, costPriceDollar: val.toString() })}
                    placeholder="e.g. 5.50"
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 border-slate-100 dark:border-slate-800/60`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Exchange Rate (៛/$)</label>
                    <button
                      type="button"
                      onClick={handleFetchRate}
                      disabled={isFetchingRate}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 disabled:opacity-50 font-medium"
                    >
                      {isFetchingRate ? (
                        <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Fetching...</span>
                      ) : (
                        "Fetch NBC Rate"
                      )}
                    </button>
                  </div>
                  <CurrencyInput
                    value={form.exchangeRate}
                    onChangeValue={(val) => setForm({ ...form, exchangeRate: val.toString() })}
                    placeholder="Enter rate..."
                    className="w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 border-slate-100 dark:border-slate-800/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Delivery Price (៛)</label>
                  <CurrencyInput
                    value={form.deliveryPrice}
                    onChangeValue={(val) => setForm({ ...form, deliveryPrice: val.toString() })}
                    placeholder="0"
                    className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 border-slate-100 dark:border-slate-800/60`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Final Cost (៛)</label>
                <CurrencyInput
                  value={form.costPrice}
                  onChangeValue={(val) => setForm({ ...form, costPrice: val.toString() })}
                  disabled={true}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold text-slate-900 dark:text-white focus:outline-none bg-slate-100 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800/60 cursor-not-allowed`}
                />
                {exactCostPrice > 0 && exactCostPrice !== Number(form.costPrice.replace(/,/g, "")) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Exact: {exactCostPrice.toLocaleString("en-US")} ៛
                  </p>
                )}
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.stockQuantity} <span className="text-red-500">*</span></label>
              <input type="text" value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: handleNumberInput(e.target.value) })}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 ${errors.stockQuantity ? "border-red-400" : "border-slate-100 dark:border-slate-800/60"}`}
              />
              {errors.stockQuantity && <p className="text-red-500 text-xs mt-1">{errors.stockQuantity}</p>}
            </div>

            {/* Product Linking */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 border-b border-indigo-200/50 dark:border-indigo-500/20 pb-2">Parent Product Linking (Optional)</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">If this product is a smaller part of a bulk product (e.g., 5kg bag from 50kg bag), link it here to enable unpacking.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Product</label>
                  <select value={form.parentProductId}
                    onChange={(e) => setForm({ ...form, parentProductId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-900 dark:text-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30">
                    <option value="">-- No Parent --</option>
                    {products.filter(p => p.id !== product?.id).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pieces per Parent</label>
                  <input type="text" value={form.piecesPerParent}
                    onChange={(e) => setForm({ ...form, piecesPerParent: handleNumberInput(e.target.value) })}
                    disabled={!form.parentProductId}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-900 dark:text-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/30 disabled:bg-slate-50 dark:disabled:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
                bg-gradient-to-r from-indigo-500 to-violet-600
                shadow-[0_0_16px_rgba(99,102,241,0.3)]
                hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]
                transition-all disabled:opacity-60 disabled:shadow-none">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? t.processing : mode === "create" ? t.createProduct : t.saveChanges}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirmDialog({
  product, onClose, onDeleted,
}: {
  product: Product | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!product) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(product.id);
      onDeleted(product.id);
      onClose();
    } catch {
      setError("Failed to delete — product may be referenced by transactions.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!product) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t.deleteProduct}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.deleteConfirmMsg}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-300 mb-4">
            Delete <strong className="text-slate-900 dark:text-white">{product.name}</strong>{product.nameKh ? ` (${product.nameKh})` : ""}?
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800 transition-colors">{t.cancel}</button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? t.processing : t.delete}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Unpack Confirm ───────────────────────────────────────────────────────────
function UnpackConfirmDialog({
  product, onClose, onUnpacked,
}: {
  product: Product | null;
  onClose: () => void;
  onUnpacked: () => void;
}) {
  const [isUnpacking, setIsUnpacking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(1);

  async function handleUnpack() {
    if (!product) return;
    setIsUnpacking(true);
    try {
      await productsApi.unpack(product.id, amount);
      onUnpacked();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to unpack product.");
    } finally {
      setIsUnpacking(false);
    }
  }

  if (!product) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Unpack Bulk Bags</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Convert parent to small bags</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            How many bulk bags do you want to unpack into <strong className="text-slate-900 dark:text-white">{product.name}</strong>?
          </p>
          <div className="mb-4">
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:bg-slate-950 transition-colors">Cancel</button>
            <button onClick={handleUnpack} disabled={isUnpacking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isUnpacking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Unpack
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [unpackTarget, setUnpackTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([productsApi.list(), categoriesApi.list()]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      showToast("Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleSaved(saved: Product) {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists ? prev.map((p) => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
    showToast(modalMode === "create" ? "Product created!" : "Product updated!");
  }

  function handleDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product deleted.");
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nameKh ?? "").includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !filterCategory || p.category?.id === filterCategory;
    const matchStock = !filterStock ||
      (filterStock === "in" && p.stockQuantity > 0) ||
      (filterStock === "out" && p.stockQuantity <= 0) ||
      (filterStock === "low" && p.stockQuantity > 0 && p.stockQuantity <= 10);
    return matchSearch && matchCat && matchStock;
  }).sort((a, b) => {
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
    if (sortBy === "priceAsc") return a.price - b.price;
    if (sortBy === "priceDesc") return b.price - a.price;
    if (sortBy === "stockAsc") return a.stockQuantity - b.stockQuantity;
    if (sortBy === "stockDesc") return b.stockQuantity - a.stockQuantity;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-slate-900 dark:bg-[#1a1d2e] border border-white/[0.08] text-white px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-sm font-medium animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}>{t.inventory}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.productsAndCategories(products.length, categories.length)}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setSelectedProduct(null); setModalMode("create"); }}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-indigo-500 to-violet-600
            shadow-[0_0_16px_rgba(99,102,241,0.35)]
            hover:shadow-[0_0_24px_rgba(99,102,241,0.55)]
            hover:from-indigo-400 hover:to-violet-500
            transition-all duration-200">
          <Plus className="w-4 h-4" /> {t.addProduct}
        </motion.button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder={t.searchInventory}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-white/[0.04] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-500/25 transition-all" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-w-[160px] transition-all">
            <option value="" className="dark:bg-[#1a1d2e]">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-[#1a1d2e]">{c.name}</option>
            ))}
          </select>
          <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-w-[150px] transition-all">
            <option value="" className="dark:bg-[#1a1d2e]">All Stock Status</option>
            <option value="in" className="dark:bg-[#1a1d2e]">In Stock</option>
            <option value="low" className="dark:bg-[#1a1d2e]">Low Stock (≤ 10)</option>
            <option value="out" className="dark:bg-[#1a1d2e]">Out of Stock</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-[#1a1d2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-w-[150px] transition-all">
            <option value="" className="dark:bg-[#1a1d2e]">Default Sort</option>
            <option value="nameAsc" className="dark:bg-[#1a1d2e]">Name (A-Z)</option>
            <option value="nameDesc" className="dark:bg-[#1a1d2e]">Name (Z-A)</option>
            <option value="priceAsc" className="dark:bg-[#1a1d2e]">Price (Low to High)</option>
            <option value="priceDesc" className="dark:bg-[#1a1d2e]">Price (High to Low)</option>
            <option value="stockAsc" className="dark:bg-[#1a1d2e]">Stock (Low to High)</option>
            <option value="stockDesc" className="dark:bg-[#1a1d2e]">Stock (High to Low)</option>
          </select>
        </div>

        {/* Table */}
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.06]">
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-16">{t.image}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.product}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.category}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.price}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.cost}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.margin}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.stock}</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-white/[0.04]">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={8} className="py-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
                    </td>
                  </motion.tr>
                ) : filtered.length === 0 ? (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={8} className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {searchTerm || filterCategory ? t.noResults : t.noProductsYet}
                    </td>
                  </motion.tr>
                ) : (
                  filtered.map((p, i) => {
                    const margin = p.price > 0
                      ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        key={p.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors duration-150 group"
                      >
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.07] flex items-center justify-center shrink-0">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImagePlus className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        </td>
                        {/* Name */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                          {p.nameKh && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate" style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}>{p.nameKh}</p>
                          )}
                          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{p.sku}</p>
                        </td>
                        {/* Category */}
                        <td className="px-4 py-3">
                          {p.category ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/[0.1] text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/[0.2]">
                              <Tag className="w-3 h-3" />{p.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 text-right tabular-nums">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 text-right tabular-nums">{formatCurrency(p.costPrice)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-bold tabular-nums ${Number(margin) >= 10 ? "text-emerald-600 dark:text-emerald-400"
                            : Number(margin) > 0 ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                            }`}>{margin}%</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-lg text-xs font-bold tabular-nums ${p.stockQuantity > 20
                            ? "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-400"
                            : p.stockQuantity > 0
                              ? "bg-amber-100 dark:bg-amber-500/[0.12] text-amber-800 dark:text-amber-400"
                              : "bg-rose-100 dark:bg-rose-500/[0.12] text-rose-800 dark:text-rose-400"
                            }`}>{p.stockQuantity}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {p.parentProductId && p.piecesPerParent && (
                              <button
                                onClick={() => setUnpackTarget(p)}
                                className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Unpack">
                                <Package className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedProduct(p); setModalMode("edit"); }}
                              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all active:scale-90" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all active:scale-90" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden flex flex-col divide-y divide-slate-100/60 dark:divide-white/[0.04]">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
                {searchTerm || filterCategory ? t.noResults : t.noProductsYet}
              </motion.div>
            ) : (
              filtered.map((p, i) => {
                const margin = p.price > 0
                  ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1)
                  : "0.0";
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    key={p.id}
                    className="p-4 flex flex-col gap-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.07] flex items-center justify-center shrink-0">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                        {p.nameKh && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate mt-0.5" style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}>{p.nameKh}</p>
                        )}
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">{p.sku}</p>
                        
                        {p.category && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/[0.1] text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/[0.2]">
                              <Tag className="w-2.5 h-2.5" />{p.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${p.stockQuantity > 20
                          ? "bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-400"
                          : p.stockQuantity > 0
                            ? "bg-amber-100 dark:bg-amber-500/[0.12] text-amber-800 dark:text-amber-400"
                            : "bg-rose-100 dark:bg-rose-500/[0.12] text-rose-800 dark:text-rose-400"
                          }`}>{p.stockQuantity}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-white/[0.04]">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">{t.price}</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{formatCurrency(p.price)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium">{t.cost}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{formatCurrency(p.costPrice)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-medium">{t.margin}</div>
                        <div className={`text-sm font-bold mt-0.5 ${Number(margin) >= 10 ? "text-emerald-600 dark:text-emerald-400"
                          : Number(margin) > 0 ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                          }`}>{margin}%</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      {p.parentProductId && p.piecesPerParent && (
                        <button
                          onClick={() => setUnpackTarget(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all">
                          <Package className="w-3.5 h-3.5" />
                          Unpack
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedProduct(p); setModalMode("edit"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.1] transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-rose-50 dark:hover:bg-rose-500/[0.1] transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProductModal mode={modalMode} product={selectedProduct} categories={categories} products={products}
        onClose={() => setModalMode(null)} onSaved={handleSaved} />
      <DeleteConfirmDialog product={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <UnpackConfirmDialog product={unpackTarget}
        onClose={() => setUnpackTarget(null)} onUnpacked={() => { load(); showToast("Product unpacked successfully"); }} />
    </div>
  );
}
