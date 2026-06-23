"use client";
import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { addItem, setQuantity, removeItem, cartCount, cartSubtotal, type CartItem } from "./cart-logic";

const STORAGE_KEY = "wsb-cart-v1";

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // localStorage 하이드레이션: mount 후 1회 외부 스토어와 동기화한다(SSR 초기값 []와의
      // hydration mismatch를 피하기 위한 의도된 패턴이라 set-state-in-effect 룰을 끈다).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // mutator 들을 useCallback 으로 안정화한다. setItems 는 stable 하므로 의존성 없음.
  // 이렇게 해야 이 함수들을 useEffect 의존성으로 쓰는 소비자(예: ClearCartOnMount 의
  // `useEffect(() => clear(), [clear])`)가 매 렌더 새 참조로 인해 무한 루프에 빠지지 않는다.
  const add = useCallback((item: CartItem) => setItems((c) => addItem(c, item)), []);
  const setQty = useCallback((id: string, qty: number) => setItems((c) => setQuantity(c, id, qty)), []);
  const remove = useCallback((id: string) => setItems((c) => removeItem(c, id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add,
      setQty,
      remove,
      clear,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
    }),
    [items, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
