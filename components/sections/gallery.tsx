"use client"

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import localFont from "next/font/local"
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { Cinzel } from "next/font/google"
import { Section } from "@/components/section"
import { sectionType } from "@/lib/section-typography"
import { useSiteConfig } from "@/hooks/use-site-config"
import { TintedDeco } from "@/components/tinted-deco"
import { PlainBubbles } from "@/components/loader/PlainBubbles"
import { DecoCorners } from "@/components/deco-corners"
import { HEART_PATH } from "@/components/rising-hearts"
import { SectionBackdrop } from "@/components/section-backdrop"

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const theSeasons = localFont({
  src: "../../Font/Fontspring-DEMO-theseasons-reg.otf",
  display: "swap",
  variable: "--font-the-seasons",
})

const aboveTheBeyond = localFont({
  src: "../../Font/above-the-beyond-script.otf",
  display: "swap",
  variable: "--font-above-beyond",
})

// Palette lives in globals.css → motif / welcome tokens.
const C = {
  title: "var(--color-welcome-navy)",
  script: "var(--color-welcome-script)",
  eyebrow: "var(--color-welcome-heading)",
  body: "var(--color-welcome-text)",
  soft: "var(--color-welcome-text)",
  accent: "var(--color-motif-accent)",
  leaf: "var(--color-motif-yellow)",
  blue: "var(--color-welcome-heading)",
  deep: "var(--color-motif-deep)",
  paper: "var(--color-welcome-bg-soft)",
  light: "var(--color-motif-soft)",
} as const

// Same circle pattern as the video / love story / details sections (PlainBubbles paints the base)
const sectionBg = "var(--color-bg-pattern-base)"

// Soft white edge so text stays crisp over the circles
const onBgGlow = "0 1px 0 rgb(255 255 255 / 85%), 0 0 12px rgb(255 255 255 / 70%)"

// Warm-gray hairlines either side of a dusty-rose heart (same as the love story divider)
const lineRight = {
  background: "linear-gradient(to right, transparent, var(--color-motif-medium))",
} as const
const lineLeft = {
  background: "linear-gradient(to left, transparent, var(--color-motif-medium))",
} as const

// Paper photo frame with a blush edge (matches .story-open-photo)
const frameStyle: React.CSSProperties = {
  background: "var(--color-motif-soft)",
  border: "1px solid color-mix(in srgb, var(--color-motif-blush) 85%, transparent)",
  boxShadow: "0 18px 34px -16px color-mix(in srgb, var(--color-welcome-navy) 32%, transparent)",
}

const innerFrameStyle: React.CSSProperties = {
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-motif-soft) 70%, transparent)",
}

const badgeStyle: React.CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--color-motif-deep) 75%, transparent)",
  color: C.light,
}

function DecoImg({ src, className }: { src: string; className: string }) {
  if (!src) return null
  return <TintedDeco src={src} className={className} />
}

function DiamondDivider({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="h-px w-10 sm:w-16 md:w-20" style={lineRight} />
      {children ?? (
        <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill={C.accent} aria-hidden>
          <path d={HEART_PATH} />
        </svg>
      )}
      <span className="h-px w-10 sm:w-16 md:w-20" style={lineLeft} />
    </div>
  )
}

const galleryTitleSize = {
  main: "clamp(1.65rem, 8.5vw, 4.5rem)",
  script: "clamp(0.95rem, 4.8vw, 2.7rem)",
} as const

function GalleryTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <h2
      className="welcome-title-lockup relative mx-auto w-full max-w-full text-center"
      style={
        {
          "--title-size": galleryTitleSize.main,
          "--script-size": galleryTitleSize.script,
        } as React.CSSProperties
      }
    >
      <span className="sr-only">{title} — {subtitle}</span>
      <span
        aria-hidden
        className={`${theSeasons.className} block uppercase leading-[0.9] tracking-[0.04em] min-[400px]:tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em]`}
        style={{ fontSize: "var(--title-size)", color: C.title, textShadow: onBgGlow }}
      >
        {title}
      </span>
      <span
        aria-hidden
        className={`${aboveTheBeyond.className} relative z-10 mx-auto mt-1.5 block w-fit max-w-full px-1 leading-[0.88] sm:mt-2 sm:leading-[0.9]`}
        style={{
          fontSize: "var(--script-size)",
          color: C.script,
          textShadow: onBgGlow,
        }}
      >
        {subtitle}
      </span>
    </h2>
  )
}

type GalleryItem = { image: string; text: string }

/**
 * Mobile carousel with endless swiping: the photos are rendered three times and,
 * once a swipe settles in the first or last copy, the strip jumps (invisibly) to
 * the same photo in the middle copy. Dots show and jump to the current photo.
 */
function MobileInfiniteCarousel({
  items,
  swipeHint,
  onOpen,
  onPointerDown,
  onPointerMove,
}: {
  items: GalleryItem[]
  swipeHint: string
  onOpen: (item: GalleryItem, index: number) => void
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const n = items.length
  const loop = n > 1
  const slides = loop ? [...items, ...items, ...items] : items
  const [active, setActive] = useState(0)

  const slideAt = (i: number) => stripRef.current?.children[i] as HTMLElement | undefined

  const centerOn = useCallback((i: number, behavior: ScrollBehavior) => {
    const strip = stripRef.current
    const slide = strip?.children[i] as HTMLElement | undefined
    if (!strip || !slide) return
    strip.scrollTo({ left: slide.offsetLeft - (strip.clientWidth - slide.clientWidth) / 2, behavior })
  }, [])

  // Index of the slide nearest the centre
  const nearest = () => {
    const strip = stripRef.current
    const first = slideAt(0)
    const second = slideAt(1)
    if (!strip || !first) return 0
    const step = second ? second.offsetLeft - first.offsetLeft : first.clientWidth
    const offset = first.offsetLeft - (strip.clientWidth - first.clientWidth) / 2
    return Math.max(0, Math.min(slides.length - 1, Math.round((strip.scrollLeft - offset) / step)))
  }

  // Start on the first photo of the middle copy
  useLayoutEffect(() => {
    if (loop) centerOn(n, "auto")
  }, [loop, n, centerOn])

  const handleScroll = () => {
    const i = nearest()
    setActive(i % n)
    if (!loop) return
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const j = nearest()
      if (j < n) centerOn(j + n, "auto")
      else if (j >= 2 * n) centerOn(j - n, "auto")
    }, 140)
  }

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

  return (
    <div className="sm:hidden">
      <div
        ref={stripRef}
        onScroll={handleScroll}
        className="relative flex gap-2.5 overflow-x-auto pt-1 pb-5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: "7%" }}
        aria-label="Gallery carousel"
      >
        {slides.map((item, i) => {
          const index = i % n
          const isActive = index === active
          return (
            <button
              key={`${item.image}-${i}`}
              type="button"
              className={`group relative snap-center shrink-0 w-[86%] rounded-xl p-1.5 transition-[transform,opacity] duration-500 ${
                isActive ? "scale-100 opacity-100" : "scale-[0.94] opacity-75"
              }`}
              style={frameStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onClick={() => onOpen(item, index)}
              aria-label={`Open image ${index + 1}`}
              tabIndex={loop && (i < n || i >= 2 * n) ? -1 : 0}
              aria-hidden={loop && (i < n || i >= 2 * n) ? true : undefined}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                <Image
                  src={encodeURI(item.image)}
                  alt={item.text || `Gallery image ${index + 1}`}
                  fill
                  sizes="86vw"
                  className="object-cover"
                  priority={i === n}
                />
                <div className="pointer-events-none absolute inset-0 rounded-lg" style={innerFrameStyle} />
              </div>

              <div className="absolute top-3.5 right-3.5 rounded-full px-2 py-0.5 backdrop-blur-sm" style={badgeStyle}>
                <span className="text-[11px] font-medium tracking-wider">
                  {index + 1}/{n}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Swipe hint: animated arrows either side, dots for each photo */}
      {loop && (
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-3" style={{ color: C.blue }}>
            <ChevronLeft className="gallery-swipe-arrow gallery-swipe-arrow--left h-4 w-4" aria-hidden />
            <span
              className={`${cinzel.className} text-[0.62rem] font-semibold uppercase tracking-[0.3em]`}
              style={{ textShadow: onBgGlow }}
            >
              {swipeHint}
            </span>
            <ChevronRight className="gallery-swipe-arrow gallery-swipe-arrow--right h-4 w-4" aria-hidden />
          </div>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose a photo">
            {items.map((item, idx) => (
              <button
                key={item.image + idx}
                type="button"
                role="tab"
                aria-selected={idx === active}
                aria-label={`Show photo ${idx + 1}`}
                onClick={() => centerOn(n + idx, "smooth")}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: idx === active ? "1.25rem" : "0.375rem",
                  background: idx === active ? C.accent : "color-mix(in srgb, var(--color-welcome-heading) 35%, transparent)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Gallery() {
  const { gallery } = useSiteConfig()
  const galleryItems: GalleryItem[] = gallery.images
  const decos = gallery.decos

  // Index of the photo open in the lightbox (null = closed)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const currentIndex = openIndex ?? 0
  const selectedImage = openIndex !== null ? galleryItems[openIndex] ?? null : null
  const [isMounted, setIsMounted] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchDeltaX, setTouchDeltaX] = useState(0)
  const [zoomScale, setZoomScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null)
  const [pinchStartScale, setPinchStartScale] = useState(1)
  const [lastTap, setLastTap] = useState(0)
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const pointerStart = useRef({ x: 0, y: 0, dragging: false })
  const swipeConsumed = useRef(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  const resetZoom = useCallback(() => {
    setZoomScale(1)
    setPan({ x: 0, y: 0 })
    setPanStart(null)
  }, [])

  const closeLightbox = useCallback(() => {
    setOpenIndex(null)
    resetZoom()
  }, [resetZoom])

  const openLightbox = useCallback((_item: GalleryItem, index: number) => {
    if (pointerStart.current.dragging) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    setOpenIndex(index)
    resetZoom()
  }, [resetZoom])

  const showImage = useCallback((index: number) => {
    setOpenIndex(index)
    resetZoom()
  }, [resetZoom])

  const handleThumbPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY, dragging: false }
  }

  const handleThumbPointerMove = (event: React.PointerEvent) => {
    const dx = event.clientX - pointerStart.current.x
    const dy = event.clientY - pointerStart.current.y
    if (dx * dx + dy * dy > 64) pointerStart.current.dragging = true
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    const n = galleryItems.length
    setOpenIndex((i) => (i === null ? i : direction === 'next' ? (i + 1) % n : (i - 1 + n) % n))
    resetZoom()
  }, [resetZoom, galleryItems.length])

  const isOpen = openIndex !== null

  // Move focus into the lightbox on open, and back to the photo that opened it on close
  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus({ preventScroll: true })
    return () => returnFocusRef.current?.focus({ preventScroll: true })
  }, [isOpen])

  // Keep the active thumbnail in view
  useEffect(() => {
    if (openIndex === null) return
    const thumb = thumbStripRef.current?.children[openIndex] as HTMLElement | undefined
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [openIndex])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedImage) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateImage('prev')
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateImage('next')
      }
      if (e.key === 'Escape') closeLightbox()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, navigateImage, closeLightbox])

  useEffect(() => {
    if (!isOpen) return
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isOpen])

  // Preload adjacent images for smoother nav
  useEffect(() => {
    if (selectedImage) {
      const next = new window.Image()
      next.src = encodeURI(galleryItems[(currentIndex + 1) % galleryItems.length].image)
      const prev = new window.Image()
      prev.src = encodeURI(galleryItems[(currentIndex - 1 + galleryItems.length) % galleryItems.length].image)
    }
  }, [selectedImage, currentIndex, galleryItems])

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

  return (
    <div
      className={`${theSeasons.variable} ${aboveTheBeyond.variable} relative w-full`}
      style={{ background: sectionBg }}
    >
      <PlainBubbles />
      {/* Pink paper wash + grain and rising hearts, same as the love story (section-backdrop.tsx) */}
      <SectionBackdrop />
      <Section
        id="gallery"
        className="relative z-10 overflow-hidden pt-14 pb-10 sm:pt-16 sm:pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20"
      >
        {/* Corner florals + double border (content/site.ts → gallery.decos / showFrame) */}
        {gallery.showFrame && <div className="deco-frame" aria-hidden="true" />}
        <DecoCorners decos={decos} />

      {/* Header */}
      <div className="relative z-20 mx-auto mb-8 max-w-5xl px-3 text-center sm:mb-10 sm:px-4 md:mb-12">
        <DecoImg
          src={decos.headerOrnament}
          className="mx-auto mb-3 block h-auto w-28 select-none sm:mb-4 sm:w-36 md:w-44"
        />
        <DiamondDivider />
        <p
          className={`${cinzel.className} mx-auto mt-4 max-w-[20rem] px-2 text-[0.6875rem] font-semibold leading-snug tracking-[0.12em] uppercase min-[400px]:max-w-none min-[400px]:text-[0.75rem] min-[400px]:tracking-[0.16em] sm:mt-5 sm:text-[0.9375rem] sm:tracking-[0.2em] md:text-base md:tracking-[0.22em]`}
          style={{ color: C.eyebrow, textShadow: onBgGlow }}
        >
          {gallery.eyebrow}
        </p>
        <div className="mx-auto mt-3 sm:mt-4 md:mt-5">
          <GalleryTitle title={gallery.title} subtitle={gallery.subtitle} />
        </div>
        <p
          className={`font-goudy-italic mx-auto mt-4 max-w-xl px-2 sm:mt-5 md:mt-6 ${sectionType.textRelaxed}`}
          style={{ color: C.body, textShadow: onBgGlow }}
        >
          {gallery.description}
        </p>

        <div className="mt-5 sm:mt-6">
          <DiamondDivider>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8"
              style={{
                border: "1px solid color-mix(in srgb, var(--color-motif-blush) 90%, transparent)",
                background: "var(--color-motif-soft)",
              }}
            >
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: C.blue }} aria-hidden />
            </span>
          </DiamondDivider>
        </div>
      </div>

      {/* Gallery content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 sm:px-10 md:px-12 pb-2 sm:pb-3">
        <>
            {/* Mobile: endless swipe carousel; bleeds past the side padding for slimmer margins */}
            <div className="-mx-6 sm:mx-0">
              <MobileInfiniteCarousel
                items={galleryItems}
                swipeHint={gallery.swipeHint}
                onOpen={openLightbox}
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
              />
            </div>

            {/* Tablet/Desktop: framed grid with a gentle stagger */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 lg:pb-8">
              {galleryItems.map((item, index) => (
                <button
                  key={item.image + index}
                  type="button"
                  className={`group relative w-full rounded-xl p-1.5 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-motif-accent)] focus-visible:ring-offset-2 ${index % 2 === 1 ? "lg:translate-y-8 lg:hover:translate-y-7" : ""}`}
                  style={frameStyle}
                  onPointerDown={handleThumbPointerDown}
                  onPointerMove={handleThumbPointerMove}
                  onClick={() => openLightbox(item, index)}
                  aria-label={`Open image ${index + 1}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                    <Image
                      src={encodeURI(item.image)}
                      alt={item.text || `Gallery image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "linear-gradient(to top, color-mix(in srgb, var(--color-welcome-navy) 55%, transparent), transparent 55%)",
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-lg" style={innerFrameStyle} />
                  </div>

                  <div
                    className="absolute top-3.5 right-3.5 rounded-full px-2 py-0.5 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
                    style={badgeStyle}
                  >
                    <span className="text-[11px] font-medium tracking-wider">
                      {index + 1}/{galleryItems.length}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-center sm:mt-12 md:mt-14">
              <Link
                href={gallery.buttonHref}
                className={`${cinzel.className} inline-flex items-center justify-center rounded-full border px-8 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] sm:text-[0.6875rem] sm:tracking-[0.22em]`}
                style={{
                  background: C.blue,
                  borderColor: "rgb(255 255 255 / 70%)",
                  color: "#FFFFFF",
                  boxShadow: "0 0 0 4px rgb(255 255 255 / 35%), 0 10px 22px -10px color-mix(in srgb, var(--color-welcome-navy) 55%, transparent)",
                }}
              >
                {gallery.buttonText}
              </Link>
            </div>

            <p
              className={`font-goudy-italic mx-auto mt-6 max-w-lg px-2 text-center leading-relaxed sm:mt-8 ${sectionType.textRelaxed}`}
              style={{ color: C.soft, textShadow: onBgGlow }}
            >
              {gallery.footnote}
            </p>
            <DecoImg
              src={decos.footerVine}
              className="mx-auto mt-6 block h-auto w-56 select-none opacity-90 sm:mt-8 sm:w-72 md:w-96"
            />
        </>
      </div>
      </Section>

      {isMounted && selectedImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6"
          style={{ background: "color-mix(in srgb, var(--color-welcome-navy) 35%, black 65%)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
          onClick={() => {
            if (swipeConsumed.current) {
              swipeConsumed.current = false
              return
            }
            closeLightbox()
          }}
        >
          <div
            className="relative flex h-full w-full items-center justify-center"
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                const now = Date.now()
                if (now - lastTap < 300) {
                  e.preventDefault()
                  setZoomScale((s) => (s > 1 ? 1 : 2))
                  setPan({ x: 0, y: 0 })
                }
                setLastTap(now)
                const t = e.touches[0]
                setTouchStartX(t.clientX)
                setTouchDeltaX(0)
                if (zoomScale > 1) {
                  setPanStart({ x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y })
                }
              }
              if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                setPinchStartDist(Math.hypot(dx, dy))
                setPinchStartScale(zoomScale)
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && pinchStartDist) {
                e.preventDefault()
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                const dist = Math.hypot(dx, dy)
                setZoomScale(clamp((dist / pinchStartDist) * pinchStartScale, 1, 3))
              } else if (e.touches.length === 1) {
                const t = e.touches[0]
                if (zoomScale > 1 && panStart) {
                  e.preventDefault()
                  setPan({ x: panStart.panX + (t.clientX - panStart.x), y: panStart.panY + (t.clientY - panStart.y) })
                } else if (touchStartX !== null) {
                  setTouchDeltaX(t.clientX - touchStartX)
                }
              }
            }}
            onTouchEnd={() => {
              setPinchStartDist(null)
              setPanStart(null)
              if (zoomScale === 1 && Math.abs(touchDeltaX) > 50) {
                swipeConsumed.current = true
                navigateImage(touchDeltaX > 0 ? "prev" : "next")
              }
              setTouchStartX(null)
              setTouchDeltaX(0)
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
              <div
                className="pointer-events-auto rounded-full border px-4 py-2 backdrop-blur-md"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-motif-deep) 55%, transparent)",
                  borderColor: "color-mix(in srgb, var(--color-motif-silver) 50%, transparent)",
                }}
              >
                <span className="text-sm font-medium sm:text-base" style={{ color: C.light }}>
                  {currentIndex + 1} / {galleryItems.length}
                </span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  closeLightbox()
                }}
                className="pointer-events-auto rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-black/60 sm:p-3"
                aria-label="Close lightbox"
              >
                <X size={20} className="text-white sm:h-6 sm:w-6" />
              </button>
            </div>

            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage("prev")
                  }}
                  className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-black/60 sm:left-4 sm:p-4"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} className="text-white sm:h-7 sm:w-7" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage("next")
                  }}
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-black/60 sm:right-4 sm:p-4"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} className="text-white sm:h-7 sm:w-7" />
                </button>
              </>
            )}

            <div
              className="relative flex max-h-[82dvh] max-w-[92vw] items-center justify-center sm:-translate-y-8 sm:max-h-[72dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                key={selectedImage.image}
                src={encodeURI(selectedImage.image)}
                alt={selectedImage.text.trim() || `Gallery image ${currentIndex + 1}`}
                width={1600}
                height={2000}
                sizes="100vw"
                priority
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomScale})`,
                  transition: pinchStartDist ? "none" : "transform 200ms ease-out",
                }}
                className="h-auto max-h-[82dvh] w-auto max-w-[92vw] rounded-lg object-contain shadow-2xl will-change-transform animate-in fade-in zoom-in-[0.98] duration-300 sm:max-h-[72dvh]"
              />
              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    resetZoom()
                  }}
                  className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-black/80"
                >
                  {gallery.resetZoomText}
                </button>
              )}
            </div>

            {galleryItems.length > 1 && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 sm:hidden">
                <p className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
                  {gallery.lightboxSwipeHint}
                </p>
              </div>
            )}

            {/* Thumbnail strip (tablet/desktop) */}
            {galleryItems.length > 1 && (
              <div
                ref={thumbStripRef}
                className="absolute inset-x-0 bottom-4 z-20 mx-auto hidden max-w-[min(92vw,56rem)] gap-2 overflow-x-auto px-2 py-1.5 sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onClick={(e) => e.stopPropagation()}
                aria-label="Choose a photo"
              >
                {galleryItems.map((item, idx) => {
                  const isActive = idx === currentIndex
                  return (
                    <button
                      key={item.image + idx}
                      type="button"
                      onClick={() => showImage(idx)}
                      aria-label={`Show photo ${idx + 1}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative mx-auto h-16 w-12 shrink-0 overflow-hidden rounded-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-20 md:w-14 ${
                        isActive ? "opacity-100 ring-2 ring-white/90" : "opacity-50 hover:opacity-85"
                      }`}
                    >
                      <Image src={encodeURI(item.image)} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}