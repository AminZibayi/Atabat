// In the Name of God, the Creative, the Originator
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      }

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      // Reload page to update UI
      window.location.href = '/';
    } catch {
      console.error('Logout failed');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    logout,
    refetch: checkAuth,
  };
}
