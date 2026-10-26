import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { markOrderPaid } from "@/lib/orders";
import { paystackMockMode } from "@/lib/paystack";

/** Local-only stand-in for the Paystack checkout. Disabled once real keys are set or in production. */
export default async function MockPay({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ from?: string }> }) {
  if (!paystackMockMode()) notFound();
  const { code } = await params;
  const { from } = await searchParams;
  const user = await requireUser(`/pay/mock/${code}`);
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.code, code) });
  if (!order || order.buyerId !== user.id) notFound();

  async function pay() {
    "use server";
    await markOrderPaid(code, order!.total);
    redirect(`/orders/${code}?new=1${from ? "&from=cart" : ""}`);
  }

  return (
    <div className="container-x flex justify-center py-16">
      <form action={pay} className="card w-full max-w-sm space-y-4 p-6 text-center">
        <p className="chip mx-auto bg-accent-400/20 text-accent-600">TEST MODE: no Paystack keys set</p>
        <p className="text-sm text-ink-500">Paying for {order.code}</p>
        <p className="text-3xl font-extrabold">{naira(order.total)}</p>
        <button className="btn-primary w-full py-3">Simulate successful payment</button>
      </form>
    </div>
  );
}
