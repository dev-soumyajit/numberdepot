'use client';

import { create } from 'zustand';
import { api } from './api';
import { ReactNode, useEffect, useRef } from 'react';

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
  source: 'inventory' | 'numberbarn';
  reservedUntil: string | null; // ISO string
  numberbarnTn?: string;
  rawNumber?: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  count: number;
  total: number;
  refreshCart: () => Promise<void>;
  addItem: (
    phoneNumberId: string,
    listingId: string,
    planType: string,
    numberData?: {
      number: string;
      numberType: string;
      price: number;
      setupFee: number;
      monthlyFee: number;
      source?: 'inventory' | 'numberbarn';
      numberbarnTn?: string;
      rawNumber?: string;
    }
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkExpirations: () => void;
}

const CART_STORAGE_KEY = 'nd_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function computeTotals(items: CartItem[]) {
  return {
    items,
    count: items.length,
    total: items.reduce((s, i) => s + i.price + i.setupFee, 0),
  };
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  count: 0,
  total: 0,

  refreshCart: async () => {
    const items = loadCart();
    set({ ...computeTotals(items), loading: false });
  },

  addItem: async (phoneNumberId, listingId, planType, numberData) => {
    set({ loading: true });
    try {
      const source = numberData?.source || 'inventory';
      let reservedUntil: string | null = null;

      if (source === 'inventory') {
        // Reserve via API
        const res = await api.post<{ expiresAt: string }>('/cart/reserve', { numberId: phoneNumberId });
        reservedUntil = res.data?.expiresAt || null;
      } else {
        // NumberBarn — local-only 15min timer
        reservedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      const item: CartItem = {
        id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        phoneNumberId,
        listingId,
        number: numberData?.number || '',
        numberType: numberData?.numberType || 'local',
        price: numberData?.price || 0,
        planType,
        setupFee: numberData?.setupFee ?? 9.99,
        monthlyFee: numberData?.monthlyFee || 0,
        isAdminNumber: source === 'inventory',
        source,
        reservedUntil,
        numberbarnTn: numberData?.numberbarnTn,
        rawNumber: numberData?.rawNumber,
      };

      const items = [...loadCart(), item];
      saveCartToStorage(items);
      set({ ...computeTotals(items), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    const items = loadCart();
    const item = items.find((i) => i.id === itemId);

    if (item && item.source === 'inventory') {
      try {
        await api.post('/cart/release', { numberId: item.phoneNumberId });
      } catch {
        // Best effort — item may have expired
      }
    }

    const updated = items.filter((i) => i.id !== itemId);
    saveCartToStorage(updated);
    set(computeTotals(updated));
  },

  clearCart: async () => {
    const items = loadCart();
    // Release all inventory reservations
    for (const item of items) {
      if (item.source === 'inventory') {
        try {
          await api.post('/cart/release', { numberId: item.phoneNumberId });
        } catch {
          // Best effort
        }
      }
    }
    saveCartToStorage([]);
    set({ items: [], count: 0, total: 0 });
  },

  checkExpirations: () => {
    const items = loadCart();
    const now = Date.now();
    const expired = items.filter(
      (i) => i.reservedUntil && new Date(i.reservedUntil).getTime() <= now
    );

    if (expired.length > 0) {
      const remaining = items.filter(
        (i) => !i.reservedUntil || new Date(i.reservedUntil).getTime() > now
      );
      saveCartToStorage(remaining);
      set(computeTotals(remaining));
    }
  },
}));

/** CartProvider: initializes cart from localStorage and runs expiration checks */
export function CartProvider({ children }: { children: ReactNode }) {
  const refreshCart = useCart((s) => s.refreshCart);
  const checkExpirations = useCart((s) => s.checkExpirations);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshCart();
    }

    // Check expirations every 10 seconds
    const interval = setInterval(checkExpirations, 10_000);
    return () => clearInterval(interval);
  }, [refreshCart, checkExpirations]);

  // Refresh reservations every 10 minutes while user is active
  useEffect(() => {
    const refreshReservations = async () => {
      const items = loadCart();
      const inventoryIds = items
        .filter((i) => i.source === 'inventory' && i.reservedUntil)
        .map((i) => i.phoneNumberId);

      if (inventoryIds.length === 0) return;

      try {
        const res = await api.post<{ expiresAt: string }>('/cart/refresh', {
          numberIds: inventoryIds,
        });
        if (res.data?.expiresAt) {
          const updated = items.map((i) =>
            i.source === 'inventory' ? { ...i, reservedUntil: res.data!.expiresAt } : i
          );
          saveCartToStorage(updated);
        }
      } catch {
        // Best effort
      }
    };

    const interval = setInterval(refreshReservations, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
