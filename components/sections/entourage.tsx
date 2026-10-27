"use client"

import React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react"
import { MotionConfig, motion, useScroll, useTransform, type Variants } from "motion/react"
import localFont from "next/font/local"
import { Section } from "@/components/section"
import { sectionType } from "@/lib/section-typography"
import { Cinzel } from "next/font/google"
import { useSiteConfig } from "@/hooks/use-site-config"
import { fetchUntilReady, isAbortError } from "@/lib/fetch-until-ready"
import { fetchInvitationList, readCachedInvitationList } from "@/lib/invitation-data"
import { PlainBubbles } from "@/components/loader/PlainBubbles"
import { TintedDeco } from "@/components/tinted-deco"

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
const PAPER = "var(--color-welcome-bg-soft)"
const ACCENT = "var(--color-welcome-heading)" // dusty blue — readable on light backgrounds (was sunshine yellow)
const NAVY = "var(--color-ink-deep)"
const SCRIPT = "var(--color-ink-accent)"
const BODY = "var(--color-welcome-text)"
const HAIRLINE = "color-mix(in srgb, var(--color-motif-medium) 60%, transparent)"

// Section background = the hero's circle pattern (PlainBubbles paints its own aqua base)
const sectionBg = "var(--color-bg-pattern-base)"

// Text sitting directly on the circle pattern (colors: globals.css → --color-on-pattern*)
const onBg = {
  color: "var(--color-ink-deep)",
  textShadow:
    "0 0 1px var(--color-on-pattern-glow), 0 1px 0 var(--color-on-pattern-glow), 0 0 14px var(--color-on-pattern-glow), 0 0 26px var(--color-on-pattern-glow)",
} as const

const onBgLineStyle = {
  background: "var(--color-ink-accent)",
} as const

const dividerLineStyle = {
  background: "linear-gradient(to right, transparent, var(--color-motif-medium), transparent)",
} as const

const cardStyle = {
  background: PAPER,
  boxShadow:
    "0 26px 56px -30px color-mix(in srgb, var(--color-welcome-navy) 55%, transparent), inset 0 1px 0 rgb(255 255 255 / 80%)",
} as const

const CORNER_DECO_CLASS =
  "block h-auto w-auto max-w-[92px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[320px] select-none opacity-90"

const palette = {
  body: BODY,
  heading: NAVY,
  label: ACCENT,
  accent: ACCENT,
} as const

function DecoImg({ src, className }: { src: string; className: string }) {
  return <TintedDeco src={src} className={className} />
}

function OutsideDivider() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="h-px w-10 sm:w-16" style={{ background: "var(--color-ink-accent)" }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--color-ink-accent)" }} aria-hidden />
      <span className="h-px w-10 sm:w-16" style={{ background: "var(--color-ink-accent)" }} />
    </div>
  )
}

const SECTION_TITLE_CLASS = `${theSeasons.className} text-[0.74rem] sm:text-[0.88rem] md:text-[1rem] tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em] uppercase leading-tight`

const nameStyle: React.CSSProperties = {
  fontSize: "clamp(0.7rem, min(2.3vw, 5.4cqi), 1.1rem)",
  lineHeight: 1.25,
  letterSpacing: "0.02em",
}

const roleTitleStyle: React.CSSProperties = {
  fontSize: "clamp(0.58rem, min(1.75vw, 4cqi), 0.78rem)",
  lineHeight: 1.1,
}

const ROMAN_NUMERAL = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)$/i
const SPECIAL_GLYPH = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|&|\+|[.’'`´-]|—|–)$/i
const SPECIAL_SPLIT = /(\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\b|&|\+|[.’'`´-]|—|–)/g
const DASH_GLYPH = /^[-—–]$/
const PLUS_GLYPH = /^\+$/

function toDisplayName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          if (!part) return part
          if (ROMAN_NUMERAL.test(part)) return part.toUpperCase()
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join("-"),
    )
    .join(" ")
}

function MixedFontText({
  text,
  specialClassName,
}: {
  text: string
  specialClassName: string
}) {
  const parts = text.split(new RegExp(SPECIAL_SPLIT.source, "g"))
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null
        if (DASH_GLYPH.test(part)) {
          return (
            <span
              key={`${part}-${index}`}
              className="font-normal not-italic tracking-normal"
              style={{ fontFamily: '"SortsMillGoudy", Georgia, "Times New Roman", serif' }}
            >
              {part}
            </span>
          )
        }
        if (PLUS_GLYPH.test(part)) {
          return (
            <span
              key={`${part}-${index}`}
              className="relative -top-[0.08em] mx-[0.1em] inline-block font-normal not-italic tracking-normal"
              style={{
                fontFamily: '"SortsMillGoudy", Georgia, "Times New Roman", serif',
                fontSize: "0.95em",
              }}
              aria-label="of blessed memory"
            >
              †
            </span>
          )
        }
        if (SPECIAL_GLYPH.test(part)) {
          return (
            <span key={`${part}-${index}`} className={specialClassName}>
              {part}
            </span>
          )
        }
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      })}
    </>
  )
}

function CouplePromiseMark({ kicker, line }: { kicker: string; line: string }) {
  return (
    <div className="-mt-2 mb-3 text-center sm:-mt-4 sm:mb-5 md:-mt-5 md:mb-6">
      <p
        className={`${cinzel.className} text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:text-[0.75rem] sm:tracking-[0.24em] md:text-[0.8125rem] md:tracking-[0.28em]`}
        style={{ color: ACCENT }}
      >
        {kicker}
      </p>
      <p
        className={`font-goudy-italic mx-auto mt-1.5 max-w-[18rem] text-[0.875rem] sm:mt-2 sm:max-w-[20rem] sm:text-base`}
        style={{ color: BODY }}
      >
        {line}
      </p>
    </div>
  )
}

function EntourageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <h2
      className="welcome-title-lockup relative mx-auto w-full max-w-full text-center"
      style={
        {
          "--title-size": "clamp(1.65rem, min(7.4vw, 10cqi), 3.6rem)",
          "--script-size": "clamp(1rem, min(4vw, 5.8cqi), 2.25rem)",
        } as React.CSSProperties
      }
    >
      <span className="sr-only">{title} — {subtitle}</span>
      <span
        aria-hidden
        className={`${theSeasons.className} block uppercase leading-[0.9] tracking-[0.04em] min-[400px]:tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em]`}
        style={{
          fontSize: "var(--title-size)",
          ...onBg,
        }}
      >
        {title}
      </span>
      <span
        aria-hidden
        className={`${aboveTheBeyond.className} relative z-10 mx-auto mt-1.5 block w-fit max-w-full px-1 leading-[0.88] sm:mt-2 sm:leading-[0.9]`}
        style={{
          fontSize: "var(--script-size)",
          ...onBg,
        }}
      >
        {subtitle}
      </span>
    </h2>
  )
}


// ── Scroll reveals ──
const revealEase = [0.22, 1, 0.36, 1] as const
const REVEAL_VIEWPORT = { once: true, amount: 0.6, margin: "0px 0px -6% 0px" } as const

const titleReveal: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: revealEase } },
}

// Names drift in toward the centre line from their own column
const nameReveal: Variants = {
  hidden: (align: "left" | "right" | "center") => ({
    opacity: 0,
    x: align === "right" ? -18 : align === "left" ? 18 : 0,
    y: align === "center" ? 10 : 4,
  }),
  show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.75, ease: revealEase } },
}

const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
}

const headerRise: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: revealEase } },
}

const ornamentBloom: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -12 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
}

const lineDraw: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: 1, ease: revealEase } },
}

// The arch rises and unfolds from its crown. The clip lives on an inner layer: an element
// clipped to nothing never counts as "in view", so it can't be the one that is observed.
const archRise: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { duration: 1.4, ease: revealEase, opacity: { duration: 0.6 } } },
}

const archUnfold: Variants = {
  hidden: { clipPath: "inset(0% 0% 100% 0% round 50% 50% 0% 0%)" },
  show: {
    clipPath: "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
    transition: { duration: 1.4, ease: revealEase },
    // A finished inset clip would still cut off the card's drop shadow
    transitionEnd: { clipPath: "none" },
  },
}

// Divider between groups: draws out from a small diamond in the middle
function GroupDivider() {
  return (
    <motion.div
      className="relative flex w-full max-w-md items-center justify-center"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 1 }}
    >
      <motion.div className="h-px w-full" style={dividerLineStyle} variants={lineDraw} />
      <motion.span
        className="absolute h-1.5 w-1.5 rotate-45"
        style={{ background: "var(--color-motif-medium)" }}
        variants={{
          hidden: { scale: 0, rotate: 45 },
          show: { scale: [0, 1.6, 1], rotate: 225, transition: { duration: 0.9, delay: 0.35, ease: revealEase } },
        }}
        aria-hidden
      />
    </motion.div>
  )
}

// Category label overrides from site.ts, shared with the hoisted helpers below
const HeadingLabelsContext = createContext<Record<string, string>>({})

// Elegant section titles (category labels)
function SectionTitle({
  children,
  align = "center",
  className = "",
}: {
  children: React.ReactNode
  align?: "left" | "center" | "right"
  className?: string
}) {
  const headingLabels = useContext(HeadingLabelsContext)
  const textAlign =
    align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center"
  return (
    <motion.h3
      className={`relative ${SECTION_TITLE_CLASS} mb-1 sm:mb-2 md:mb-2.5 ${textAlign} ${className}`}
      style={{ color: NAVY }}
      variants={titleReveal}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
    >
      {typeof children === "string" ? (
        <MixedFontText
          text={headingLabels[children] ?? children}
          specialClassName="font-goudy-italic normal-case tracking-normal"
        />
      ) : (
        children
      )}
      {/* Accent hairline that draws in under the heading, from its aligned edge */}
      <motion.span
        aria-hidden
        variants={lineDraw}
        className={`mt-1 block h-px w-10 sm:mt-1.5 sm:w-14 ${
          align === "right" ? "ml-auto origin-right" : align === "left" ? "mr-auto origin-left" : "mx-auto origin-center"
        }`}
        style={{
          background:
            align === "center"
              ? `linear-gradient(to right, transparent, ${ACCENT}, transparent)`
              : `linear-gradient(to ${align === "right" ? "left" : "right"}, ${ACCENT}, transparent)`,
        }}
      />
    </motion.h3>
  )
}

function NameItem({
  member,
  align = "center",
  showRole = true,
  featured = false,
}: {
  member: EntourageMember
  align?: "left" | "center" | "right"
  showRole?: boolean
  featured?: boolean
}) {
  const containerAlign =
    align === "right" ? "items-end" : align === "left" ? "items-start" : "items-center"
  const textAlign =
    align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center"
  const displayName = toDisplayName(member.name)
  const displayRole = member.roleTitle ? toDisplayName(member.roleTitle) : ""
  return (
    <motion.div
      className={`relative flex flex-col ${containerAlign} justify-center py-0.5 sm:py-1.5 min-w-0 w-full max-w-full group/item`}
      variants={nameReveal}
      custom={align}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-md"
        style={{ background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-motif-silver) 70%, transparent), transparent)" }}
      />
      <p
        className={`${theSeasons.className} relative ${textAlign} transition-all duration-300 max-w-full break-words`}
        style={{
          ...nameStyle,
          ...(featured
            ? {
                fontSize: "clamp(0.82rem, min(2.55vw, 6.1cqi), 1.24rem)",
              }
            : {}),
          color: NAVY,
        }}
        title={displayName.replace(/\+/g, "†")}
      >
        {displayName ? (
          <MixedFontText
            text={displayName}
            specialClassName="font-goudy-italic tracking-normal"
          />
        ) : null}
      </p>
      {showRole && displayRole && (
        <p
          className={`${theSeasons.className} relative mt-0.5 ${textAlign} max-w-full break-words`}
          style={{ ...roleTitleStyle, color: SCRIPT }}
          title={displayRole}
        >
          <MixedFontText
            text={displayRole}
            specialClassName="font-goudy-italic tracking-normal"
          />
        </p>
      )}
    </motion.div>
  )
}

function TwoColumnLayout({
  children,
  leftTitle,
  rightTitle,
  singleTitle,
  centerContent = false,
}: {
  children: React.ReactNode
  leftTitle?: string
  rightTitle?: string
  singleTitle?: string
  centerContent?: boolean
}) {
  if (singleTitle) {
    return (
      <div className="mb-1.5 sm:mb-2.5 md:mb-3">
        <SectionTitle>{singleTitle}</SectionTitle>
        <div
          className={`grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 gap-y-1 sm:gap-y-1.5 ${centerContent ? "max-w-3xl mx-auto" : ""}`}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-1.5 sm:mb-2.5 md:mb-3">
      <div className="grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 mb-2 sm:mb-2.5 md:mb-3">
        {leftTitle && (
          <SectionTitle align="right" className="pr-0.5 sm:pr-1">
            {leftTitle}
          </SectionTitle>
        )}
        {rightTitle && (
          <SectionTitle align="left" className="pl-0.5 sm:pl-1">
            {rightTitle}
          </SectionTitle>
        )}
      </div>
      <div
        className={`grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 gap-y-1 sm:gap-y-1.5 ${centerContent ? "max-w-3xl mx-auto" : ""}`}
      >
        {children}
      </div>
    </div>
  )
}

interface EntourageMember {
  name: string
  roleCategory: string
  roleTitle: string
  email: string
}

interface PrincipalSponsor {
  malePrincipalSponsor: string
  femalePrincipalSponsor: string
}

/** Accepts PascalCase from API / Sheets or camelCase */
function entourageMemberFromApi(row: Record<string, unknown>): EntourageMember {
  const r = row as Record<string, string | undefined>
  return {
    name: r.name ?? r.Name ?? "",
    roleCategory: r.roleCategory ?? r.RoleCategory ?? "",
    roleTitle: r.roleTitle ?? r.RoleTitle ?? "",
    email: r.email ?? r.Email ?? "",
  }
}

function firstSheetText(row: Record<string, string | undefined>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }
  return ""
}

function principalSponsorFromApi(row: Record<string, unknown>): PrincipalSponsor {
  const r = row as Record<string, string | undefined>
  return {
    malePrincipalSponsor: firstSheetText(r, [
      "malePrincipalSponsor",
      "MalePrincipalSponsor",
      "Male",
      "Ninong",
      "ninong",
    ]),
    femalePrincipalSponsor: firstSheetText(r, [
      "femalePrincipalSponsor",
      "FemalePrincipalSponsor",
      "Female",
      "Ninang",
      "ninang",
    ]),
  }
}

const ct = {
  label: sectionType.label,
  sectionTitle: `${sectionType.label} lg:text-base`,
  body: sectionType.text,
  bodyLg: sectionType.subheader,
} as const

const ROLE_CATEGORY_ORDER = [
  "OFFICIATING MINISTER",
  "The Couple",
  "Parents of the Groom",
  "Parents of the Bride",
  // Principal + Peer Sponsors render inside the Parents block above.
  // Secondary Sponsors block (see secondarySponsorGroups) — right after the Principal Sponsors
  "Candle Sponsors",
  "Candle Bearer",
  "Veil Sponsors",
  "Cord Sponsors",
  "Ribbon Sponsors",
  "Man of Honor",
  "Matron of Honor",
  "Best Man",
  "Maid of Honor",
  // Groomsmen | Bridesmaids side by side, each under its own title
  "Groomsmen",
  "Bridesmaids",
  "Bridesmen",
  "Family of the Groom",
  "Family of the Bride",
  "Little Groom",
  "Little Bride",
  "Little Tiny Groom",
  "Little Love Bearer",
  "Little Promise Bearer",
  // Side-by-side pairs (see PAIRED_COLUMN_SECTIONS)
  "Little Groomsmen",
  "Little Bridesmaids",
  // Ring | Coin side by side, Bible centered below (see BEARER_BLOCK_CATEGORIES)
  "Ring Bearer",
  "Coin Bearer",
  "Bible Bearer",
  "Flower Ladies",
  "Escorts",
  "Petal Maidens",
]

const BEARER_BLOCK_CATEGORIES = ["Ring Bearer", "Coin Bearer", "Bible Bearer"] as const

// Two categories shown as left | right columns under their own titles
const PAIRED_COLUMN_SECTIONS: { key: string; left: string; right: string }[] = [
  { key: "LittleGroomsmenBridesmaids", left: "Little Groomsmen", right: "Little Bridesmaids" },
]

// Secondary sponsor groups whose names are split into two columns
const TWO_COLUMN_SECONDARY_GROUPS = new Set(["Little Love Bearer", "Candle Bearer", "Cord Sponsors", "Veil Sponsors"])

// Always split into left | right columns, even with only two names
const TWO_COLUMN_SECTIONS = new Set(["Bridesmen", "Escorts", "Petal Maidens"])

const SINGLE_COLUMN_SECTIONS = new Set([
  "Best Man",
  "Maid of Honor",
  "Ring Bearer",
  "Coin Bearer",
  "Bible Bearer",
  "Flower Girls",
  "Presider",
])

const HONOR_ATTENDANT_BLOCK_CATEGORIES = [
  "Man of Honor",
  "Matron of Honor",
  "Best Man",
  "Maid of Honor",
] as const

function normalizeRoleCategory(category: string): string {
  const normalized = category.trim()
  if (normalized.toLowerCase() === "officiating minister") {
    return "OFFICIATING MINISTER"
  }
  const honorAliases: Record<string, string> = {
    "man of honor": "Man of Honor",
    "best man": "Best Man",
    "maid of honor": "Maid of Honor",
    "matron of honor": "Matron of Honor",
  }
  const alias = honorAliases[normalized.toLowerCase()]
  if (alias) return alias
  if (/^little love bearers?$/i.test(normalized)) return "Little Love Bearer"
  if (/^candle bearers?$/i.test(normalized)) return "Candle Bearer"
  if (/^ch?ord sponsors?$/i.test(normalized)) return "Cord Sponsors"
  if (normalized.toLowerCase() === "peer sponsors") {
    return "Peer Sponsors"
  }
  if (
    normalized.toLowerCase() === "flower ladies" ||
    normalized.toLowerCase() === "flower girls"
  ) {
    return "Flower Ladies"
  }
  return normalized
}

function isCoupleMember(member: EntourageMember): boolean {
  return normalizeRoleCategory(member.roleCategory) === "The Couple"
}

// Father first, then mother — same order for the groom's and the bride's parents
function sortParents(members: EntourageMember[]): EntourageMember[] {
  return [...members].sort((a, b) => {
    const aIsFather = a.roleTitle?.toLowerCase().includes("father") ?? false
    const bIsFather = b.roleTitle?.toLowerCase().includes("father") ?? false
    if (aIsFather && !bIsFather) return -1
    if (!aIsFather && bIsFather) return 1
    return 0
  })
}

function toEntourageMembers(data: Record<string, unknown>[]): EntourageMember[] {
  return data
    .map((row) => entourageMemberFromApi(row))
    .filter((member) => member.name.trim())
    .filter((member) => !isCoupleMember(member))
}

function toPrincipalSponsors(data: Record<string, unknown>[]): PrincipalSponsor[] {
  return data
    .map((row) => principalSponsorFromApi(row))
    .filter((sponsor) => sponsor.malePrincipalSponsor.trim() || sponsor.femalePrincipalSponsor.trim())
}

async function loadEntourageFromApi(signal?: AbortSignal, reload = false): Promise<EntourageMember[]> {
  const data = await fetchInvitationList<Record<string, unknown>>("/api/entourage", { signal, reload })
  return toEntourageMembers(data)
}

export type SponsorsList = "one" | "two"

function sponsorsUrl(list?: SponsorsList) {
  return list ? `/api/principal-sponsor?list=${list}` : "/api/principal-sponsor"
}

async function loadSponsorsFromApi(url: string, signal?: AbortSignal, reload = false): Promise<PrincipalSponsor[]> {
  // Sponsors are optional — never block the entourage on them
  try {
    const data = await fetchInvitationList<Record<string, unknown>>(url, { signal, reload })
    return toPrincipalSponsors(data)
  } catch (error) {
    if (isAbortError(error)) throw error
    console.warn("Failed to load principal sponsors:", error)
    return []
  }
}

function readCachedParty(sponsorsPath: string) {
  const members = readCachedInvitationList<Record<string, unknown>>("/api/entourage")
  const sponsors = readCachedInvitationList<Record<string, unknown>>(sponsorsPath)
  return {
    members: members ? toEntourageMembers(members) : [],
    sponsors: sponsors ? toPrincipalSponsors(sponsors) : [],
  }
}

export function Entourage({ sponsorsList }: { sponsorsList?: SponsorsList } = {}) {
  const sponsorsPath = sponsorsUrl(sponsorsList)
  const siteConfig = useSiteConfig()
  const content = siteConfig.entourage
  const { decos } = content
  const groomName = siteConfig.couple.groom
  const brideName = siteConfig.couple.bride
  const [entourage, setEntourage] = useState<EntourageMember[]>([])
  const [sponsors, setSponsors] = useState<PrincipalSponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] })
  const topDecoY = useTransform(scrollYProgress, [0, 1], [-30, 70])
  const bottomDecoY = useTransform(scrollYProgress, [0, 1], [60, -30])

  const loadParty = async (signal?: AbortSignal, { reload = false } = {}) => {
    const cached = readCachedParty(sponsorsPath)
    const hasCached = cached.members.length > 0
    if (hasCached) {
      // Show the last known list right away; refresh quietly in the background
      setEntourage(cached.members)
      setSponsors(cached.sponsors)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
    setError(null)
    setIsRetrying(false)

    try {
      const [members, sponsorList] = await Promise.all([
        fetchUntilReady({
          signal,
          load: (s) => loadEntourageFromApi(s, reload),
          isReady: (list) => list.length > 0,
          maxAttempts: 4,
          maxDelayMs: 3000,
          onRetry: () => setIsRetrying(true),
        }),
        loadSponsorsFromApi(sponsorsPath, signal, reload),
      ])
      if (signal?.aborted) return
      setEntourage(members)
      setSponsors(sponsorList)
      setError(null)
    } catch (err: unknown) {
      if (isAbortError(err)) return
      console.error("Failed to load entourage:", err)
      if (!hasCached) setError("Unable to load entourage")
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
        setIsRetrying(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadParty(controller.signal)

    let updateTimer: ReturnType<typeof setTimeout> | undefined
    const handleEntourageUpdate = () => {
      clearTimeout(updateTimer)
      updateTimer = setTimeout(() => {
        void loadParty(controller.signal, { reload: true })
      }, 1000)
    }

    window.addEventListener("entourageUpdated", handleEntourageUpdate)

    return () => {
      controller.abort()
      clearTimeout(updateTimer)
      window.removeEventListener("entourageUpdated", handleEntourageUpdate)
    }
  }, [])

  // Group entourage by role category
  const grouped = useMemo(() => {
    const grouped: Record<string, EntourageMember[]> = {}
    
    entourage.forEach((member) => {
      const category = normalizeRoleCategory(member.roleCategory)

      if (!category || category === "Other") {
        return
      }
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(member)
    })
    
    return grouped
  }, [entourage])

  const hasParents =
    (grouped["Parents of the Groom"]?.length ?? 0) > 0 || (grouped["Parents of the Bride"]?.length ?? 0) > 0

  // Rows of left | right names (right-aligned left column, left-aligned right column)
  const renderPairRows = (keyPrefix: string, left: EntourageMember[], right: EntourageMember[]) => {
    const maxLen = Math.max(left.length, right.length)
    const rows = []
    for (let i = 0; i < maxLen; i++) {
      const l = left[i]
      const r = right[i]
      rows.push(
        <React.Fragment key={`${keyPrefix}-row-${i}`}>
          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
            {l ? <NameItem member={l} align="right" /> : <div className="py-0.5" />}
          </div>
          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
            {r ? <NameItem member={r} align="left" /> : <div className="py-0.5" />}
          </div>
        </React.Fragment>
      )
    }
    return rows
  }

  return (
    <MotionConfig reducedMotion="user">
    <HeadingLabelsContext.Provider value={content.headingLabels}>
    <div
      ref={sectionRef}
      className={`${theSeasons.variable} ${aboveTheBeyond.variable} relative w-full overflow-hidden`}
      style={{ background: sectionBg }}
    >
      {/* Same circle pattern as the hero */}
      <PlainBubbles />
      <Section
        id="entourage"
        className="relative z-10 overflow-hidden pt-5 pb-5 sm:pt-10 sm:pb-10 md:pt-12 md:pb-12 lg:pt-14 lg:pb-14"
      >
        {/* Corner decorations (from site.ts) */}
        <motion.div className="pointer-events-none absolute left-0 top-0 z-10" style={{ y: topDecoY }}>
          <DecoImg src={decos.topLeft} className={CORNER_DECO_CLASS} />
        </motion.div>
        <motion.div className="pointer-events-none absolute right-0 top-0 z-10" style={{ y: topDecoY }}>
          <DecoImg src={decos.topRight} className={CORNER_DECO_CLASS} />
        </motion.div>
        <motion.div className="pointer-events-none absolute bottom-0 left-0 z-10" style={{ y: bottomDecoY }}>
          <DecoImg src={decos.bottomLeft} className={CORNER_DECO_CLASS} />
        </motion.div>
        <motion.div className="pointer-events-none absolute bottom-0 right-0 z-10" style={{ y: bottomDecoY }}>
          <DecoImg src={decos.bottomRight} className={CORNER_DECO_CLASS} />
        </motion.div>

      <motion.div
        className="relative z-20 mx-auto mb-5 max-w-5xl px-3 text-center @container/entourage sm:mb-10 sm:px-4 md:mb-12"
        variants={headerStagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.div variants={ornamentBloom}>
          <DecoImg
            src={decos.headerOrnament}
            className="mx-auto mb-2 block h-auto w-20 select-none sm:mb-4 sm:w-36 md:w-44"
          />
        </motion.div>
        <motion.div className="mx-auto mb-2.5 sm:mb-5 md:mb-6" variants={lineDraw}>
          <OutsideDivider />
        </motion.div>
        <motion.p
          variants={headerRise}
          className={`${cinzel.className} mx-auto max-w-[20rem] px-2 text-[0.75rem] font-semibold leading-snug tracking-[0.12em] min-[400px]:max-w-none min-[400px]:text-[0.8125rem] min-[400px]:tracking-[0.16em] sm:text-[0.9375rem] sm:tracking-[0.2em] md:text-base md:tracking-[0.22em]`}
          style={onBg}
        >
          {content.eyebrow}
        </motion.p>
        <motion.div className="mx-auto mt-2 sm:mt-4 md:mt-5" variants={headerRise}>
          <EntourageTitle title={content.title} subtitle={content.subtitle} />
        </motion.div>

        <motion.p
          variants={headerRise}
          className="font-goudy-italic mx-auto mt-2.5 max-w-xl px-2 text-[0.9375rem] leading-snug sm:mt-5 sm:text-[1.125rem] sm:leading-relaxed md:mt-6"
          style={{ ...onBg, fontWeight: 600 }}
        >
          {content.description}
        </motion.p>

        <div className="mt-3 flex items-center justify-center sm:mt-5">
          <motion.span
            className="h-px w-16 sm:w-24 md:w-32"
            style={onBgLineStyle}
            variants={lineDraw}
          />
        </div>
      </motion.div>

      <div
        className="relative z-20 mx-auto max-w-3xl px-2.5 pb-1 sm:max-w-4xl sm:px-6 md:px-8 @container/entourage-card"
      >
        <motion.div
          className="relative"
          variants={archRise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
        >
          <motion.div variants={archUnfold}>
          <div
            className="relative z-20 overflow-hidden rounded-t-full"
            style={cardStyle}
          >
            <motion.div
              className="pointer-events-none absolute inset-2 z-30 rounded-t-full sm:inset-4 md:inset-5"
              style={{ border: `1px solid ${HAIRLINE}` }}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 1.6, delay: 0.5, ease: revealEase }}
              aria-hidden
            />
            {/* One-time sheen across the arch crown */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[40%] rounded-t-full"
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 55%) 50%, transparent 65%)",
                backgroundSize: "250% 100%",
              }}
              initial={{ backgroundPosition: "130% 0%", opacity: 0 }}
              whileInView={{ backgroundPosition: "-30% 0%", opacity: [0, 1, 1, 0] }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 2.2, delay: 1.1, ease: "easeInOut" }}
              aria-hidden
            />

            <div className="relative z-20 px-3 pb-7 pt-[18%] sm:px-8 sm:pt-[22%] sm:pb-12 md:px-12 md:pb-14 lg:px-14">
            {isLoading ? (
              <div className="flex items-center justify-center py-24 sm:py-28 md:py-32">
                <div className="text-center">
                  <p className={`font-goudy-italic ${ct.body}`} style={{ color: palette.body }}>
                    {isRetrying ? content.retryingText : content.loadingText}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-24 sm:py-28 md:py-32">
                <div className="text-center">
                  <p className={`font-goudy-italic ${ct.bodyLg} mb-3`} style={{ color: palette.body }}>
                    {content.errorText}
                  </p>
                  <button
                    onClick={() => void loadParty(undefined, { reload: true })}
                    className={`${cinzel.className} ${ct.body} underline transition-colors duration-200 hover:opacity-80`}
                    style={{ color: palette.accent }}
                  >
                    {content.retryText}
                  </button>
                </div>
              </div>
            ) : (
            <>
              <CouplePromiseMark kicker={content.coupleKicker} line={content.coupleLine} />
              <div className="mb-1.5 sm:mb-2.5 md:mb-3">
                <SectionTitle>{content.coupleHeading}</SectionTitle>
                <div className="grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 gap-y-1 sm:gap-y-1.5">
                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0">
                    <NameItem
                      member={{
                        name: groomName,
                        roleCategory: "The Couple",
                        roleTitle: content.groomRole,
                        email: "",
                      }}
                      align="right"
                      featured
                    />
                  </div>
                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0">
                    <NameItem
                      member={{
                        name: brideName,
                        roleCategory: "The Couple",
                        roleTitle: content.brideRole,
                        email: "",
                      }}
                      align="left"
                      featured
                    />
                  </div>
                </div>
              </div>
              {ROLE_CATEGORY_ORDER.map((category, categoryIndex) => {
                const members = grouped[category] || []
                const bridalPartyHasMembers =
                  (grouped["Groomsmen"]?.length ?? 0) > 0 ||
                  (grouped["Bridesmaids"]?.length ?? 0) > 0

                if (category === "The Couple") return null
                
                const peerSponsorCount = grouped["Peer Sponsors"]?.length ?? 0
                const officiatingCount = grouped["OFFICIATING MINISTER"]?.length ?? 0
                const parentsBlockNeeded =
                  category === "Parents of the Groom" &&
                  (sponsors.length > 0 ||
                    peerSponsorCount > 0 ||
                    officiatingCount > 0 ||
                    hasParents)

                if (
                  members.length === 0 &&
                  !(category === "Groomsmen" && bridalPartyHasMembers) &&
                  !parentsBlockNeeded
                ) {
                  return null
                }
                if (category === "Peer Sponsors") return null

                const parentsAnchorActive =
                  hasParents ||
                  sponsors.length > 0 ||
                  peerSponsorCount > 0 ||
                  officiatingCount > 0

                // Render OFFICIATING MINISTER in the anchor block when that block runs
                if (category === "OFFICIATING MINISTER" && parentsAnchorActive) return null

                // Special handling for Parents sections - combine into single two-column layout
                if (category === "Parents of the Bride" || category === "Parents of the Groom") {
                  const parentsBride = grouped["Parents of the Bride"] || []
                  const parentsGroom = grouped["Parents of the Groom"] || []
                  const hasGroomParents = parentsGroom.length > 0
                  const hasBrideParents = parentsBride.length > 0

                  if (category === "Parents of the Groom") {
                    return (
                      <div key="Parents">
                        {categoryIndex > 0 && (
                          <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                            <GroupDivider />
                          </div>
                        )}
                        {hasGroomParents && hasBrideParents && (
                          <TwoColumnLayout leftTitle="Parents of the Groom" rightTitle="Parents of the Bride">
                            {(() => {
                              const leftArr = sortParents(parentsGroom)
                              const rightArr = sortParents(parentsBride)
                              const maxLen = Math.max(leftArr.length, rightArr.length)
                              const rows = []
                              for (let i = 0; i < maxLen; i++) {
                                const left = leftArr[i]
                                const right = rightArr[i]
                                rows.push(
                                  <React.Fragment key={`parents-row-${i}`}>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {left ? (
                                        <NameItem member={left} align="right" showRole={false} />
                                      ) : (
                                        <div className="py-0.5" />
                                      )}
                                    </div>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {right ? (
                                        <NameItem member={right} align="left" showRole={false} />
                                      ) : (
                                        <div className="py-0.5" />
                                      )}
                                    </div>
                                  </React.Fragment>
                                )
                              }
                              return rows
                            })()}
                          </TwoColumnLayout>
                        )}
                        {hasGroomParents && !hasBrideParents && (
                          <TwoColumnLayout singleTitle="Parents of the Groom" centerContent={true}>
                            {sortParents(parentsGroom).map((member, idx) => (
                              <div
                                key={`parent-groom-only-${idx}-${member.name}`}
                                className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1"
                              >
                                <NameItem member={member} align="center" showRole={false} />
                              </div>
                            ))}
                          </TwoColumnLayout>
                        )}
                        {!hasGroomParents && hasBrideParents && (
                          <TwoColumnLayout singleTitle="Parents of the Bride" centerContent={true}>
                            {sortParents(parentsBride).map((member, idx) => (
                              <div
                                key={`parent-bride-only-${idx}-${member.name}`}
                                className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1"
                              >
                                <NameItem member={member} align="center" showRole={false} />
                              </div>
                            ))}
                          </TwoColumnLayout>
                        )}

                        {/* Officiating Minister section - displayed above Principal Sponsors */}
                        {(() => {
                          const officiating = grouped["OFFICIATING MINISTER"] || []
                          if (officiating.length === 0) return null
                          return (
                            <div key="OfficiatingMinisterBeforeSponsors" className="mt-3 sm:mt-5 md:mt-6">
                              <TwoColumnLayout singleTitle="OFFICIATING MINISTER" centerContent={true}>
                                {officiating.map((member, idx) => (
                                  <div
                                    key={`officiating-${idx}-${member.name}`}
                                    className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1"
                                  >
                                    <NameItem member={member} align="center" showRole={false} />
                                  </div>
                                ))}
                              </TwoColumnLayout>
                            </div>
                          )
                        })()}

                        {sponsors.length > 0 && (
                          <div key="SponsorsAfterParents">
                            <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3" />
                            <TwoColumnLayout singleTitle="Principal Sponsors" centerContent={true}>
                              {sponsors.map((sponsor, idx) => (
                                <React.Fragment key={`sponsor-row-${idx}`}>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {sponsor.malePrincipalSponsor ? (
                                      <NameItem
                                        member={{
                                          name: sponsor.malePrincipalSponsor,
                                          roleCategory: "",
                                          roleTitle: "",
                                          email: "",
                                        }}
                                        align="right"
                                        showRole={false}
                                      />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {sponsor.femalePrincipalSponsor ? (
                                      <NameItem
                                        member={{
                                          name: sponsor.femalePrincipalSponsor,
                                          roleCategory: "",
                                          roleTitle: "",
                                          email: "",
                                        }}
                                        align="left"
                                        showRole={false}
                                      />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                </React.Fragment>
                              ))}
                            </TwoColumnLayout>
                          </div>
                        )}

                        {(() => {
                          const peerSponsors = grouped["Peer Sponsors"] || []
                          if (peerSponsors.length === 0) return null
                          return (
                            <div key="PeerSponsorsAfterPrincipal">
                              <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3" />
                              <TwoColumnLayout singleTitle="Peer Sponsors" centerContent={true}>
                                {peerSponsors.length === 2 ? (
                                  <>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={peerSponsors[0]} align="right" showRole={false} />
                                    </div>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={peerSponsors[1]} align="left" showRole={false} />
                                    </div>
                                  </>
                                ) : peerSponsors.length <= 2 ? (
                                  <div className="col-span-full">
                                    <div className="max-w-sm mx-auto flex flex-col items-center gap-0.5 sm:gap-1 md:gap-1">
                                      {peerSponsors.map((member, idx) => (
                                        <NameItem
                                          key={`peer-sponsor-${idx}-${member.name}`}
                                          member={member}
                                          align="center"
                                          showRole={false}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  (() => {
                                    const half = Math.ceil(peerSponsors.length / 2)
                                    const left = peerSponsors.slice(0, half)
                                    const right = peerSponsors.slice(half)
                                    const maxLen = Math.max(left.length, right.length)
                                    const rows = []
                                    for (let i = 0; i < maxLen; i++) {
                                      const l = left[i]
                                      const r = right[i]
                                      rows.push(
                                        <React.Fragment key={`peer-sponsor-row-${i}`}>
                                          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                            {l ? (
                                              <NameItem member={l} align="right" showRole={false} />
                                            ) : (
                                              <div className="py-0.5 sm:py-1 md:py-1.5" />
                                            )}
                                          </div>
                                          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                            {r ? (
                                              <NameItem member={r} align="left" showRole={false} />
                                            ) : (
                                              <div className="py-0.5 sm:py-1 md:py-1.5" />
                                            )}
                                          </div>
                                        </React.Fragment>
                                      )
                                    }
                                    return rows
                                  })()
                                )}
                              </TwoColumnLayout>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }
                  // Skip rendering for "Parents of the Bride" since it's already rendered above
                  return null
                }

                // Special handling for Family of the Groom/Bride - combine into single two-column layout
                if (category === "Family of the Groom" || category === "Family of the Bride") {
                  const familyGroom = grouped["Family of the Groom"] || []
                  const familyBride = grouped["Family of the Bride"] || []

                  if (category === "Family of the Groom") {
                    return (
                      <div key="Family">
                        {categoryIndex > 0 && (
                          <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                            <GroupDivider />
                          </div>
                        )}
                        <TwoColumnLayout leftTitle="Family of the Groom" rightTitle="Family of the Bride">
                          {(() => {
                            const maxLen = Math.max(familyGroom.length, familyBride.length)
                            const rows = []
                            for (let i = 0; i < maxLen; i++) {
                              const left = familyGroom[i]
                              const right = familyBride[i]
                              rows.push(
                                <React.Fragment key={`family-row-${i}`}>
                                  <div key={`family-groom-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {left ? <NameItem member={left} align="right" /> : <div className="py-0.5" />}
                                  </div>
                                  <div key={`family-bride-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {right ? <NameItem member={right} align="left" /> : <div className="py-0.5" />}
                                  </div>
                                </React.Fragment>
                              )
                            }
                            return rows
                          })()}
                        </TwoColumnLayout>
                      </div>
                    )
                  }

                  return null
                }

                // Man of Honor, Maid/Matron of Honor, and Best Man — Man of Honor above Best Men
                if (
                  category === "Man of Honor" ||
                  category === "Matron of Honor" ||
                  category === "Maid of Honor" ||
                  category === "Best Man"
                ) {
                  const manOfHonor = grouped["Man of Honor"] || []
                  const matronOfHonor = grouped["Matron of Honor"] || []
                  const maidOfHonor = grouped["Maid of Honor"] || []
                  const bestMan = grouped["Best Man"] || []

                  const firstHonorCategory = HONOR_ATTENDANT_BLOCK_CATEGORIES.find(
                    (honorCategory) => (grouped[honorCategory]?.length ?? 0) > 0
                  )
                  if (category !== firstHonorCategory) return null

                  const hasSideHonors = bestMan.length > 0 || maidOfHonor.length > 0
                  const hasMatron = matronOfHonor.length > 0

                  return (
                    <div key="HonorAttendants">
                      {categoryIndex > 0 && (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}

                      {manOfHonor.length > 0 && (
                        <TwoColumnLayout singleTitle="Man of Honor" centerContent={true}>
                          {manOfHonor.map((member, idx) => (
                            <div
                              key={`man-of-honor-${idx}-${member.name}`}
                              className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1"
                            >
                              <NameItem member={member} align="center" />
                            </div>
                          ))}
                        </TwoColumnLayout>
                      )}

                      {manOfHonor.length > 0 && (hasSideHonors || hasMatron) && (
                        <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}

                      {hasSideHonors && (
                        <TwoColumnLayout leftTitle="Best Man" rightTitle="Maid of Honor">
                          {(() => {
                            const maxLen = Math.max(bestMan.length, maidOfHonor.length)
                            const rows = []
                            for (let i = 0; i < maxLen; i++) {
                              const left = bestMan[i]
                              const right = maidOfHonor[i]
                              rows.push(
                                <React.Fragment key={`honor-row-${i}`}>
                                  <div
                                    key={`bestman-cell-${i}`}
                                    className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden"
                                  >
                                    {left ? (
                                      <NameItem member={left} align="right" />
                                    ) : (
                                      <div className="py-0.5" />
                                    )}
                                  </div>
                                  <div
                                    key={`maid-cell-${i}`}
                                    className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden"
                                  >
                                    {right ? (
                                      <NameItem member={right} align="left" />
                                    ) : (
                                      <div className="py-0.5" />
                                    )}
                                  </div>
                                </React.Fragment>
                              )
                            }
                            return rows
                          })()}
                        </TwoColumnLayout>
                      )}

                      {hasSideHonors && hasMatron && (
                        <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}

                      {hasMatron && (
                        <TwoColumnLayout singleTitle="Matron of Honor" centerContent={true}>
                          {matronOfHonor.map((member, idx) => (
                            <div
                              key={`matron-of-honor-${idx}-${member.name}`}
                              className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1"
                            >
                              <NameItem member={member} align="center" showRole={false} />
                            </div>
                          ))}
                        </TwoColumnLayout>
                      )}
                    </div>
                  )
                }

                // Ring Bearer | Coin Bearer side by side, Bible Bearer centered below
                if ((BEARER_BLOCK_CATEGORIES as readonly string[]).includes(category)) {
                  const firstBearer = BEARER_BLOCK_CATEGORIES.find((c) => (grouped[c]?.length ?? 0) > 0)
                  if (category !== firstBearer) return null
                  const ringBearer = grouped["Ring Bearer"] || []
                  const coinBearer = grouped["Coin Bearer"] || []
                  const bibleBearer = grouped["Bible Bearer"] || []
                  const hasSidePair = ringBearer.length > 0 || coinBearer.length > 0

                  return (
                    <div key="BearerBlock">
                      {categoryIndex > 0 && (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}
                      {hasSidePair && (
                        <TwoColumnLayout
                          leftTitle={ringBearer.length > 0 ? "Ring Bearer" : undefined}
                          rightTitle={coinBearer.length > 0 ? "Coin Bearer" : undefined}
                        >
                          {renderPairRows("bearer", ringBearer, coinBearer)}
                        </TwoColumnLayout>
                      )}
                      {bibleBearer.length > 0 && (
                        <TwoColumnLayout singleTitle="Bible Bearer" centerContent={true}>
                          <div className="col-span-full">
                            <div className="flex flex-col items-center gap-5 sm:gap-6">
                              {bibleBearer.map((member, idx) => (
                                <NameItem key={`bible-bearer-${idx}-${member.name}`} member={member} align="center" />
                              ))}
                            </div>
                          </div>
                        </TwoColumnLayout>
                      )}
                    </div>
                  )
                }

                // Two categories side by side (e.g. Little Tiny Groom | Little Promise Bearer)
                const pairedSection = PAIRED_COLUMN_SECTIONS.find(
                  (pair) => pair.left === category || pair.right === category
                )
                if (pairedSection) {
                  const leftMembers = grouped[pairedSection.left] || []
                  const rightMembers = grouped[pairedSection.right] || []
                  const firstPresent = [pairedSection.left, pairedSection.right].find(
                    (c) => (grouped[c]?.length ?? 0) > 0
                  )
                  if (category !== firstPresent) return null

                  return (
                    <div key={pairedSection.key}>
                      {categoryIndex > 0 && (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}
                      <TwoColumnLayout
                        leftTitle={leftMembers.length > 0 ? pairedSection.left : undefined}
                        rightTitle={rightMembers.length > 0 ? pairedSection.right : undefined}
                      >
                        {renderPairRows(pairedSection.key, leftMembers, rightMembers)}
                      </TwoColumnLayout>
                    </div>
                  )
                }

                // Special handling for Little Groom and Little Bride - combine into single two-column layout
                if (category === "Little Groom" || category === "Little Bride") {
                  // Get both little ones groups
                  const littleGroom = grouped["Little Groom"] || []
                  const littleBride = grouped["Little Bride"] || []
                  
                  // Only render once (when processing "Little Groom")
                  if (category === "Little Groom") {
                    return (
                      <div key="LittleOnes">
                        {categoryIndex > 0 && (
                          <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                            <GroupDivider />
                          </div>
                        )}
                        <TwoColumnLayout leftTitle="Little Groom" rightTitle="Little Bride">
                          {(() => {
                            const maxLen = Math.max(littleGroom.length, littleBride.length)
                            const rows = []
                            for (let i = 0; i < maxLen; i++) {
                              const left = littleGroom[i]
                              const right = littleBride[i]
                              rows.push(
                                <React.Fragment key={`little-row-${i}`}>
                                  <div key={`littlegroom-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {left ? <NameItem member={left} align="right" /> : <div className="py-0.5" />}
                                  </div>
                                  <div key={`littlebride-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {right ? <NameItem member={right} align="left" /> : <div className="py-0.5" />}
                                  </div>
                                </React.Fragment>
                              )
                            }
                            return rows
                          })()}
                        </TwoColumnLayout>
                      </div>
                    )
                  }
                  // Skip rendering for "Little Bride" since it's already rendered above
                  return null
                }

                if (category === "Flower Ladies") {
                  if (members.length === 0) return null

                  return (
                    <div key="FlowerLadies">
                      {categoryIndex > 0 && (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}
                      <TwoColumnLayout singleTitle="Flower Girls" centerContent={true}>
                        {members.length === 2 ? (
                          <>
                            <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                              <NameItem member={members[0]} align="right" />
                            </div>
                            <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                              <NameItem member={members[1]} align="left" />
                            </div>
                          </>
                        ) : (
                          (() => {
                            const half = Math.ceil(members.length / 2)
                            const left = members.slice(0, half)
                            const right = members.slice(half)
                            const maxLen = Math.max(left.length, right.length)
                            const rows = []
                            for (let i = 0; i < maxLen; i++) {
                              const l = left[i]
                              const r = right[i]
                              rows.push(
                                <React.Fragment key={`flower-lady-row-${i}`}>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {l ? (
                                      <NameItem member={l} align="right" />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {r ? (
                                      <NameItem member={r} align="left" />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                </React.Fragment>
                              )
                            }
                            return rows
                          })()
                        )}
                      </TwoColumnLayout>
                    </div>
                  )
                }

                // Special handling for Bridesmaids and Groomsmen - combine into single two-column layout
                if (category === "Bridesmaids" || category === "Groomsmen") {
                  // Get both bridal party groups
                  const bridesmaids = grouped["Bridesmaids"] || []
                  const groomsmen = grouped["Groomsmen"] || []
                  
                  // Only render once (when processing "Groomsmen")
                  if (category === "Groomsmen") {
                    return (
                      <React.Fragment key="BridalPartySection">
                        {/* Groomsmen/Bridesmaids section */}
                        <div key="BridalParty">
                          {categoryIndex > 0 && (
                            <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                              <GroupDivider />
                            </div>
                          )}
                          <TwoColumnLayout
                            leftTitle={groomsmen.length > 0 ? "Groomsmen" : undefined}
                            rightTitle={bridesmaids.length > 0 ? "Bridesmaids" : undefined}
                          >
                            {(() => {
                              const maxLen = Math.max(bridesmaids.length, groomsmen.length)
                              const rows = []
                              for (let i = 0; i < maxLen; i++) {
                                const groomsman = groomsmen[i]
                                const bridesmaid = bridesmaids[i]
                                rows.push(
                                  <React.Fragment key={`bridal-row-${i}`}>
                                    <div key={`groomsman-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {groomsman ? <NameItem member={groomsman} align="right" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                    </div>
                                    <div key={`bridesmaid-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {bridesmaid ? <NameItem member={bridesmaid} align="left" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                    </div>
                                  </React.Fragment>
                                )
                              }
                              return rows
                            })()}
                          </TwoColumnLayout>
                        </div>
                      </React.Fragment>
                    )
                  }
                  // Skip rendering for "Bridesmaids" since it's already rendered above
                  return null
                }

                // Secondary Sponsors block: render all groups under one heading
                const secondarySponsorGroups = [
                  "Candle Sponsors",
                  "Candle Bearer",
                  "Veil Sponsors",
                  "Cord Sponsors",
                  "Ribbon Sponsors",
                ] as const
                if ((secondarySponsorGroups as readonly string[]).includes(category)) {
                  // Only render the full block once — when processing the first one that exists in order
                  const firstPresentGroup = secondarySponsorGroups.find((g) => (grouped[g]?.length ?? 0) > 0)
                  if (category !== firstPresentGroup) return null

                  const renderPairedGroup = (groupName: string) => {
                    const grpMembers = grouped[groupName] || []
                    if (grpMembers.length === 0) return null
                    // Names split into left | right columns
                    if (TWO_COLUMN_SECONDARY_GROUPS.has(groupName) && grpMembers.length > 1) {
                      const half = Math.ceil(grpMembers.length / 2)
                      return (
                        <div key={groupName} className="mb-1.5 sm:mb-2.5 md:mb-3">
                          <TwoColumnLayout singleTitle={groupName} centerContent={true}>
                            {renderPairRows(groupName, grpMembers.slice(0, half), grpMembers.slice(half))}
                          </TwoColumnLayout>
                        </div>
                      )
                    }
                    return (
                      <div key={groupName} className="mb-1.5 sm:mb-2.5 md:mb-3">
                        <TwoColumnLayout singleTitle={groupName} centerContent={true}>
                          {grpMembers.length === 2 ? (
                            <>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                <NameItem member={grpMembers[0]} align="right" />
                              </div>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                <NameItem member={grpMembers[1]} align="left" />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-full">
                              <div className="flex flex-col items-center gap-5 sm:gap-6">
                                {grpMembers.map((member, idx) => (
                                  <NameItem key={`${groupName}-${idx}-${member.name}`} member={member} align="center" />
                                ))}
                              </div>
                            </div>
                          )}
                        </TwoColumnLayout>
                      </div>
                    )
                  }

                  return (
                    <div key="SecondarySponsorBlock">
                      {categoryIndex > 0 && (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <GroupDivider />
                        </div>
                      )}
                      {/* Parent heading */}
                      <div className="mb-1.5 sm:mb-2.5 md:mb-3">
                        <SectionTitle>Secondary Sponsors</SectionTitle>
                      </div>
                      {secondarySponsorGroups.map(renderPairedGroup)}
                    </div>
                  )
                }

                // Default: single title, centered content
                return (
                  <div key={category}>
                    {categoryIndex > 0 && (
                      <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                            <GroupDivider />
                      </div>
                    )}
                    <TwoColumnLayout singleTitle={category} centerContent={true}>
                      {(() => {
                        // Special rule: paired sponsor roles with exactly 2 names should meet at center
                        const PAIRED_SECTIONS = new Set(["Candle Sponsors", "Cord Sponsors", "Veil Sponsors", "Little Love Bearer", "Little Promise Bearer"])
                        if (TWO_COLUMN_SECTIONS.has(category)) {
                          const half = Math.ceil(members.length / 2)
                          return renderPairRows(category, members.slice(0, half), members.slice(half))
                        }
                        if (PAIRED_SECTIONS.has(category) && members.length === 2) {
                          const left = members[0]
                          const right = members[1]
                          return (
                            <>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                <NameItem member={left} align="right" />
                              </div>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                <NameItem member={right} align="left" />
                              </div>
                            </>
                          )
                        }
                        if (SINGLE_COLUMN_SECTIONS.has(category) || members.length <= 2) {
                          return (
                            <div className="col-span-full">
                              <div className="flex flex-col items-center gap-5 sm:gap-6">
                                {members.map((member, idx) => (
                                  <NameItem key={`${category}-${idx}-${member.name}`} member={member} align="center" />
                                ))}
                              </div>
                            </div>
                          )
                        }
                        // Default two-column sections: render row-by-row pairs to keep alignment on small screens
                        const half = Math.ceil(members.length / 2)
                        const left = members.slice(0, half)
                        const right = members.slice(half)
                        const maxLen = Math.max(left.length, right.length)
                        const rows = []
                        for (let i = 0; i < maxLen; i++) {
                          const l = left[i]
                          const r = right[i]
                          rows.push(
                            <React.Fragment key={`${category}-row-${i}`}>
                              <div key={`${category}-cell-left-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {l ? <NameItem member={l} align="right" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                              </div>
                              <div key={`${category}-cell-right-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {r ? <NameItem member={r} align="left" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                              </div>
                            </React.Fragment>
                          )
                        }
                        return rows
                      })()}
                    </TwoColumnLayout>
                  </div>
                )
              })}
              
              {/* Display any other categories not in the ordered list */}
              {Object.keys(grouped).filter(cat => !ROLE_CATEGORY_ORDER.includes(cat) && cat !== "Other" && cat !== "Peer Sponsors").map((category) => {
                const members = grouped[category]
                return (
                  <div key={category}>
                    <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                      <GroupDivider />
                    </div>
                    <TwoColumnLayout singleTitle={category} centerContent={true}>
                      {(() => {
                        if (SINGLE_COLUMN_SECTIONS.has(category) || members.length <= 2) {
                          return (
                            <div className="col-span-full">
                              <div className="flex flex-col items-center gap-5 sm:gap-6">
                                {members.map((member, idx) => (
                                  <NameItem key={`${category}-${idx}-${member.name}`} member={member} align="center" />
                                ))}
                              </div>
                            </div>
                          )
                        }
                        // Pair row-by-row for other categories as well
                        const half = Math.ceil(members.length / 2)
                        const left = members.slice(0, half)
                        const right = members.slice(half)
                        const maxLen = Math.max(left.length, right.length)
                        const rows = []
                        for (let i = 0; i < maxLen; i++) {
                          const l = left[i]
                          const r = right[i]
                          rows.push(
                            <React.Fragment key={`${category}-row-${i}`}>
                              <div key={`${category}-cell-left-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {l ? <NameItem member={l} align="right" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                              </div>
                              <div key={`${category}-cell-right-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {r ? <NameItem member={r} align="left" /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                              </div>
                            </React.Fragment>
                          )
                        }
                        return rows
                      })()}
                    </TwoColumnLayout>
                  </div>
                )
              })}

            </>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
        {/* Footer vine grows out from its centre (observed on the unclipped wrapper) */}
        <motion.div
          className="relative z-20 mx-auto mt-6 w-40 sm:mt-12 sm:w-72 md:w-96"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.8 }}
        >
          <motion.div
            variants={{
              hidden: { clipPath: "inset(0% 50% 0% 50%)", opacity: 0 },
              show: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, transition: { duration: 1.6, ease: revealEase } },
            }}
          >
            <DecoImg src={decos.footerVine} className="block h-auto w-full select-none opacity-90" />
          </motion.div>
        </motion.div>
      </div>
      </Section>
    </div>
    </HeadingLabelsContext.Provider>
    </MotionConfig>
  )
}