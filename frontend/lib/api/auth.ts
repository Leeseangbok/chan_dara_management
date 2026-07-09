import { apiClient } from "./client";
import { tokenStorage } from "./tokenStorage";
import { AuthResponse } from "./types";

export const authApi = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/api/v1/auth/login", {
      username,
      password,
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout(): void {
    tokenStorage.clear();
  },
};
