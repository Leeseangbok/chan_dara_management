"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { authApi } from "../api/auth";
import { tokenStorage } from "../api/tokenStorage";
import { Role } from "../api/types";

import { useRouter } from "next/navigation";

interface DecodedToken {
  sub: string;
  roles: string; // comma-separated, e.g. "ROLE_STAFF"
  uid: string;
  exp: number;
}

interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<Role>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUserFromToken(): AuthUser | null {
  const token = tokenStorage.getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) return null;

    const role = decoded.roles.replace("ROLE_", "") as Role;
    return { id: decoded.uid, username: decoded.sub, role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(decodeUserFromToken());
    setIsLoading(false);
  }, []);

  async function login(username: string, password: string): Promise<Role> {
    const response = await authApi.login(username, password);
    const role = response.role as Role;
    setUser(decodeUserFromToken());
    return role;
  }

  function logout() {
    authApi.logout();
    setUser(null);
    router.push("/login");
  }

  function hasRole(...roles: Role[]): boolean {
    return user !== null && roles.includes(user.role);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
