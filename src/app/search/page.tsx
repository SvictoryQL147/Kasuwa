import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { ProductGrid } from "@/components/product-card";
import { getCategories, searchProducts, type SearchParams } from "@/lib/queries";

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.q ? `“${sp.q}”` : "Shop" };
}

const SORTS = [
  ["popular", "Most popular"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["rating", "Top rated"],
  ["new", "Newest"],
] as const;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const params: SearchParams = {
    q: sp.q,
    category: sp.category,
    maxPrice: sp.max ? Number(sp.max) * 100 : undefined,
    express: sp.express === "1",
    team: sp.team === "1",
    verified: sp.verified === "1",
    sort: (sp.sort as SearchParams["sort"]) ?? "popular",
  };
  const [cats, results] = await Promise.all([getCategories(), searchProducts(params)]);
  const cat = cats.find((c) => c.slug === sp.category);
  const activeFilters = [sp.category, sp.max, params.team, params.express, params.verified].filter(Boolean).length;
  const filters = (
      <form className="flex flex-wrap items-end gap-3 text-sm">
        {sp.q && <input type="hidden" name="q" value={sp.q} />}
        <label className="w-full sm:w-auto sm:min-w-36 sm:flex-1">
          <span className="label">Category</span>
          <select name="category" defaultValue={sp.category ?? ""} className="input">
            <option value="">All</option>
            {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex-1 sm:w-32 sm:flex-none">
          <span className="label">Max price (₦)</span>
          <input name="max" type="number" min={0} defaultValue={sp.max} className="input" placeholder="Any" />
        </label>
        <label className="flex-1 sm:min-w-40 sm:flex-none">
          <span className="label">Sort</span>
          <select name="sort" defaultValue={params.sort} className="input">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <div className="flex w-full flex-wrap gap-x-4 gap-y-2 py-1 sm:w-auto">
          <label className="flex items-center gap-1.5"><input type="checkbox" className="check" name="team" value="1" defaultChecked={params.team} /> Team-Up</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="check" name="express" value="1" defaultChecked={params.express} /> Same-day</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="check" name="verified" value="1" defaultChecked={params.verified} /> Verified sellers</label>
        </div>
        <button className="btn-primary w-full sm:w-auto">Apply</button>
      </form>
  );
  const heading = sp.q ? `Results for “${sp.q}”` : params.team ? "Team-Up deals" : cat?.name ?? "All products";

  return (
    <div className="container-x py-4 sm:py-6">
      <h1 className="text-xl font-bold sm:text-2xl">{heading}</h1>
      <p className="text-sm text-ink-500">{results.length} items</p>

      {/* Phones: collapsible filters so products are visible first. Desktop: always open. */}
      <details className="card mt-3 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-semibold">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filter &amp; sort{activeFilters ? ` (${activeFilters})` : ""}</span>
          <span className="text-ink-500">▾</span>
        </summary>
        <div className="border-t p-3">{filters}</div>
      </details>
      <div className="card mt-4 hidden p-3 md:block">{filters}</div>

      <div className="mt-5">
        {results.length ? (
          <ProductGrid products={results} />
        ) : (
          <div className="card p-10 text-center">
            <p className="font-semibold">No match yet.</p>
            <p className="text-sm text-ink-500">Try fewer words, or ask the shopping assistant in the corner, e.g. “cheap phone with big battery”.</p>
          </div>
        )}
      </div>
    </div>
  );
}
