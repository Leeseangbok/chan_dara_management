import { apiClient } from "./client";
import { PurchaseOrder, CreatePurchaseOrderPayload } from "./types";

export const purchasesApi = {
  async list(): Promise<PurchaseOrder[]> {
    const { data } = await apiClient.get<PurchaseOrder[]>("/api/v1/purchases");
    return data;
  },

  async get(id: string): Promise<PurchaseOrder> {
    const { data } = await apiClient.get<PurchaseOrder>(`/api/v1/purchases/${id}`);
    return data;
  },

  async create(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<PurchaseOrder>("/api/v1/purchases", payload);
    return data;
  },

  async markReceived(id: string): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<PurchaseOrder>(`/api/v1/purchases/${id}/receive`);
    return data;
  },

  async markCancelled(id: string): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<PurchaseOrder>(`/api/v1/purchases/${id}/cancel`);
    return data;
  }
};
