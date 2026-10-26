import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders";
import { logout } from "./actions";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const myOrders = await db.query.orders.findMany({
    where: eq(schema.orders.buyerId, user.id),
    orderBy: desc(schema.orders.createdAt),
    with: { items: true },
    limit: 50,
  });

  return (
    <div className="container-x max-w-3xl py-6 sm:py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Hi, {user.name.split(" ")[0]}</h1>
          <p className="break-all text-sm text-ink-500">{user.email} · +{user.phone}</p>
        </div>
        <form action={logout}><button className="btn-ghost">Sign out</button></form>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">My orders</h2>
      {myOrders.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-500">No orders yet. <Link href="/" className="font-semibold text-brand-700">Start shopping</Link></div>
      ) : (
        <ul className="space-y-3">
          {myOrders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.code}`} className="card flex items-center justify-between gap-3 p-4 hover:shadow-md">
                <div className="min-w-0">
                  <p className="font-semibold">{o.code} {o.teamId && <span className="chip ml-1 bg-accent-400/20 text-accent-600">Team-Up</span>}</p>
                  <p className="truncate text-sm text-ink-500">{o.items.map((i) => i.title).join(", ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{naira(o.total)}</p>
                  <p className="text-xs text-ink-500">{STATUS_LABEL[o.status]}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
