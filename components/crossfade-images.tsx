"use client"

import Image from "next/image"

// Stacked photos where only `active` is visible; the rest fade out underneath.
// The parent owns the timer, so it can drive other UI (dots, captions) from the same index.
export function CrossfadeImages({
  images,
  active,
  sizes,
  alt = "",
  className = "object-cover",
  reduceMotion = false,
  fadeMs = 1800,
}: {
  images: string[]
  active: number
  sizes: string
  alt?: string
  className?: string
  reduceMotion?: boolean | null
  fadeMs?: number
}) {
  return (
    <>
      {images.map((src, i) => {
        const isActive = i === active
        return (
          <div
            key={src}
            aria-hidden={isActive ? undefined : true}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{ opacity: isActive ? 1 : 0, transitionDuration: reduceMotion ? "0ms" : `${fadeMs}ms` }}
          >
            <Image
              src={src}
              alt={isActive ? alt : ""}
              fill
              priority={i === 0}
              sizes={sizes}
              className={`${className} transition-transform ease-out`}
              style={{
                // Slow drift while a photo is showing
                transform: isActive && !reduceMotion ? "scale(1.06)" : "scale(1)",
                transitionDuration: reduceMotion ? "0ms" : `${fadeMs * 4}ms`,
              }}
            />
          </div>
        )
      })}
    </>
  )
}
