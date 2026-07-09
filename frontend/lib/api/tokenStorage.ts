import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "sbms_access_token";
const REFRESH_TOKEN_KEY = "sbms_refresh_token";

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },
  setTokens(accessToken: string, refreshToken: string): void {
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 1, path: "/", sameSite: "Lax" });
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7, path: "/", sameSite: "Lax" });
  },
  clear(): void {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  },
};

