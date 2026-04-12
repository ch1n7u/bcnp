"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, logout as clearAuthStorage, setAuth } from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getToken());
    setUser(getUser());
    setLoading(false);
  }, []);

  const login = ({ token: accessToken, user: authUser }) => {
    setAuth(accessToken, authUser);
    setToken(accessToken);
    setUser(authUser);
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
