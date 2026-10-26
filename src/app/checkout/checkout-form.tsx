"use client";
import { useActionState, useMemo, useState } from "react";
import { Banknote, CreditCard, Lock } from "lucide-react";
import type { DeliveryRate, PickupPoint } from "@/db/schema";
import { deliveryOptions, podAllowed, type DeliveryMethod } from "@/lib/delivery";
import { naira } from "@/lib/money";
import { cn } from "@/lib/cn";
import { placeOrder } from "./actions";

export type CheckoutLine = {
  productId: string; title: string; unitPrice: number; quantity: number;
  expressEligible: boolean; shipsFromState: string;
};

export function CheckoutForm(props: {
  mode: "cart" | "team-new" | "team-join";
  itemsParam: string;
  teamCode?: string;
  lines: CheckoutLine[];
  rates: DeliveryRate[];
  pickupPoints: PickupPoint[];
  defaults: { fullName: string; phone: string };
}) {
  const { mode, lines, rates, pickupPoints } = props;
  const [state, action, pending] = useActionState(placeOrder, undefined);
  const [st, setSt] = useState("Lagos");
  const [method, setMethod] = useState<DeliveryMethod>("STANDARD");
  const [pickupId, setPickupId] = useState<string>("");
  const [pay, setPay] = useState<"PAYSTACK" | "POD">("PAYSTACK");

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const rate = rates.find((r) => r.state === st) ?? null;
  const points = pickupPoints.filter((p) => p.state === st);
  const options = useMemo(
    () => deliveryOptions({
      rate, subtotal, pickupPoints,
      allExpressEligible: lines.every((l) => l.expressEligible && l.shipsFromState === st),
    }),
    [rate, subtotal, pickupPoints, lines, st],
  );
  const chosen = options.find((o) => o.method === method);
  const effectiveMethod = chosen?.available ? method : "STANDARD";
  const fee =
    effectiveMethod === "PICKUP"
      ? (points.find((p) => p.id === pickupId)?.fee ?? points[0]?.fee ?? 0)
      : (options.find((o) => o.method === effectiveMethod)?.fee ?? 0);
  const total = subtotal + fee;
  const pod = podAllowed(rate, total, mode !== "cart");
  const effectivePay = pay === "POD" && !pod.ok ? "PAYSTACK" : pay;

  return (
    <form action={action} className="grid gap-4 pb-28 md:grid-cols-[1fr_360px] md:gap-6 md:pb-0">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="items" value={props.itemsParam} />
      <input type="hidden" name="productId" value={lines[0].productId} />
      <input type="hidden" name="teamCode" value={props.teamCode ?? ""} />
      <input type="hidden" name="deliveryMethod" value={effectiveMethod} />
      <input type="hidden" name="paymentMethod" value={effectivePay} />

      <div className="space-y-4 md:space-y-5">
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">1. Delivery details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="label">Receiver&apos;s name</span><input name="fullName" defaultValue={props.defaults.fullName} className="input" required /></label>
            <label><span className="label">Phone</span><input name="phone" type="tel" defaultValue={props.defaults.phone} className="input" required /></label>
            <label>
              <span className="label">State</span>
              <select name="state" value={st} onChange={(e) => setSt(e.target.value)} className="input">
                {rates.map((r) => <option key={r.state} value={r.state}>{r.state === "FCT" ? "FCT (Abuja)" : r.state}</option>)}
              </select>
            </label>
            <label><span className="label">City / area</span><input name="city" placeholder="e.g. Yaba" className="input" required /></label>
            {effectiveMethod !== "PICKUP" && (
              <label className="sm:col-span-2"><span className="label">Street address &amp; landmark</span><input name="street" placeholder="12 Adeola Odeku St, opposite GTBank" className="input" required /></label>
            )}
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">2. Delivery speed</h2>
          <div className="grid gap-2">
            {options.map((o) => (
              <label
                key={o.method}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3 ring-1",
                  effectiveMethod === o.method ? "bg-brand-50 ring-brand-500" : "ring-ink-300",
                  !o.available && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input type="radio" className="check" disabled={!o.available} checked={effectiveMethod === o.method} onChange={() => setMethod(o.method)} />
                  <span>
                    <span className="block font-medium">{o.label}</span>
                    <span className="block text-xs text-ink-500">{o.available ? o.eta : o.reason}</span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{o.fee === 0 ? "Free" : naira(o.fee)}</span>
              </label>
            ))}
          </div>
          {effectiveMethod === "PICKUP" && (
            <select name="pickupPointId" value={pickupId || points[0]?.id} onChange={(e) => setPickupId(e.target.value)} className="input">
              {points.map((p) => <option key={p.id} value={p.id}>{p.name}: {p.address} ({p.hours})</option>)}
            </select>
          )}
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">3. Payment</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1", effectivePay === "PAYSTACK" ? "bg-brand-50 ring-brand-500" : "ring-ink-300")}>
              <input type="radio" checked={effectivePay === "PAYSTACK"} onChange={() => setPay("PAYSTACK")} className="check mt-0.5" />
              <span><span className="flex items-center gap-1.5 font-medium"><CreditCard className="h-4 w-4" /> Pay now</span>
                <span className="text-xs text-ink-500">Card, bank transfer or USSD via Paystack</span></span>
            </label>
            <label className={cn("flex items-start gap-3 rounded-xl p-3 ring-1", effectivePay === "POD" ? "bg-brand-50 ring-brand-500" : "ring-ink-300", !pod.ok ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
              <input type="radio" disabled={!pod.ok} checked={effectivePay === "POD"} onChange={() => setPay("POD")} className="check mt-0.5" />
              <span><span className="flex items-center gap-1.5 font-medium"><Banknote className="h-4 w-4" /> Pay on delivery</span>
                <span className="text-xs text-ink-500">{pod.ok ? "Cash or transfer when it arrives" : pod.reason}</span></span>
            </label>
          </div>
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-4 md:sticky md:top-36">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span className="line-clamp-2">{l.quantity} × {l.title}</span>
              <span className="shrink-0 font-medium">{naira(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{fee === 0 ? "Free" : naira(fee)}</span></div>
          <div className="flex justify-between pt-1 text-lg font-bold"><span>Total</span><span>{naira(total)}</span></div>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <button className={cn("hidden w-full py-3 text-base md:inline-flex", mode === "cart" ? "btn-primary" : "btn-accent")} disabled={pending}>
          <Lock className="h-4 w-4" />
          {pending ? "Placing order…" : effectivePay === "POD" ? "Place order" : `Pay ${naira(total)}`}
        </button>
        <p className="text-center text-xs text-ink-500">Secured by Paystack. We never see your card details.</p>
      </aside>

      {/* Phones: sticky pay bar so the button is always one tap away */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/60 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
        {state?.error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-500">Total incl. delivery</p>
            <p className="text-lg font-bold">{naira(total)}</p>
          </div>
          <button className={cn("px-6 py-3 text-base", mode === "cart" ? "btn-primary" : "btn-accent")} disabled={pending}>
            <Lock className="h-4 w-4" />
            {pending ? "Placing…" : effectivePay === "POD" ? "Place order" : "Pay now"}
          </button>
        </div>
      </div>
    </form>
  );
}
