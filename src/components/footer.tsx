import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 bg-ink-900 text-ink-300">
      <div className="container-x grid grid-cols-2 gap-8 py-10 text-sm md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-bold text-white">{SITE.name}</p>
          <p className="mt-2 max-w-xs">{SITE.description}</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">Shop</p>
          <ul className="space-y-1.5">
            <li><Link href="/search?team=1">Team-Up deals</Link></li>
            <li><Link href="/search?express=1">Same-day delivery</Link></li>
            <li><Link href="/search?verified=1">Verified sellers</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">Sell</p>
          <ul className="space-y-1.5">
            <li><Link href="/sell">Open a store</Link></li>
            <li><Link href="/seller">Seller dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">Help</p>
          <ul className="space-y-1.5">
            <li><a href={`https://wa.me/${SITE.supportWhatsApp}`}>WhatsApp support</a></li>
            <li><Link href="/account">Track an order</Link></li>
          </ul>
          <p className="mt-4 text-xs">Payments secured by Paystack: card, transfer, USSD.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} {SITE.name}. Made in Nigeria.</div>
    </footer>
  );
}
