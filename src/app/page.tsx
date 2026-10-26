import Link from "next/link";
import { Bot, ShieldCheck, Truck, Users } from "lucide-react";
import { ProductGrid } from "@/components/product-card";
import { CategoryIcon } from "@/components/icon";
import { getCategories, searchProducts } from "@/lib/queries";

export const revalidate = 60;

function Row({ title, href, children, sub }: { title: string; href: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-8 sm:mt-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
          {sub && <p className="text-sm text-ink-500">{sub}</p>}
        </div>
        <Link href={href} className="shrink-0 py-2 text-sm font-semibold text-brand-700">See all →</Link>
      </div>
      {children}
    </section>
  );
}

export default async function Home() {
  const [cats, teamDeals, express, popular] = await Promise.all([
    getCategories(),
    searchProducts({ team: true, limit: 10 }),
    searchProducts({ express: true, sort: "rating", limit: 5 }),
    searchProducts({ limit: 10 }),
  ]);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
        <div className="container-x grid gap-6 pb-10 pt-6 md:grid-cols-[1.3fr_1fr] md:gap-8 md:py-14">
          <div>
            <p className="chip bg-white/15 text-white">New · Team-Up group buying</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
              Buy together.<br />Pay less. Get it today.
            </h1>
            <p className="mt-3 max-w-lg text-brand-50/90">
              Start a Team-Up, share it on WhatsApp, and everyone unlocks the wholesale price.
              Verified Nigerian sellers, same-day delivery in 5 cities, and pay on delivery.
            </p>
            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <Link href="/search?team=1" className="btn-accent px-5 py-3 text-base">Browse Team-Up deals</Link>
              <a href="#ask" className="btn bg-white/10 px-5 py-3 text-base text-white ring-1 ring-white/30 hover:bg-white/20">
                <Bot className="h-5 w-5" /> Ask the shopping assistant
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 self-center text-xs sm:gap-3 sm:text-sm">
            {[
              { icon: Users, t: "Team-Up & save", d: "Up to 30% off when 2–5 people buy together" },
              { icon: Truck, t: "Same-day Express", d: "Lagos, Abuja, PH, Enugu, Ibadan" },
              { icon: ShieldCheck, t: "Verified sellers", d: "ID-checked stores, refunds if a Team-Up doesn't fill" },
              { icon: Bot, t: "AI assistant", d: "Ask in English, Pidgin, Yoruba, Igbo or Hausa" },
            ].map(({ icon: I, t, d }) => (
              <div key={t} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 sm:p-4">
                <I className="h-5 w-5 text-accent-400" />
                <p className="mt-2 font-semibold">{t}</p>
                <p className="text-brand-50/80">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x -mt-5">
        <div className="card grid grid-cols-4 gap-2 p-3 md:grid-cols-8">
          {cats.map((c) => (
            <Link key={c.id} href={`/search?category=${c.slug}`} className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center text-xs font-medium hover:bg-ink-100">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700">
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <Row title="Team-Up deals" sub="Start a team or join one. Price drops when the team fills." href="/search?team=1">
        <ProductGrid products={teamDeals} />
      </Row>
      <Row title="Get it today" sub="Express delivery in metro cities. Order before 12pm." href="/search?express=1">
        <ProductGrid products={express} />
      </Row>
      <Row title="Bestsellers across Nigeria" href="/search?sort=popular">
        <ProductGrid products={popular} />
      </Row>
    </>
  );
}
