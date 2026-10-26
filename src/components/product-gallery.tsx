"use client";
import { useRef, useState } from "react";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/cn";

/** Swipeable on phones (with dots), thumbnails on desktop. */
export function ProductGallery({ images, title, category }: { images: string[]; title: string; category: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (images.length <= 1) {
    return (
      <ProductImage src={images[0]} alt={title} category={category} className="card aspect-square w-full" priority sizes="(max-width: 768px) 100vw, 50vw" />
    );
  }

  const goTo = (i: number) => {
    setActive(i);
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="space-y-2">
      <div className="card relative overflow-hidden">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            <ProductImage
              key={src}
              src={src}
              alt={`${title} photo ${i + 1}`}
              category={category}
              className="aspect-square w-full shrink-0 snap-center"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              className={cn("h-2 rounded-full transition-all", i === active ? "w-5 bg-white" : "w-2 bg-white/60")}
            />
          ))}
        </div>
      </div>
      <div className="hidden gap-2 md:flex">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => goTo(i)}
            aria-label={`Show photo ${i + 1}`}
            className={cn("overflow-hidden rounded-xl ring-2", i === active ? "ring-brand-600" : "ring-transparent")}
          >
            <ProductImage src={src} alt="" category={category} className="h-20 w-20" sizes="80px" />
          </button>
        ))}
      </div>
    </div>
  );
}
