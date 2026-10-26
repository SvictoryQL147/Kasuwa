import {
  Baby, CookingPot, Laptop, Shirt, ShoppingBasket, Smartphone, Sparkles, Tv, Tag, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = { Baby, CookingPot, Laptop, Shirt, ShoppingBasket, Smartphone, Sparkles, Tv };

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const I = MAP[name] ?? Tag;
  return <I className={className} />;
}
