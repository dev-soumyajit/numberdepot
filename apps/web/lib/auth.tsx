'use client';

import { create } from 'zustand';
import { api } from './api';
import { ReactNode, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin';
  status: string;
  phone?: string;
  companyName?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  _hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAdmin: false,
  isSeller: false,

  _hydrate: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        set({ user: null, loading: false, isAdmin: false, isSeller: false });
        return;
      }
      const res = await api.get<User>('/users/me');
      if (res.data) {
        const u = res.data;
        set({
          user: u,
          loading: false,
          isAdmin: u.role === 'admin' || u.role === 'super_admin',
          isSeller: u.role === 'seller',
        });
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      set({ user: null, loading: false, isAdmin: false, isSeller: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/login', { email, password });
    if (res.data) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      const u = res.data.user;
      set({
        user: u,
        isAdmin: u.role === 'admin' || u.role === 'super_admin',
        isSeller: u.role === 'seller',
      });
    }
  },

  register: async (data) => {
    const res = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/register', data);
    if (res.data) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      const u = res.data.user;
      set({
        user: u,
        isAdmin: u.role === 'admin' || u.role === 'super_admin',
        isSeller: u.role === 'seller',
      });
    }
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAdmin: false, isSeller: false });
  },

  refreshUser: async () => {
    await get()._hydrate();
  },
}));

/** Drop this component once in your Providers to auto-hydrate the auth store on a mount */
export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuth((s) => s._hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
