"use client";
import { useEffect } from "react";
import { useCart } from "./cart-store";

/** Empties the cart once an order from it has been placed. */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
