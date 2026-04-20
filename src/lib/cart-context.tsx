"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { Sticker } from "./albums";

const STORAGE_KEY = "fp_global_cart";
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { items, updatedAt } = JSON.parse(raw);
    if (Date.now() - updatedAt > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return items || [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, updatedAt: Date.now() }));
    }
  } catch {
    /* quota exceeded — silent */
  }
}

// Estende Sticker com preço para o carrinho
export interface CartSticker extends Sticker {
  price: number;
}

export interface CartItem {
  sticker: CartSticker;
  albumYear: string;
  quantity: number;
}

// Gera chave única: código + ano do álbum
function itemKey(code: string, albumYear: string) {
  return `${code}-${albumYear}`;
}

interface CartContextType {
  items: CartItem[];
  addItem: (sticker: CartSticker, albumYear: string) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback((sticker: CartSticker, albumYear: string) => {
    const key = itemKey(sticker.code, albumYear);
    setItems((prev) => {
      const existing = prev.find((i) => itemKey(i.sticker.code, i.albumYear) === key);
      if (existing) {
        return prev.map((i) =>
          itemKey(i.sticker.code, i.albumYear) === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { sticker, albumYear, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => itemKey(i.sticker.code, i.albumYear) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => itemKey(i.sticker.code, i.albumYear) !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (itemKey(i.sticker.code, i.albumYear) === key ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.sticker.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
