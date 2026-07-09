import { apiClient } from "./client";
import { Customer } from "./types";

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type UpdateCustomerPayload = CreateCustomerPayload;

export const customersApi = {
  async list(): Promise<Customer[]> {
    const { data } = await apiClient.get<Customer[]>("/api/v1/customers");
    return data;
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
    return data;
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const { data } = await apiClient.post<Customer>("/api/v1/customers", payload);
    return data;
  },

  async update(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const { data } = await apiClient.put<Customer>(`/api/v1/customers/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/customers/${id}`);
  },
};
