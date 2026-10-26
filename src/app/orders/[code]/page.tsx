import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2, Circle, Clock, Users } from "lucide-react";
import { ClearCart } from "@/components/clear-cart";
import { Countdown } from "@/components/countdown";
import { ShareTeam } from "@/components/share-team";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ new?: string; from?: string }> };

const STEPS = ["PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function OrderPage({ params, searchParams }: Props) {
  const { code } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/orders/${code}`);
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.code, code),
    with: {
      items: true,
      pickupPoint: true,
      team: { with: { members: { with: { user: { columns: { name: true } } } } } },
    },
  });
  if (!order || order.buyerId !== user.id) notFound();

  const team = order.team;
  const paidMembers = team?.members.filter((m) => m.paid) ?? [];
  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="container-x max-w-3xl space-y-4 py-8">
      {sp.new && sp.from === "cart" && <ClearCart />}
      {sp.new && (
        <div className="card flex items-center gap-3 bg-brand-50 p-4 text-brand-900 ring-brand-500">
          <CheckCircle2 className="h-6 w-6 text-brand-600" />
          <div>
            <p className="font-semibold">
              {order.status === "AWAITING_TEAM" ? "Payment received. Now fill your team!" : "Order placed. Thank you!"}
            </p>
            <p className="text-sm">We&apos;ll send updates to +{order.phone}.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold sm:text-2xl">Order <span className="whitespace-nowrap">{order.code}</span></h1>
        <span className="chip shrink-0 bg-ink-900 px-3 py-1 text-sm text-white">{STATUS_LABEL[order.status]}</span>
      </div>

      {team && (
        <section className="card overflow-hidden ring-2 ring-accent-400">
          <div className="bg-accent-400/15 p-4">
            <p className="flex items-center gap-2 font-bold text-accent-600"><Users className="h-5 w-5" /> Team-Up · {paidMembers.length}/{team.size} joined</p>
            {team.status === "OPEN" && (
              <p className="mt-1 flex items-center gap-1 text-sm"><Clock className="h-4 w-4" /> <Countdown to={team.expiresAt.toISOString()} /> left to fill</p>
            )}
            {team.status === "COMPLETE" && <p className="mt-1 text-sm font-medium">Team complete. Everyone gets the team price!</p>}
            {team.status === "EXPIRED" && <p className="mt-1 text-sm font-medium">Team didn&apos;t fill in time. You&apos;ve been refunded.</p>}
          </div>
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: team.size }).map((_, i) => (
                <div key={i} className={cn("grid h-12 w-12 place-items-center rounded-full text-sm font-bold", paidMembers[i] ? "bg-brand-600 text-white" : "border-2 border-dashed border-ink-300 text-ink-300")}>
                  {paidMembers[i] ? paidMembers[i].user.name[0] : "?"}
                </div>
              ))}
            </div>
            {team.status === "OPEN" && (
              <ShareTeam
                url={`${SITE.url}/team/${team.code}`}
                text={`Join my Team-Up on ${SITE.name} so we all get ${order.items[0]?.title} for ${naira(team.unitPrice)}!`}
              />
            )}
          </div>
        </section>
      )}

      {stepIdx >= 0 && (
        <section className="card p-4">
          <ol className="flex justify-between">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center text-xs">
                {i <= stepIdx ? <CheckCircle2 className="h-6 w-6 text-brand-600" /> : <Circle className="h-6 w-6 text-ink-300" />}
                {STATUS_LABEL[s]}
              </li>
            ))}
          </ol>
        </section>
      )}

      {order.status === "PENDING_PAYMENT" && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">This order hasn&apos;t been paid yet.</p>
          <Link href={`/pay/retry/${order.code}`} className="btn-primary">Pay {naira(order.total)}</Link>
        </section>
      )}

      <section className="card p-4 text-sm">
        <ul className="space-y-2">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3"><span className="min-w-0">{i.quantity} × {i.title}</span><span>{naira(i.unitPrice * i.quantity)}</span></li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t pt-3">
          <div className="flex justify-between"><span>Delivery ({order.deliveryMethod.toLowerCase()})</span><span>{order.deliveryFee ? naira(order.deliveryFee) : "Free"}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{naira(order.total)}</span></div>
          <p className="pt-1 text-ink-500">{order.paymentMethod === "POD" ? "Pay on delivery" : order.paidAt ? "Paid via Paystack" : "Unpaid"}</p>
        </div>
        <div className="mt-3 border-t pt-3 text-ink-700">
          <p className="font-medium">{order.fullName} · +{order.phone}</p>
          {order.pickupPoint
            ? <p>Pickup: {order.pickupPoint.name}, {order.pickupPoint.address} ({order.pickupPoint.hours})</p>
            : <p>{order.street}, {order.city}, {order.state}</p>}
        </div>
      </section>
    </div>
  );
}
