import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { parseItems } from "@/lib/cart-items";
import { db, schema } from "@/lib/db";
import { getTeamByCode } from "@/lib/queries";
import { CheckoutForm, type CheckoutLine } from "./checkout-form";

export const metadata = { title: "Checkout" };

type SP = Promise<{ items?: string; product?: string; team?: string }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(sp as Record<string, string>).toString();
  const user = await requireUser(`/checkout?${qs}`);

  const mode: "cart" | "team-new" | "team-join" =
    sp.team === "new" ? "team-new" : sp.team ? "team-join" : "cart";

  let lines: CheckoutLine[] = [];
  let teamInfo: { code: string; leader: string; size: number; joined: number } | undefined;

  if (mode === "cart") {
    const wanted = parseItems(sp.items ?? "");
    if (wanted.size) {
      const rows = await db.query.products.findMany({
        where: and(inArray(schema.products.id, [...wanted.keys()]), eq(schema.products.status, "ACTIVE")),
      });
      lines = rows.map((p) => ({
        productId: p.id, title: p.title, unitPrice: p.price, quantity: wanted.get(p.id)!,
        expressEligible: p.expressEligible, shipsFromState: p.shipsFromState,
      }));
    }
  } else {
    const p = await db.query.products.findFirst({ where: eq(schema.products.id, sp.product ?? "") });
    let unit = p?.teamPrice;
    if (mode === "team-join") {
      const t = await getTeamByCode(sp.team!);
      if (t && p && t.productId === p.id) {
        unit = t.unitPrice;
        teamInfo = { code: t.code, leader: t.leader.name, size: t.size, joined: t.members.filter((m) => m.paid).length };
      }
    }
    if (p && unit) {
      lines = [{ productId: p.id, title: p.title, unitPrice: unit, quantity: 1, expressEligible: p.expressEligible, shipsFromState: p.shipsFromState }];
    }
  }

  if (!lines.length) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-xl font-bold">Nothing to check out</h1>
        <Link href="/cart" className="btn-primary mt-4">Back to cart</Link>
      </div>
    );
  }

  const [rates, points] = await Promise.all([
    db.select().from(schema.deliveryRates).orderBy(schema.deliveryRates.state),
    db.select().from(schema.pickupPoints),
  ]);

  return (
    <div className="container-x py-4 sm:py-8">
      <h1 className="mb-1 text-xl font-bold sm:text-2xl">
        {mode === "team-new" ? "Start your Team-Up" : mode === "team-join" ? "Join the Team-Up" : "Checkout"}
      </h1>
      {mode !== "cart" && (
        <p className="mb-4 text-sm text-ink-500">
          {mode === "team-join" && teamInfo
            ? `${teamInfo.leader.split(" ")[0]}'s team has ${teamInfo.joined}/${teamInfo.size} paid. Your order ships when the team fills.`
            : "Pay now, share your link on WhatsApp. Full refund if the team doesn't fill in 24 hours."}
        </p>
      )}
      <CheckoutForm
        mode={mode}
        itemsParam={sp.items ?? ""}
        teamCode={teamInfo?.code}
        lines={lines}
        rates={rates}
        pickupPoints={points}
        defaults={{ fullName: user.name, phone: "0" + user.phone.slice(3) }}
      />
    </div>
  );
}
