import type { DeliveryRate, PickupPoint } from "@/db/schema";
import { FREE_DELIVERY_THRESHOLD_KOBO, POD_MAX_ORDER_KOBO } from "./site";

export type DeliveryMethod = "EXPRESS" | "STANDARD" | "PICKUP";

export type DeliveryOption = {
  method: DeliveryMethod;
  label: string;
  eta: string;
  fee: number; // kobo
  available: boolean;
  reason?: string;
};

export function deliveryOptions(args: {
  rate: DeliveryRate | null;
  subtotal: number;
  allExpressEligible: boolean;
  pickupPoints: PickupPoint[];
}): DeliveryOption[] {
  const { rate, subtotal, allExpressEligible, pickupPoints } = args;
  if (!rate) return [];

  const freeStandard = rate.expressAvailable && subtotal >= FREE_DELIVERY_THRESHOLD_KOBO;
  const opts: DeliveryOption[] = [];

  const expressOk = rate.expressAvailable && allExpressEligible && rate.expressFee != null;
  opts.push({
    method: "EXPRESS",
    label: "Express",
    eta: "Today if ordered before 12pm, else tomorrow",
    fee: rate.expressFee ?? 0,
    available: expressOk,
    reason: !rate.expressAvailable
      ? `Express isn't in ${rate.state} yet`
      : !allExpressEligible
        ? "Some items ship from outside your city"
        : undefined,
  });

  opts.push({
    method: "STANDARD",
    label: freeStandard ? "Standard (FREE)" : "Standard",
    eta: `${rate.standardMinDays}–${rate.standardMaxDays} working days`,
    fee: freeStandard ? 0 : rate.standardFee,
    available: true,
  });

  const nearest = pickupPoints.filter((p) => p.state === rate.state);
  opts.push({
    method: "PICKUP",
    label: "Pickup point",
    eta: `${Math.max(1, rate.standardMinDays - 1)}–${rate.standardMaxDays} working days`,
    fee: nearest[0]?.fee ?? 0,
    available: nearest.length > 0,
    reason: nearest.length ? undefined : `No pickup points in ${rate.state} yet`,
  });

  return opts;
}

export function podAllowed(rate: DeliveryRate | null, total: number, isTeam: boolean) {
  if (!rate?.podAvailable) return { ok: false, reason: "Pay on delivery isn't available in this state yet" };
  if (isTeam) return { ok: false, reason: "Team-Up orders are prepaid so the team can lock in" };
  if (total > POD_MAX_ORDER_KOBO) return { ok: false, reason: "Pay on delivery is for orders up to ₦150,000" };
  return { ok: true as const };
}
