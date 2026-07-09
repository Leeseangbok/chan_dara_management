import { apiClient } from "./client";
import { Category } from "./types";

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/api/v1/categories");
    return data;
  },

  async create(name: string, nameKh: string | null): Promise<Category> {
    const { data } = await apiClient.post<Category>("/api/v1/categories", { name, nameKh });
    return data;
  },

  async update(id: string, name: string, nameKh: string | null): Promise<Category> {
    const { data } = await apiClient.put<Category>(`/api/v1/categories/${id}`, { name, nameKh });
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/categories/${id}`);
  },
};
