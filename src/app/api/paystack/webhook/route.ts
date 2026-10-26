import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { isValidWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook. Set this URL in Dashboard → Settings → API Keys & Webhooks:
 *   https://YOUR_DOMAIN/api/paystack/webhook
 * Catches payments even if the shopper closes the tab before the redirect.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data: { reference: string; amount: number; currency: string } };
  if (event.event === "charge.success" && event.data.currency === "NGN") {
    try {
      await markOrderPaid(event.data.reference.split("_")[0], event.data.amount);
    } catch (e) {
      console.error("Webhook processing failed", e);
      return NextResponse.json({ ok: false }, { status: 500 }); // Paystack will retry
    }
  }
  return NextResponse.json({ ok: true });
}
