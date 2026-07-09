import { apiClient } from "./client";
import { Expense, CreateExpensePayload } from "./types";

export const expensesApi = {
  async list(): Promise<Expense[]> {
    const { data } = await apiClient.get<Expense[]>("/api/v1/expenses");
    return data;
  },

  async get(id: string): Promise<Expense> {
    const { data } = await apiClient.get<Expense>(`/api/v1/expenses/${id}`);
    return data;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const { data } = await apiClient.get<Expense[]>(`/api/v1/expenses/range`, {
      params: { startDate, endDate }
    });
    return data;
  },

  async create(payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await apiClient.post<Expense>("/api/v1/expenses", payload);
    return data;
  },

  async update(id: string, payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await apiClient.put<Expense>(`/api/v1/expenses/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/expenses/${id}`);
  }
};
