import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, MapPin, RotateCcw, ShieldCheck, Truck, Users, Zap } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { MobileBuyBar } from "@/components/mobile-buy-bar";
import { Countdown } from "@/components/countdown";
import { ProductImage } from "@/components/product-image";
import { Stars } from "@/components/stars";
import { soldLabel } from "@/components/product-card";
import { naira, percentOff } from "@/lib/money";
import { getOpenTeams, getProductBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.description.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await getProductBySlug((await params).slug);
  if (!p || p.status !== "ACTIVE") notFound();
  const openTeams = p.teamPrice ? await getOpenTeams(p.id) : [];
  const off = percentOff(p.price, p.compareAtPrice);
  const teamSaving = p.teamPrice ? p.price - p.teamPrice : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    image: p.images,
    aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.ratingCount },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: (p.price / 100).toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: p.store.name },
    },
  };

  return (
    <div className="container-x pb-24 pt-4 md:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-3 truncate text-sm text-ink-500">
        <Link href="/">Home</Link> / <Link href={`/search?category=${p.category.slug}`}>{p.category.name}</Link>
      </nav>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <ProductImage src={p.images[0]} alt={p.title} category={p.category.slug} className="card aspect-square w-full" priority sizes="(max-width: 768px) 100vw, 50vw" />

        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">{p.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <Stars rating={p.rating} count={p.ratingCount} size="md" />
              <span className="text-ink-500">{soldLabel(p.soldCount)}</span>
              {p.stock < 20 && <span className="font-semibold text-red-600">Only {p.stock} left</span>}
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold sm:text-3xl">{naira(p.price)}</span>
              {p.compareAtPrice && <span className="text-ink-500 line-through">{naira(p.compareAtPrice)}</span>}
              {off && <span className="chip bg-red-600 text-white">-{off}%</span>}
            </div>
            <AddToCart
              product={{ productId: p.id, slug: p.slug, title: p.title, price: p.price, image: p.images[0] }}
              disabled={p.stock < 1}
            />
          </div>
          <MobileBuyBar
            product={{ productId: p.id, slug: p.slug, title: p.title, price: p.price, image: p.images[0] }}
            teamPrice={p.teamPrice}
            teamSize={p.teamSize}
            disabled={p.stock < 1}
          />

          {p.teamPrice && p.teamSize && (
            <div className="card overflow-hidden ring-2 ring-accent-400">
              <div className="flex items-center justify-between gap-3 bg-accent-400/15 px-4 py-3">
                <div>
                  <p className="flex items-center gap-1.5 font-bold text-accent-600"><Users className="h-5 w-5" /> Team-Up price</p>
                  <p className="text-sm text-ink-700">Save {naira(teamSaving)} when {p.teamSize} people buy within 24 hours</p>
                </div>
                <span className="shrink-0 text-xl font-extrabold text-accent-600 sm:text-2xl">{naira(p.teamPrice)}</span>
              </div>
              <div className="space-y-3 p-4">
                <Link href={`/checkout?product=${p.id}&team=new`} className="btn-accent w-full py-3 text-base">
                  Start a Team-Up · {naira(p.teamPrice)}
                </Link>
                <p className="text-xs text-ink-500">
                  You pay now and get a link to share on WhatsApp. If the team doesn&apos;t fill in 24 hours, you&apos;re refunded in full, automatically.
                </p>
                {openTeams.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-semibold">Join a team that&apos;s almost full</p>
                    {openTeams.map((t) => (
                      <div key={t.code} className="flex items-center justify-between gap-2 rounded-xl bg-ink-100 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{t.leaderName.split(" ")[0]}&apos;s team · {t.joined}/{t.size} joined</p>
                          <p className="flex items-center gap-1 text-xs text-ink-500"><Clock className="h-3 w-3" /> <Countdown to={t.expiresAt.toISOString()} /> left</p>
                        </div>
                        <Link href={`/team/${t.code}`} className="btn-primary px-3 py-1.5">Join</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <ul className="card grid gap-3 p-4 text-sm sm:grid-cols-2">
            <li className="flex gap-2"><Truck className="h-5 w-5 shrink-0 text-brand-600" /> Ships from {p.shipsFromState}. Delivery fee shown at checkout.</li>
            {p.expressEligible && <li className="flex gap-2"><Zap className="h-5 w-5 shrink-0 text-brand-600" /> Same-day Express in metro cities</li>}
            <li className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" /> Paystack-secured payment or pay on delivery</li>
            <li className="flex gap-2"><RotateCcw className="h-5 w-5 shrink-0 text-brand-600" /> 7-day returns on damaged or wrong items</li>
          </ul>

          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-semibold">
                {p.store.name} {p.store.verified && <BadgeCheck className="h-4 w-4 text-brand-600" />}
              </p>
              <p className="flex items-center gap-1 text-sm text-ink-500"><MapPin className="h-3.5 w-3.5" /> {p.store.city}, {p.store.state} · ★ {p.store.rating.toFixed(1)}</p>
            </div>
            <a
              className="btn-ghost"
              href={`https://wa.me/?text=${encodeURIComponent(`Check this out on ${SITE.name}: ${p.title} ${SITE.url}/p/${p.slug}`)}`}
              target="_blank" rel="noreferrer"
            >
              Share
            </a>
          </div>

          <div>
            <h2 className="mb-1 font-semibold">About this item</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{p.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
