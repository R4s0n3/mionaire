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

import { apiClient, ApiClientError, type ApiUser } from "@/lib/api-client";

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const session = await apiClient.getSession();
    const authenticatedUser = session?.user?.id ? session.user : null;
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void apiClient
      .getSession()
      .then((session) => {
        if (!cancelled) setUser(session?.user?.id ? session.user : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      await apiClient.signInWithCredentials(input);
      if (!(await refreshSession())) {
        throw new ApiClientError("Sign-in did not create a session.", 401);
      }
    },
    [refreshSession],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      await apiClient.register(input);
      await apiClient.signInWithCredentials({
        email: input.email,
        password: input.password,
      });
      if (!(await refreshSession())) {
        throw new ApiClientError(
          "Your account was created, but sign-in did not create a session.",
          401,
        );
      }
    },
    [refreshSession],
  );

  const loginWithDiscord = useCallback(async () => {
    await apiClient.signInWithDiscord();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      loginWithDiscord,
      logout,
    }),
    [user, isLoading, login, register, loginWithDiscord, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
