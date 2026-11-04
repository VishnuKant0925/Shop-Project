'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { reconnectSocket } from '@/lib/socket';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('pandit_user');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    const loadSession = window.setTimeout(() => {
      refreshUser();
      setIsLoading(false);
    }, 0);
    return () => window.clearTimeout(loadSession);
  }, [refreshUser]);

  // Re-handshake the realtime socket only when the signed-in user actually changes
  // (the first connection already reads the stored token).
  const userId = user?.id ?? null;
  const lastUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (isLoading) return;
    if (lastUserId.current !== undefined && lastUserId.current !== userId) reconnectSocket();
    lastUserId.current = userId;
  }, [userId, isLoading]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // The browser session is cleared by api.logout even when the server is unavailable.
    }
    // Cleared after the stored token is gone so the socket re-handshakes anonymously.
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
