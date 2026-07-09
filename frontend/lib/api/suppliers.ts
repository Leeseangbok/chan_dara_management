import { apiClient } from "./client";
import { Supplier, CreateSupplierPayload } from "./types";

export const suppliersApi = {
  async list(): Promise<Supplier[]> {
    const { data } = await apiClient.get<Supplier[]>("/api/v1/suppliers");
    return data;
  },

  async get(id: string): Promise<Supplier> {
    const { data } = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}`);
    return data;
  },

  async create(payload: CreateSupplierPayload): Promise<Supplier> {
    const { data } = await apiClient.post<Supplier>("/api/v1/suppliers", payload);
    return data;
  },

  async update(id: string, payload: CreateSupplierPayload): Promise<Supplier> {
    const { data } = await apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/suppliers/${id}`);
  }
};
