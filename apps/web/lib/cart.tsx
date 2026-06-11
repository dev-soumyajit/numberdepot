'use client';

import { create } from 'zustand';
import { api } from './api';
import { ReactNode } from 'react';

export interface CartItem {
  id: string;
  phoneNumberId: string;
  listingId: string;
  number: string;
  numberType: string;
  price: number;
  planType: string;
  setupFee: number;
  monthlyFee: number;
  sellerId?: string;
  isAdminNumber: boolean;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  count: number;
  total: number;
  refreshCart: () => Promise<void>;
  addItem: (phoneNumberId: string, listingId: string, planType: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  count: 0,
  total: 0,

  refreshCart: async () => {
    try {
      set({ loading: true });
      const res = await api.get<CartItem[]>('/orders/cart');
      const items = res.data || [];
      set({
        items,
        count: items.length,
        total: items.reduce((s, i) => s + i.price + i.setupFee, 0),
        loading: false,
      });
    } catch {
      set({ items: [], count: 0, total: 0, loading: false });
    }
  },

  addItem: async (phoneNumberId, listingId, planType) => {
    await api.post('/orders/cart/items', { phoneNumberId, listingId, planType });
    await get().refreshCart();
  },

  removeItem: async (itemId) => {
    await api.delete(`/orders/cart/items/${itemId}`);
    await get().refreshCart();
  },

  clearCart: async () => {
    await api.delete('/orders/cart');
    set({ items: [], count: 0, total: 0 });
  },
}));

/** Wrapper kept for consistency — no-op since Zustand doesn't need a provider */
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
