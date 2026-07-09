import { apiClient } from "./client";
import { User, CreateUserPayload, UpdateUserPayload } from "./types";

export const usersApi = {
  async list(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/api/v1/users");
    return data;
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await apiClient.post<User>("/api/v1/users", payload);
    return data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const { data } = await apiClient.put<User>(`/api/v1/users/${id}`, payload);
    return data;
  },

  async toggleActive(id: string, active: boolean): Promise<User> {
    const { data } = await apiClient.put<User>(`/api/v1/users/${id}`, { active } as UpdateUserPayload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/users/${id}`);
  }
};
