import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { BadgeCheck, Package, Plus, ShoppingBag, Users, Wallet } from "lucide-react";
import { requireSeller } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders";
import { advanceOrder } from "./actions";

export const metadata = { title: "Seller dashboard" };

const LIVE = ["PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function SellerDashboard() {
  const { store } = await requireSeller();
  const { orderItems, orders, products } = schema;

  const [stats] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity} - ${orderItems.commission}), 0)::int`,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      orderCount: sql<number>`count(distinct ${orderItems.orderId})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.storeId, store.id), inArray(orders.status, [...LIVE])));

  const recent = await db
    .select({
      orderId: orders.id, code: orders.code, status: orders.status, createdAt: orders.createdAt,
      state: orders.state, city: orders.city, deliveryMethod: orders.deliveryMethod, isTeam: sql<boolean>`${orders.teamId} is not null`,
      title: orderItems.title, quantity: orderItems.quantity, lineTotal: sql<number>`${orderItems.unitPrice} * ${orderItems.quantity}`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.storeId, store.id), inArray(orders.status, ["PROCESSING", "SHIPPED", "DELIVERED", "AWAITING_TEAM"])))
    .orderBy(desc(orders.createdAt))
    .limit(30);

  const myProducts = await db.select().from(products).where(eq(products.storeId, store.id)).orderBy(desc(products.soldCount));

  const cards = [
    { i: Wallet, l: "Earnings (after commission)", v: naira(stats.revenue) },
    { i: ShoppingBag, l: "Orders", v: stats.orderCount.toLocaleString() },
    { i: Package, l: "Units sold", v: stats.units.toLocaleString() },
    { i: Users, l: "Listings with Team-Up", v: `${myProducts.filter((p) => p.teamPrice).length}/${myProducts.length}` },
  ];

  return (
    <div className="container-x space-y-4 py-4 sm:space-y-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">{store.name} {store.verified && <BadgeCheck className="h-5 w-5 text-brand-600" />}</h1>
          <p className="text-sm text-ink-500">{store.city}, {store.state}{!store.verified && " · Verification pending: upload your CAC/ID to get the badge"}</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary w-full sm:w-auto"><Plus className="h-4 w-4" /> New listing</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ i: I, l, v }) => (
          <div key={l} className="card p-3 sm:p-4">
            <I className="h-5 w-5 text-brand-600" />
            <p className="mt-2 truncate text-xl font-bold sm:text-2xl">{v}</p>
            <p className="text-xs text-ink-500">{l}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b p-4 font-semibold">Orders to fulfil</h2>
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">No orders yet. Tip: add a Team-Up price so shoppers share your product on WhatsApp.</p>
        ) : (
          <>
          <ul className="divide-y md:hidden">
            {recent.map((o) => (
              <li key={o.code + o.title} className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{o.code}{o.isTeam && <span className="chip ml-1 bg-accent-400/20 text-accent-600">Team</span>}</p>
                  <span className="chip shrink-0 bg-ink-100 text-ink-700">{STATUS_LABEL[o.status]}</span>
                </div>
                <p>{o.quantity} × {o.title}</p>
                <div className="flex items-center justify-between gap-2 text-ink-500">
                  <span>{o.city}, {o.state} · {o.deliveryMethod.toLowerCase()}</span>
                  <span className="font-semibold text-ink-900">{naira(o.lineTotal)}</span>
                </div>
                {(o.status === "PROCESSING" || o.status === "SHIPPED") && (
                  <form action={advanceOrder}>
                    <input type="hidden" name="orderId" value={o.orderId} />
                    <input type="hidden" name="to" value={o.status === "PROCESSING" ? "SHIPPED" : "DELIVERED"} />
                    <button className="btn-primary w-full">{o.status === "PROCESSING" ? "Mark shipped" : "Mark delivered"}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-100 text-xs uppercase text-ink-500">
                <tr><th className="p-3">Order</th><th className="p-3">Item</th><th className="p-3">Deliver to</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.code + o.title} className="border-t">
                    <td className="p-3 font-medium">{o.code}{o.isTeam && <span className="chip ml-1 bg-accent-400/20 text-accent-600">Team</span>}</td>
                    <td className="p-3">{o.quantity} × {o.title}</td>
                    <td className="p-3">{o.city}, {o.state} · {o.deliveryMethod.toLowerCase()}</td>
                    <td className="p-3">{naira(o.lineTotal)}</td>
                    <td className="p-3">{STATUS_LABEL[o.status]}</td>
                    <td className="p-3">
                      {(o.status === "PROCESSING" || o.status === "SHIPPED") && (
                        <form action={advanceOrder}>
                          <input type="hidden" name="orderId" value={o.orderId} />
                          <input type="hidden" name="to" value={o.status === "PROCESSING" ? "SHIPPED" : "DELIVERED"} />
                          <button className="btn-ghost px-3 py-1.5 text-xs">{o.status === "PROCESSING" ? "Mark shipped" : "Mark delivered"}</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b p-4 font-semibold">Your listings</h2>
        <ul className="divide-y md:hidden">
          {myProducts.map((p) => (
            <li key={p.id} className="p-4 text-sm">
              <Link href={`/p/${p.slug}`} className="font-medium hover:text-brand-700">{p.title}</Link>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ink-500">
                <span className="font-semibold text-ink-900">{naira(p.price)}</span>
                {p.teamPrice && <span className="text-accent-600">Team {naira(p.teamPrice)} × {p.teamSize}</span>}
                <span className={p.stock < 10 ? "font-semibold text-red-600" : ""}>Stock {p.stock}</span>
                <span>{p.soldCount.toLocaleString()} sold</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-100 text-xs uppercase text-ink-500">
              <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Team-Up</th><th className="p-3">Stock</th><th className="p-3">Sold</th></tr>
            </thead>
            <tbody>
              {myProducts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3"><Link href={`/p/${p.slug}`} className="font-medium hover:text-brand-700">{p.title}</Link></td>
                  <td className="p-3">{naira(p.price)}</td>
                  <td className="p-3">{p.teamPrice ? `${naira(p.teamPrice)} × ${p.teamSize}` : "None"}</td>
                  <td className={p.stock < 10 ? "p-3 font-semibold text-red-600" : "p-3"}>{p.stock}</td>
                  <td className="p-3">{p.soldCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
