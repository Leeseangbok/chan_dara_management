import { apiClient } from "./client";
import { CreateTransactionRequest, TransactionResponse } from "./types";

export const transactionsApi = {
  async create(request: CreateTransactionRequest): Promise<TransactionResponse> {
    const { data } = await apiClient.post<TransactionResponse>(
      "/api/v1/transactions",
      request
    );
    return data;
  },

  async getById(id: string): Promise<TransactionResponse> {
    const { data } = await apiClient.get<TransactionResponse>(
      `/api/v1/transactions/${id}`
    );
    return data;
  },

  async getUnpaidAnalytics(): Promise<import("./types").UnpaidAnalyticsResponse> {
    const { data } = await apiClient.get<import("./types").UnpaidAnalyticsResponse>(
      `/api/v1/transactions/analytics/unpaid`
    );
    return data;
  },

  async getDashboardMetrics(): Promise<import("./types").DashboardMetricsResponse> {
    const { data } = await apiClient.get<import("./types").DashboardMetricsResponse>(
      `/api/v1/analytics/dashboard`
    );
    return data;
  },

  async getAll(): Promise<TransactionResponse[]> {
    const { data } = await apiClient.get<TransactionResponse[]>(
      `/api/v1/transactions`
    );
    return data;
  },

  async getByCustomer(customerId: string): Promise<TransactionResponse[]> {
    const { data } = await apiClient.get<TransactionResponse[]>(
      `/api/v1/transactions/customer/${customerId}`
    );
    return data;
  },

  async addPayment(id: string, payload: { amount: number; paymentMethod: "CASH" | "QR_CODE" }): Promise<TransactionResponse> {
    const { data } = await apiClient.post<TransactionResponse>(
      `/api/v1/transactions/${id}/payments`,
      payload
    );
    return data;
  },

  async updateItems(id: string, request: CreateTransactionRequest): Promise<TransactionResponse> {
    const { data } = await apiClient.put<TransactionResponse>(
      `/api/v1/transactions/${id}/items`,
      request
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/transactions/${id}`);
  },

  async getPendingDeliveries(): Promise<TransactionResponse[]> {
    const { data } = await apiClient.get<TransactionResponse[]>(
      `/api/v1/transactions/deliveries/pending`
    );
    return data;
  },

  async updateDeliveryStatus(id: string, status: string): Promise<TransactionResponse> {
    const { data } = await apiClient.patch<TransactionResponse>(
      `/api/v1/transactions/${id}/delivery-status`,
      { status }
    );
    return data;
  }
};
