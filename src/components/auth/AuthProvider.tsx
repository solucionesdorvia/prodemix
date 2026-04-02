"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { signOut, useSession } from "next-auth/react";

type AuthValue = {
  hydrated: boolean;
  loggedIn: boolean;
  /** Navega a /login (por si un flujo legacy lo necesita). */
  login: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const hydrated = status !== "loading";
  const loggedIn = status === "authenticated";

  const login = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const value = useMemo(
    () => ({ hydrated, loggedIn, login, logout }),
    [hydrated, loggedIn, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
