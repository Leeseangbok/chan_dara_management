"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { productsApi, CreateProductPayload, UpdateProductPayload } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { Product, Category } from "@/lib/api/types";
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Package, AlertCircle, X, Check, Loader2, ImagePlus, AlertTriangle, Tag, CheckCircle } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency } from "@/lib/utils/currency";

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
  stockQuantity: string;
}

const emptyForm: FormState = {
  sku: "", name: "", nameKh: "", description: "",
  categoryId: "", price: "", costPrice: "", stockQuantity: "0",
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
      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
        style={{ height: 160 }}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4" /> Change Image
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
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
  mode, product, categories, onClose, onSaved,
}: {
  mode: ModalMode;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
        stockQuantity: product.stockQuantity.toLocaleString("en-US"),
      });
    } else {
      setForm(emptyForm);
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
        costPrice: parseFloat(form.costPrice.replace(/,/g, "")),
        stockQuantity: parseInt(form.stockQuantity.replace(/,/g, "") || "0"),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}>
            {mode === "create" ? t.addProduct : t.editProduct}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {apiError && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sku} <span className="text-red-500">*</span></label>
            <input type="text" value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              disabled={mode === "edit"} placeholder="e.g. PRD-001"
              className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${mode === "edit" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"} ${errors.sku ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
          </div>

          {/* Name + Khmer Name side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.productNameEn} <span className="text-red-500">*</span></label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dog Food 10kg"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.productNameKh}</label>
              <input type="text" value={form.nameKh}
                onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
                placeholder="ឧ. អាហារឆ្កែ ១០គ.ក"
                lang="km"
                className="w-full px-3 py-2 rounded-lg border border-gray-300​text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Optional product description..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Price + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.sellingPrice} <span className="text-red-500">*</span></label>
              <CurrencyInput
                value={form.price}
                onChangeValue={(val) => setForm({ ...form, price: val.toString() })}
                placeholder="e.g. 50000"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.price ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.costPrice} <span className="text-red-500">*</span></label>
              <CurrencyInput
                value={form.costPrice}
                onChangeValue={(val) => setForm({ ...form, costPrice: val.toString() })}
                placeholder="e.g. 35000"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.costPrice ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockQuantity} <span className="text-red-500">*</span></label>
            <input type="text" value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: handleNumberInput(e.target.value) })}
              className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.stockQuantity ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.stockQuantity && <p className="text-red-500 text-xs mt-1">{errors.stockQuantity}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? t.processing : mode === "create" ? t.createProduct : t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{t.deleteProduct}</h3>
            <p className="text-sm text-gray-500">{t.deleteConfirmMsg}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Delete <strong>{product.name}</strong>{product.nameKh ? ` (${product.nameKh})` : ""}?
        </p>
        {error && <p className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded-lg border border-red-200">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">{t.cancel}</button>
          <button onClick={handleDelete} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? t.processing : t.delete}
          </button>
        </div>
      </div>
    </div>
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
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
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
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-4 h-4 text-green-400" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: language === 'km' ? "'Khmer OS', 'Noto Sans Khmer', sans-serif" : undefined }}>{t.inventory}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.productsAndCategories(products.length, categories.length)}</p>
        </div>
        <button
          onClick={() => { setSelectedProduct(null); setModalMode("create"); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow-md">
          <Plus className="w-5 h-5" /> {t.addProduct}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={t.searchInventory}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-40">
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">{t.image}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.product}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.category}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.price}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.cost}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.margin}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.stock}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-500 text-sm">
                  {searchTerm || filterCategory ? t.noResults : t.noProductsYet}
                </td></tr>
              ) : (
                filtered.map((p) => {
                  const margin = p.price > 0
                    ? (((p.price - p.costPrice) / p.price) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${API_BASE}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImagePlus className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        {p.nameKh && (
                          <p className="text-xs text-indigo-600 truncate" style={{ fontFamily: "'Khmer OS', 'Noto Sans Khmer', sans-serif" }}>{p.nameKh}</p>
                        )}
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{p.sku}</p>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        {p.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            <Tag className="w-3 h-3" />{p.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(p.costPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-green-600">{margin}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.stockQuantity > 20 ? "bg-green-100 text-green-800"
                          : p.stockQuantity > 0 ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                          }`}>{p.stockQuantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 transition-opacity">
                          <button onClick={() => { setSelectedProduct(p); setModalMode("edit"); }}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal mode={modalMode} product={selectedProduct} categories={categories}
        onClose={() => setModalMode(null)} onSaved={handleSaved} />
      <DeleteConfirmDialog product={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </div>
  );
}
