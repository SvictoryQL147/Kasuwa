import Link from "next/link";
import { Search, Store, User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { CartButton } from "./cart-button";
import { CategoryIcon } from "./icon";

export async function Header() {
  const [session, cats] = await Promise.all([getSession(), getCategories()]);
  return (
    <>
    <div className="bg-brand-900 text-center text-xs text-brand-50">
      <div className="container-x truncate py-1.5">
        <span className="sm:hidden">Same-day delivery · Pay on delivery · Team-Up savings</span>
        <span className="hidden sm:inline">Same-day delivery in Lagos, Abuja, PH, Enugu &amp; Ibadan · Pay on delivery available · Team up &amp; save up to 30%</span>
      </div>
    </div>
    <header className="sticky top-0 z-40 bg-white/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur">
      <div className="container-x flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-xl font-extrabold tracking-tight text-brand-700">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">K</span>
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>
        <form action="/search" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            name="q"
            type="search"
            enterKeyHint="search"
            placeholder="Search phones, ankara, rice…"
            className="input rounded-full pl-9"
            aria-label="Search products"
          />
        </form>
        <nav className="hidden items-center gap-1 md:flex">
          {session?.role === "SELLER" ? (
            <Link href="/seller" className="btn-ghost px-3"><Store className="h-4 w-4" /> My store</Link>
          ) : (
            <Link href="/sell" className="px-3 text-sm font-semibold text-brand-700">Sell on {SITE.name}</Link>
          )}
          <Link href={session ? "/account" : "/login"} className="btn-ghost px-3" aria-label="Account">
            <User className="h-4 w-4" />
            <span className="max-w-24 truncate">{session ? session.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          <CartButton />
        </nav>
      </div>
      <div className="border-t border-ink-100">
        <div className="container-x no-scrollbar flex gap-1 overflow-x-auto py-2 text-sm">
          {session?.role === "SELLER" && (
            <Link href="/seller" className="chip shrink-0 bg-ink-900 px-3 py-1.5 text-sm text-white md:hidden"><Store className="h-3.5 w-3.5" /> My store</Link>
          )}
          <Link href="/search?team=1" className="chip shrink-0 bg-accent-400/20 px-3 py-1.5 text-sm text-accent-600">
            Team-Up deals
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/search?category=${c.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-700 hover:bg-ink-100"
            >
              <CategoryIcon name={c.icon} className="h-4 w-4" /> {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
    </>
  );
}
