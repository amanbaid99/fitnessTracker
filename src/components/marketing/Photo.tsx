"use client";

import Image from "next/image";
import { useState } from "react";
import { assetPath, cn } from "@/lib/utils";

/**
 * A photo slot that looks deliberate before the photo exists.
 *
 * The layouts are built photo-first, but the images are dropped in later (see
 * public/images/README.md for the manifest). Until then each slot renders
 * drawn artwork underneath, and only fades a real photograph in once it has
 * actually loaded — so the page reads as finished either way, and gains
 * photography without a code change.
 */
export function Photo({
  src,
  alt,
  className,
  imageClassName,
  fallback,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Drawn artwork shown until (and unless) a real photograph exists here. */
  fallback?: React.ReactNode;
  priority?: boolean;
}) {
  const [state, setState] = useState<"pending" | "loaded" | "missing">("pending");

  return (
    <div className={cn("relative isolate overflow-hidden bg-ft-surface-alt", className)}>
      <div aria-hidden className="absolute inset-0">
        {fallback ?? (
          <div className="h-full w-full bg-[linear-gradient(140deg,#efebe2_0%,#e6e0d3_45%,#dcd4c3_100%)]" />
        )}
      </div>

      {/* Unmounted once the file is known to be missing, so the browser's
          broken-image glyph never shows through the placeholder. */}
      {state !== "missing" && (
        <Image
          src={assetPath(src)}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          onLoad={() => setState("loaded")}
          onError={() => setState("missing")}
          className={cn(
            "object-cover transition-opacity duration-500",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      )}
    </div>
  );
}
