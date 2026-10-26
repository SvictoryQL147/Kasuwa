import { Star } from "lucide-react";

export function Stars({ rating, count, size = "sm" }: { rating: number; count?: number; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-1 text-ink-500">
      <Star className={`${s} fill-accent-400 text-accent-400`} />
      <span className="font-semibold text-ink-900">{rating.toFixed(1)}</span>
      {count != null && <span className="text-xs">({count.toLocaleString()})</span>}
    </span>
  );
}
