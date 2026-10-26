import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";

/** Paystack redirects the shopper here after payment. Always verify server-side. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(new URL("/account", req.url));
  const code = reference.split("_")[0];
  const from = url.searchParams.get("from") === "cart" ? "&from=cart" : "";

  try {
    const tx = await verifyTransaction(reference);
    if (tx.status === "success" && tx.currency === "NGN") {
      await markOrderPaid(code, tx.amount);
      return NextResponse.redirect(new URL(`/orders/${code}?new=1${from}`, req.url));
    }
  } catch (e) {
    console.error("Paystack verify failed", e);
  }
  return NextResponse.redirect(new URL(`/orders/${code}`, req.url));
}
