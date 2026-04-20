import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type UserRole = 'employer' | 'candidate';

interface OnboardingState {
  role: UserRole | null;
  isOnboarded: boolean;
  setRole: (role: UserRole) => void;
  reset: () => void;
}

const STORAGE_KEY = 'stella_role';

const OnboardingContext = createContext<OnboardingState | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    try {
      return (sessionStorage.getItem(STORAGE_KEY) as UserRole) || null;
    } catch {
      return null;
    }
  });

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    try {
      sessionStorage.setItem(STORAGE_KEY, newRole);
    } catch {
      // SSR or private mode — state still works in memory
    }
  }, []);

  const reset = useCallback(() => {
    setRoleState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Sync if another tab changes it (unlikely with sessionStorage, but safe)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRoleState((e.newValue as UserRole) || null);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <OnboardingContext.Provider value={{
      role,
      isOnboarded: role !== null, // Full onboarding = role + wallet (checked by pages)
      setRole,
      reset,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * useOnboarding — manages the user's role selection and onboarding state.
 */
export const useOnboarding = (): OnboardingState => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
