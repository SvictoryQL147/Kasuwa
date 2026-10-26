"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cartSubtotal, useCart } from "@/components/cart-store";
import { naira } from "@/lib/money";

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <div className="container-x py-10" />;

  if (lines.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-ink-500">Tip: Team-Up deals are up to 30% cheaper.</p>
        <Link href="/search?team=1" className="btn-primary mt-6">Browse Team-Up deals</Link>
      </div>
    );
  }

  const items = lines.map((l) => `${l.productId}:${l.quantity}`).join(",");
  return (
    <div className="container-x grid gap-6 pb-28 pt-4 md:grid-cols-[1fr_340px] md:py-8">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Cart</h1>
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.productId} className="card flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1 basis-40">
                <Link href={`/p/${l.slug}`} className="line-clamp-2 font-medium hover:text-brand-700">{l.title}</Link>
                <p className="text-sm font-semibold">{naira(l.price)}</p>
              </div>
              <div className="flex items-center rounded-xl ring-1 ring-ink-300">
                <button className="p-2.5" onClick={() => setQty(l.productId, l.quantity - 1)} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                <button className="p-2.5" onClick={() => setQty(l.productId, l.quantity + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
              </div>
              <button className="p-2.5 text-ink-500 hover:text-red-600" onClick={() => remove(l.productId)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card hidden h-fit space-y-3 p-4 md:sticky md:top-36 md:block">
        <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{naira(cartSubtotal(lines))}</span></div>
        <p className="text-xs text-ink-500">Delivery fee and final prices are confirmed at checkout.</p>
        <Link href={`/checkout?items=${encodeURIComponent(items)}`} className="btn-primary w-full py-3">Checkout</Link>
      </aside>

      {/* Phones: sticky checkout bar above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-ink-300/60 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-500">Subtotal · delivery at checkout</p>
          <p className="text-lg font-bold">{naira(cartSubtotal(lines))}</p>
        </div>
        <Link href={`/checkout?items=${encodeURIComponent(items)}`} className="btn-primary px-6 py-3">Checkout</Link>
      </div>
    </div>
  );
}
