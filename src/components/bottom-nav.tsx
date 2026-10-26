"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { cartCount, useCart } from "./cart-store";
import { cn } from "@/lib/cn";

export const OPEN_ASSISTANT_EVENT = "kasuwa:open-assistant";

/** App-style tab bar for phones. Hidden on tablets/desktop and during checkout/payment. */
export function BottomNav({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (path.startsWith("/checkout") || path.startsWith("/pay")) return null;

  const n = mounted ? cartCount(lines) : 0;
  const item = (active: boolean) =>
    cn("flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-brand-700" : "text-ink-500");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div className="flex h-16 items-stretch">
        <Link href="/" className={item(path === "/")}><Home className="h-5 w-5" />Home</Link>
        <Link href="/search" className={item(path.startsWith("/search"))}><LayoutGrid className="h-5 w-5" />Shop</Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-brand-700"
        >
          <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white">
            <Bot className="h-6 w-6" />
          </span>
          Ask AI
        </button>
        <Link href="/cart" className={cn(item(path === "/cart"), "relative")}>
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            {n > 0 && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">{n}</span>
            )}
          </span>
          Cart
        </Link>
        <Link href={signedIn ? "/account" : "/login"} className={item(path.startsWith("/account") || path === "/login")}>
          <User className="h-5 w-5" />{signedIn ? "Account" : "Sign in"}
        </Link>
      </div>
    </nav>
  );
}
