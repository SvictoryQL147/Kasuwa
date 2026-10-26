import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { ProductImage } from "@/components/product-image";
import { naira } from "@/lib/money";
import { getTeamByCode } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cn } from "@/lib/cn";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTeamByCode((await params).code);
  if (!t) return {};
  const title = `Join ${t.leader.name.split(" ")[0]}'s Team-Up: ${t.product.title} for ${naira(t.unitPrice)}`;
  return { title, openGraph: { title, description: `Only ${t.size} people needed. ${SITE.name}` } };
}

export default async function TeamPage({ params }: { params: Params }) {
  const t = await getTeamByCode((await params).code);
  if (!t) notFound();
  const cat = await db.query.categories.findFirst({ where: eq(schema.categories.id, t.product.categoryId) });
  const paid = t.members.filter((m) => m.paid);
  const open = t.status === "OPEN" && t.expiresAt > new Date() && paid.length < t.size;

  return (
    <div className="container-x flex justify-center py-6 sm:py-10">
      <div className="card w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-5 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> {t.leader.name.split(" ")[0]} invited you to a Team-Up</p>
          <p className="mt-1 text-3xl font-extrabold">{naira(t.unitPrice)}</p>
          <p className="text-sm text-white/90">instead of <span className="line-through">{naira(t.product.price)}</span>, only when {t.size} people join</p>
        </div>
        <div className="space-y-5 p-5">
          <Link href={`/p/${t.product.slug}`} className="flex items-center gap-3">
            <ProductImage src={t.product.images[0]} alt={t.product.title} category={cat?.slug ?? ""} className="h-16 w-16 shrink-0 rounded-xl" />
            <div>
              <p className="font-semibold">{t.product.title}</p>
              <p className="text-sm text-ink-500">Sold by {t.product.store.name}</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: t.size }).map((_, i) => (
              <div key={i} className={cn("grid h-12 w-12 place-items-center rounded-full font-bold", paid[i] ? "bg-brand-600 text-white" : "border-2 border-dashed border-ink-300 text-ink-300")}>
                {paid[i] ? paid[i].user.name[0] : "?"}
              </div>
            ))}
          </div>
          {open ? (
            <>
              <p className="flex items-center gap-1 text-sm text-ink-700"><Clock className="h-4 w-4" /> {t.size - paid.length} spot(s) left · closes in <Countdown to={t.expiresAt.toISOString()} /></p>
              <Link href={`/checkout?product=${t.productId}&team=${t.code}`} className="btn-accent w-full py-3 text-base">Join team · {naira(t.unitPrice)}</Link>
              <p className="text-center text-xs text-ink-500">Full refund if the team doesn&apos;t fill in time.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">This team is {t.status === "COMPLETE" || paid.length >= t.size ? "full" : "closed"}.</p>
              <Link href={`/checkout?product=${t.productId}&team=new`} className="btn-accent w-full py-3 text-base">Start your own team</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
