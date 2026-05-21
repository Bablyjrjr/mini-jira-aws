import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '../types';

export const TOKEN_STORAGE_KEY = 'mini-jira-token';
export const USER_STORAGE_KEY = 'mini-jira-user';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isReady: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  const login = useCallback(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

    if (!domain || !clientId || !redirectUri) {
      return;
    }

    const loginUrl = `${domain}/login?client_id=${encodeURIComponent(clientId)}&response_type=token&scope=${encodeURIComponent(
      'openid email profile',
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.assign(loginUrl);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);

    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';

    if (!domain || !clientId) {
      window.location.assign('/');
      return;
    }

    const logoutUrl = `${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`;
    window.location.assign(logoutUrl);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isReady,
      login,
      logout,
    }),
    [isReady, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
