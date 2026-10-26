/** Parse "productId:qty,productId:qty" from the checkout URL. */
export function parseItems(raw: string) {
  const map = new Map<string, number>();
  for (const part of raw.split(",").filter(Boolean).slice(0, 30)) {
    const [id, q] = part.split(":");
    const qty = Math.max(1, Math.min(20, Number(q) || 1));
    if (id) map.set(id, (map.get(id) ?? 0) + qty);
  }
  return map;
}
