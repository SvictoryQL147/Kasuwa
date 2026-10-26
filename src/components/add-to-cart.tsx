"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart, type CartLine } from "./cart-store";

export function AddToCart({ product, disabled }: { product: Omit<CartLine, "quantity">; disabled?: boolean }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="hidden flex-wrap items-center gap-2 md:flex">
      <div className="flex items-center rounded-xl ring-1 ring-ink-300">
        <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
        <span className="w-8 text-center font-semibold">{qty}</span>
        <button className="p-2.5" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase"><Plus className="h-4 w-4" /></button>
      </div>
      <button
        className="btn-ghost flex-1"
        disabled={disabled}
        onClick={() => { add(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
      >
        {added ? <Check className="h-4 w-4 text-brand-600" /> : <ShoppingCart className="h-4 w-4" />}
        {added ? "Added" : "Add to cart"}
      </button>
      <button
        className="btn-primary flex-1"
        disabled={disabled}
        onClick={() => { add(product, qty); router.push("/cart"); }}
      >
        {disabled ? "Out of stock" : "Buy now"}
      </button>
    </div>
  );
}
