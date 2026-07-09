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
  }
};
