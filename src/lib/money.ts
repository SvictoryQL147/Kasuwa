const fmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Format kobo as naira, e.g. 1250000 -> "₦12,500" */
export function naira(kobo: number): string {
  return fmt.format(Math.round(kobo) / 100).replace("NGN", "₦");
}

/** Convert a naira amount entered by a person into kobo. */
export function toKobo(nairaAmount: number): number {
  return Math.round(nairaAmount * 100);
}

export function percentOff(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
