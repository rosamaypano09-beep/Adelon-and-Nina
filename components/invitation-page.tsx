"use client"

import { Suspense, useState, useCallback, useEffect } from "react"
import { motion } from "motion/react"
import dynamic from "next/dynamic"
import { Hero as MainHero } from "@/components/sections/hero"
import { Welcome } from "@/components/sections/welcome"
import { Hero as InvitationHero } from "@/components/loader/Hero"
import { LoadingScreen } from "@/components/loader/LoadingScreen"
import { InvitePhotoBackdrop } from "@/components/loader/invite-photo-backdrop"
import { Navbar } from "@/components/navbar"
import { AppState } from "@/components/types"
import { prefetchInvitationData } from "@/lib/invitation-data"
import { useSiteConfig } from "@/hooks/use-site-config"
import { WeddingPlaylist } from "@/components/sections/wedding-playlist"
import { PlainBubbles } from "@/components/loader/PlainBubbles"
import { SectionBackdrop } from "@/components/section-backdrop"
import type { SponsorsList } from "@/components/sections/entourage"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })
const GuestList = dynamic(() => import("@/components/sections/guest-list").then(mod => ({ default: mod.GuestList })), { ssr: false })

// Below-the-fold sections are split into separate chunks to shrink the initial bundle.
const CoupleVideo = dynamic(() => import("@/components/sections/couple-video").then(mod => mod.CoupleVideo))
const LoveStory = dynamic(() => import("@/components/sections/love-story").then(mod => mod.LoveStory))
const Countdown = dynamic(() => import("@/components/sections/countdown").then(mod => mod.Countdown))
const Gallery = dynamic(() => import("@/components/sections/gallery").then(mod => mod.Gallery))
const MessageVideo = dynamic(() => import("@/components/sections/message-video").then(mod => mod.MessageVideo))
const Messages = dynamic(() => import("@/components/sections/messages").then(mod => mod.Messages))
const Details = dynamic(() => import("@/components/sections/details").then(mod => mod.Details))
const WeddingTimeline = dynamic(() => import("@/components/sections/wedding-timeline").then(mod => mod.WeddingTimeline))
const Entourage = dynamic(() => import("@/components/sections/entourage").then(mod => mod.Entourage))
const BookOfGuests = dynamic(() => import("@/components/sections/book-of-guests").then(mod => mod.BookOfGuests))
const FAQ = dynamic(() => import("@/components/sections/faq").then(mod => mod.FAQ))
const Registry = dynamic(() => import("@/components/sections/registry").then(mod => mod.Registry))
const SnapShare = dynamic(() => import("@/components/sections/snap-share").then(mod => mod.SnapShare))
const SeeYouThere = dynamic(() => import("@/components/sections/see-you-there").then(mod => mod.SeeYouThere))
const Footer = dynamic(() => import("@/components/sections/footer").then(mod => mod.Footer))

const mainEntryEase = [0.22, 1, 0.36, 1] as const
const CINEMATIC_ENTRY_MS = 3000

const detailsShellVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.01 },
  },
}

const silkBackdropVariants = {
  hidden: { opacity: 0, scale: 1.08 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.45, ease: mainEntryEase, delay: 0.42 },
  },
}

const navbarRevealVariants = {
  hidden: { opacity: 0, y: -28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.88, ease: mainEntryEase, delay: 0.72 },
  },
}

const heroRevealVariants = {
  hidden: { opacity: 0, y: 52, scale: 1.05, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.28, ease: mainEntryEase, delay: 0.58 },
  },
}

const sectionsRevealVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.08, ease: mainEntryEase, delay: 0.86 },
  },
}

/** WebGL Silk needs a hex color. */
const SILK_COLOR = "#172D4E"

type InvitationPageProps = {
  /** Which principal-sponsor sheet the entourage shows (googleAPI.sponsorsInviteOne / Two) */
  sponsorsList?: SponsorsList
  /** false hides the entourage section (e.g. /inviteguest) */
  showEntourage?: boolean
}

export function InvitationPage({ sponsorsList, showEntourage = true }: InvitationPageProps = {}) {
  // Skip loading/landing only when returning from /gallery.
  // The flag is set by the "View Full Gallery" button and cleared immediately
  // here so a page refresh always replays the loading screen.
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== "undefined") {
      const returning = sessionStorage.getItem("returnFromGallery")
      if (returning === "true") {
        sessionStorage.removeItem("returnFromGallery")
        return AppState.DETAILS
      }
    }
    return AppState.LOADING
  })
  const siteConfig = useSiteConfig()
  const plainLoader = siteConfig.loadingScreen?.display === "plain"
  const enableDecor = process.env.NEXT_PUBLIC_ENABLE_DECOR !== 'false'
  const [showInvitation, setShowInvitation] = useState(false)
  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(
    () => appState === AppState.LOADING,
  )
  const [heroEnterFromLoading, setHeroEnterFromLoading] = useState(false)
  const [enteringFromInvite, setEnteringFromInvite] = useState(false)

  // When returning from /gallery, scroll to the #gallery hash in the URL
  useEffect(() => {
    if (appState !== AppState.DETAILS) return
    const hash = window.location.hash
    if (!hash) return
    // Small delay lets the page paint before scrolling
    const id = setTimeout(() => {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: "smooth" })
    }, 100)
    return () => clearTimeout(id)
  }, [appState])

  const handleLoadingFadeStart = useCallback(() => {
    setShowInvitation(true)
    setHeroEnterFromLoading(true)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setAppState(AppState.LANDING)
    setLoadingOverlayVisible(false)
  }, [])

  const handleTransitionStart = useCallback(() => {
    setEnteringFromInvite(true)
    setAppState(AppState.DETAILS)
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const handleOpenInvitation = useCallback(() => {
    setShowInvitation(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
    window.setTimeout(() => setEnteringFromInvite(false), CINEMATIC_ENTRY_MS)
  }, [])

  const detailsVisible = appState === AppState.DETAILS
  const pageScrollLocked = appState !== AppState.DETAILS
  const cinematicEntry = enteringFromInvite && detailsVisible

  useEffect(() => {
    prefetchInvitationData({ sponsorsList, entourage: showEntourage })
  }, [sponsorsList, showEntourage])

  return (
      <div className={`relative min-h-screen bg-cloud text-charcoal selection:bg-birch selection:text-nut font-sans ${pageScrollLocked ? "overflow-hidden" : ""}`}>
        {loadingOverlayVisible && !plainLoader && (
          <div
            className="invite-photo-backdrop-wrap invite-photo-backdrop-wrap--loading"
            aria-hidden="true"
          >
            <InvitePhotoBackdrop photos={siteConfig.loadingScreen?.backgroundPhotos} />
          </div>
        )}

        {loadingOverlayVisible && (
          <LoadingScreen
            onFadeStart={handleLoadingFadeStart}
            onComplete={handleLoadingComplete}
          />
        )}

        {(loadingOverlayVisible || showInvitation) && (
          <InvitationHero
            onOpen={handleOpenInvitation}
            onTransitionStart={handleTransitionStart}
            enterFromLoading={heroEnterFromLoading}
            visible={showInvitation}
          />
        )}

        <main className="relative w-full h-full">

          <motion.div
            className={detailsVisible ? "" : "pointer-events-none"}
            initial={false}
            variants={detailsShellVariants}
            animate={detailsVisible ? "show" : "hidden"}
          >
            {cinematicEntry && (
              <motion.div
                className="fixed inset-0 z-[28] pointer-events-none bg-[#FBF7F5]"
                aria-hidden="true"
                initial={{ clipPath: "circle(0% at 50% 46%)", opacity: 0.98 }}
                animate={{ clipPath: "circle(145% at 50% 46%)", opacity: 0 }}
                transition={{ duration: 1.55, delay: 0.12, ease: mainEntryEase }}
              />
            )}

            {enableDecor && (
              <motion.div
                className="fixed inset-0 z-0 pointer-events-none"
                variants={silkBackdropVariants}
                initial={false}
                animate={cinematicEntry ? "show" : detailsVisible ? "show" : "hidden"}
                transition={cinematicEntry ? undefined : { duration: 0.01 }}
              >
                <Suspense
                  fallback={
                    <div className="h-full w-full bg-[var(--color-welcome-bg-soft)]" />
                  }
                >
                  <Silk
                    speed={8}
                    scale={0.9}
                    color={SILK_COLOR}
                    noiseIntensity={0}
                    rotation={0.3}
                  />
                </Suspense>
              </motion.div>
            )}

            <div className="relative z-10">
              {appState === AppState.DETAILS && (
                <motion.div
                  variants={navbarRevealVariants}
                  initial={false}
                  animate={cinematicEntry ? "show" : "show"}
                  transition={cinematicEntry ? undefined : { duration: 0.01 }}
                >
                  <Navbar />
                </motion.div>
              )}
              {/* Spacer so content starts below fixed navbar (h-12 sm:h-14 md:h-16) */}
              {appState === AppState.DETAILS && <div className="h-12 sm:h-14 md:h-16" aria-hidden />}
              <motion.div
                variants={heroRevealVariants}
                initial={false}
                animate={cinematicEntry ? "show" : detailsVisible ? "show" : "hidden"}
                transition={cinematicEntry ? undefined : { duration: 0.01 }}
              >
                <MainHero />
              </motion.div>
              <motion.div
                variants={sectionsRevealVariants}
                initial={false}
                animate={cinematicEntry ? "show" : detailsVisible ? "show" : "hidden"}
                transition={cinematicEntry ? undefined : { duration: 0.01 }}
              >
               <Welcome />
              {/* One continuous circle pattern behind the video and love story (same as Details) — no seam between them */}
              <div className="relative">
                <PlainBubbles />
                <CoupleVideo skyBackdrop={false} />
                <LoveStory skyBackdrop={false} />
              </div>
              <Countdown />
              <Gallery />
             {/*  <MessageVideo />*/}
              <Messages />
              <Details />
              <WeddingTimeline />
              {showEntourage && <Entourage sponsorsList={sponsorsList} />}
              <GuestList />
              {/* One continuous circle pattern behind Book of Guests and FAQ — no seam between them */}
              <div className="relative isolate" style={{ background: "var(--color-bg-pattern-base)" }}>
                {/* Pattern repeated down the height so circles stay dense across both sections */}
                <PlainBubbles bands={3} />
                {/* Pink paper wash + rising hearts (section-backdrop.tsx) + one double border around both sections */}
                <SectionBackdrop />
                {siteConfig.bookOfGuests.showFrame && <div className="deco-frame" aria-hidden="true" />}
                <BookOfGuests background={false} />
                <FAQ background={false} />
              </div>
              <Registry />
              <WeddingPlaylist /> 
              <SnapShare />
              {/* Full-bleed photo section — paints its own background, so it sits outside the footer's pattern */}
              <SeeYouThere />
              <div className="relative isolate" style={{ background: "var(--color-bg-pattern-base)" }}>
                <PlainBubbles bands={3} />
                {/* Pink paper wash + rising hearts (section-backdrop.tsx) + double border around the footer */}
                <SectionBackdrop />
                {siteConfig.seeYouThere.plain.showFrame && <div className="deco-frame" aria-hidden="true" />}
                <Footer background={false} />
              </div>
              </motion.div>
            </div>
          </motion.div>
        </main>

      </div>
  )
}