"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  loadSessionLoggedIn,
  saveSessionLoggedIn,
} from "@/state/session-storage";

type AuthValue = {
  hydrated: boolean;
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setLoggedIn(loadSessionLoggedIn());
      setHydrated(true);
    });
  }, []);

  const login = useCallback(() => {
    saveSessionLoggedIn(true);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    saveSessionLoggedIn(false);
    setLoggedIn(false);
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
