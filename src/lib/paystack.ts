import "server-only";
import crypto from "crypto";

const BASE = "https://api.paystack.co";

/**
 * Mock mode lets the whole checkout run without Paystack keys (local dev, demos).
 * - Always OFF once a real sk_test_/sk_live_ key is set.
 * - ON automatically in development; in a production build only if PAYSTACK_MOCK="true"
 *   (for demo/staging deployments; never set it on the live site).
 */
export function paystackMockMode(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "";
  const hasRealKey = /^sk_(test|live)_[A-Za-z0-9]{20,}$/.test(key);
  if (hasRealKey) return false;
  return process.env.NODE_ENV !== "production" || process.env.PAYSTACK_MOCK === "true";
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(`Paystack ${path} failed: ${json.message ?? res.statusText}`);
  }
  return json.data as T;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: ["card", "bank", "ussd", "bank_transfer", "mobile_money"],
        metadata: input.metadata,
      }),
    },
  );
}

export async function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; reference: string; currency: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export async function refundTransaction(reference: string, amountKobo?: number) {
  return call<unknown>("/refund", {
    method: "POST",
    body: JSON.stringify({ transaction: reference, amount: amountKobo }),
  });
}

/** Validate the x-paystack-signature header on webhooks. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
