"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "./cart-store";

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const n = mounted ? cartCount(lines) : 0;
  return (
    <Link href="/cart" className="btn-primary relative px-3" aria-label={`Cart, ${n} items`}>
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {n > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold">
          {n}
        </span>
      )}
    </Link>
  );
}
