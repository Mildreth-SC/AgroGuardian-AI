"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";
import { diseaseImage } from "@/lib/disease-images";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  image?: string;
  alt: string;
  variant?: "card" | "detail";
  className?: string;
};

export function DiseaseThumbnail({
  slug,
  image,
  alt,
  variant = "card",
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const src = diseaseImage(slug, image);

  return (
    <div
      className={cn(
        "overflow-hidden bg-sand flex items-center justify-center",
        variant === "card" ? "h-32" : "rounded-xl border border-forest/10"
      )}
    >
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-leaf/15 to-forest/10 text-forest/70">
          <Leaf className="h-8 w-8" aria-hidden />
          <span className="px-3 text-center text-[11px] font-medium leading-tight">{alt}</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={cn(
            variant === "card"
              ? "h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              : "w-full max-h-56 object-cover",
            className
          )}
        />
      )}
    </div>
  );
}
