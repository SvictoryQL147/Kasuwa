import Link from "next/link";
import { BadgeCheck, Users, Zap } from "lucide-react";
import { naira, percentOff } from "@/lib/money";
import type { ProductCardData } from "@/lib/queries";
import { ProductImage } from "./product-image";
import { Stars } from "./stars";

export function soldLabel(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+ sold`;
  return `${n} sold`;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const off = percentOff(p.price, p.compareAtPrice);
  return (
    <Link href={`/p/${p.slug}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <div className="relative">
        <ProductImage src={p.images[0]} alt={p.title} category={p.categorySlug} className="aspect-square w-full" />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off && <span className="chip bg-red-600 text-white">-{off}%</span>}
          {p.expressEligible && (
            <span className="chip bg-ink-900 text-white"><Zap className="h-3 w-3" /> Express</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-brand-700">{p.title}</h3>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-bold sm:text-base">{naira(p.price)}</span>
          {p.compareAtPrice && <span className="text-xs text-ink-500 line-through">{naira(p.compareAtPrice)}</span>}
        </div>
        {p.teamPrice && p.teamSize && (
          <div className="flex items-center gap-1 rounded-lg bg-accent-400/15 px-2 py-1 text-[11px] font-semibold text-accent-600 sm:text-xs">
            <Users className="h-3.5 w-3.5" /> {naira(p.teamPrice)} with {p.teamSize} people
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-xs">
          <Stars rating={p.rating} />
          <span className="text-ink-500">{soldLabel(p.soldCount)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-500">
          {p.storeVerified && <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />}
          <span className="truncate">{p.storeName}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
