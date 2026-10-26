import Image from "next/image";
import { CategoryIcon } from "./icon";
import { cn } from "@/lib/cn";

const PALETTES: Record<string, string> = {
  phones: "from-sky-100 to-indigo-200 text-indigo-700",
  fashion: "from-rose-100 to-orange-200 text-rose-700",
  home: "from-amber-100 to-yellow-200 text-amber-700",
  beauty: "from-pink-100 to-fuchsia-200 text-fuchsia-700",
  electronics: "from-slate-100 to-slate-300 text-slate-700",
  groceries: "from-lime-100 to-green-200 text-green-700",
  baby: "from-cyan-100 to-teal-200 text-teal-700",
  computing: "from-violet-100 to-purple-200 text-purple-700",
};
const ICONS: Record<string, string> = {
  phones: "Smartphone", fashion: "Shirt", home: "CookingPot", beauty: "Sparkles",
  electronics: "Tv", groceries: "ShoppingBasket", baby: "Baby", computing: "Laptop",
};

/** Real photo when the seller uploaded one, otherwise a branded category tile. */
export function ProductImage({
  src, alt, category, className, sizes = "(max-width: 768px) 50vw, 25vw", priority,
}: {
  src?: string; alt: string; category: string; className?: string; sizes?: string; priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-ink-100", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={cn("flex items-center justify-center bg-gradient-to-br", PALETTES[category] ?? PALETTES.electronics, className)}
      role="img"
      aria-label={alt}
    >
      <CategoryIcon name={ICONS[category] ?? "Tag"} className="h-1/3 w-1/3 opacity-70" />
    </div>
  );
}
