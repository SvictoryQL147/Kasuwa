"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Users } from "lucide-react";
import { naira } from "@/lib/money";
import { useCart, type CartLine } from "./cart-store";

/**
 * Sticky purchase bar on phones (sits above the bottom nav).
 * Team-Up products get the "buy alone vs. team up" split, Pinduoduo style.
 */
export function MobileBuyBar({
  product, teamPrice, teamSize, disabled,
}: {
  product: Omit<CartLine, "quantity">;
  teamPrice?: number | null;
  teamSize?: number | null;
  disabled?: boolean;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const buyAlone = () => { add(product, 1); router.push("/cart"); };

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-ink-300/60 bg-white p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
      {disabled ? (
        <button className="btn-ghost w-full py-3" disabled>Out of stock</button>
      ) : teamPrice && teamSize ? (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={buyAlone} className="btn-ghost flex-col gap-0 py-2 leading-tight">
            <span className="text-base font-bold">{naira(product.price)}</span>
            <span className="text-[11px] font-medium text-ink-500">Buy alone</span>
          </button>
          <Link href={`/checkout?product=${product.productId}&team=new`} className="btn-accent flex-col gap-0 py-2 leading-tight">
            <span className="text-base font-bold">{naira(teamPrice)}</span>
            <span className="flex items-center gap-1 text-[11px] font-medium"><Users className="h-3 w-3" /> Team-Up ({teamSize})</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { add(product, 1); setAdded(true); setTimeout(() => setAdded(false), 1500); }} className="btn-ghost py-3">{added ? "Added ✓" : "Add to cart"}</button>
          <button onClick={buyAlone} className="btn-primary py-3">Buy now</button>
        </div>
      )}
    </div>
  );
}
