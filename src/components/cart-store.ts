"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  price: number; // kobo, display only; the server re-prices at checkout
  image?: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: Math.min(l.quantity + qty, 20) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity: qty }] };
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(qty, 20)) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "kasuwa-cart" },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);
