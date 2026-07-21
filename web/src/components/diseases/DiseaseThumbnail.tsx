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
  const src = diseaseImage(slug, image);
  return (
    <div
      className={cn(
        "overflow-hidden bg-sand flex items-center justify-center",
        variant === "card" ? "h-32" : "rounded-xl border border-forest/10"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          variant === "card"
            ? "h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            : "w-full max-h-56 object-cover",
          className
        )}
      />
    </div>
  );
}
