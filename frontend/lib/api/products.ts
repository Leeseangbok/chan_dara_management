import { apiClient } from "./client";
import { Product } from "./types";

export interface CreateProductPayload {
  sku: string;
  name: string;
  nameKh: string | null;
  description: string | null;
  categoryId: string | null;
  price: number;
  costPrice: number;
  costPriceDollar?: number;
  exchangeRate?: number;
  deliveryPrice?: number;
  stockQuantity: number;
}

export type UpdateProductPayload = Omit<CreateProductPayload, "sku">;

export const productsApi = {
  async list(): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/api/v1/products");
    return data;
  },

  async generateSku(categoryId?: string): Promise<string> {
    const url = categoryId ? `/api/v1/products/generate-sku?categoryId=${categoryId}` : `/api/v1/products/generate-sku`;
    const { data } = await apiClient.get<string>(url);
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/api/v1/products/${id}`);
    return data;
  },

  async create(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiClient.post<Product>("/api/v1/products", payload);
    return data;
  },

  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await apiClient.put<Product>(`/api/v1/products/${id}`, payload);
    return data;
  },

  async uploadImage(id: string, file: File): Promise<Product> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<Product>(`/api/v1/products/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/products/${id}`);
  },
};
