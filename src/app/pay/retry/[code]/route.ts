import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { initializeTransaction, paystackMockMode } from "@/lib/paystack";
import { SITE } from "@/lib/site";

/** Resume payment for an unpaid order. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL(`/login?next=/orders/${code}`, req.url));
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.code, code), with: { buyer: true } });
  if (!order || order.buyerId !== session.userId || order.status !== "PENDING_PAYMENT") {
    return NextResponse.redirect(new URL(`/orders/${code}`, req.url));
  }
  if (paystackMockMode()) return NextResponse.redirect(new URL(`/pay/mock/${code}`, req.url));
  // Paystack references must be unique per attempt, so suffix retries.
  const tx = await initializeTransaction({
    email: order.buyer.email,
    amountKobo: order.total,
    reference: `${code}_${Date.now().toString(36)}`,
    callbackUrl: `${SITE.url}/api/paystack/callback`,
    metadata: { orderCode: code },
  });
  return NextResponse.redirect(tx.authorization_url);
}
