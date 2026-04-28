import { useState, useCallback } from 'react';

const ADMIN_SESSION_KEY = 'stella_admin_auth';

export function useAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });

  const login = useCallback((password: string): boolean => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? 'stella-admin-dev';
    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
