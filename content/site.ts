import {
  proposalRoleDefinitions,
  proposalRoleIdAliases,
} from "@/content/proposal-roles"

export type TimelineIconName =
  | "arrival"
  | "guests"
  | "rings"
  | "departure"
  | "cocktail"
  | "fireworks"
  | "dance"

export type AttireGroupId = "entourage" | "family" | "sponsors" | "guests"
// A palette color: "#9CAF88" or { name: "Sage", hex: "#9CAF88" }
export type AttireColor = string | { name: string; hex: string }

/* ============================================================================
   SOP — CREATING / UPDATING AN INVITATION
   ----------------------------------------------------------------------------
   This file is the single source of truth for the couple's content. Pages,
   metadata (link previews), robots.txt, sitemap.xml, QR codes, the table
   finder and proposal pages all read from here. Avoid hard-coding couple
   names, dates, URLs or image paths in components — add them here instead.

   NEW INVITATION (cloned from a previous couple) — work top to bottom:
     1. COUPLE          names + nicknames (nicknames drive "Groom & Bride" text)
     2. DATE & TIMES    wedding date, day, entourage/guest/ceremony/reception times
     3. VENUES          ceremony + reception name, address, Google Maps link, photos;
                        VENUE_CARDS = one combined card or two separate cards + their labels
     4. RSVP            deadline, coordinator, phone; HASHTAGS
     5. WEBSITE         SITE_URL = the live domain (keep the trailing "/").
                        LINK_PREVIEW_IMAGE = 1200×630 JPG for Facebook/Messenger.
                        Both feed app/layout.tsx, app/robots.ts, app/sitemap.ts,
                        lib/proposal-metadata.ts and the table finder.
                        NEXT_PUBLIC_SITE_URL (env, e.g. on Vercel) overrides SITE_URL.
     6. LOOK & FEEL     DISPLAY_MODE "plain" or "photos"
     7. SHARED IMAGES   monogram, couple-name lettering, wax seal, music, COUPLE_PHOTOS
     8. googleAPI       new Apps Script / Form URLs for THIS couple's sheet —
                        never reuse the previous couple's (guests would mix).
     9. SECTIONS        love story, timeline events, ATTIRE (cards + palette), reminders,
                        FAQ, registry accounts/QRs, playlist, snap & share, socials.
    10. Search for "⚠ check" and old couple names/hashtags/QRs and replace them.

   BEFORE GOING LIVE:
     • Put every referenced file in /public (paths are case-sensitive on Vercel).
     • Run `npm run build` to catch typos.
     • Paste the live URL in https://developers.facebook.com/tools/debug/ and
       click "Scrape Again" so Facebook picks up the new title + preview image.
       (Changing the preview image? Rename the file — FB caches by URL.)
     • Test RSVP search, a test RSVP submission, messages and /table on mobile.

   CONVENTIONS:
     • Image paths start with "/" and are relative to /public.
     • "" on a decoration/image hides it; show: false hides a card/account/link.
     • Placeholders like {couple}, {name}, {deadline} are filled automatically —
       keep the braces when editing text.
     • ⚠ marks values likely left over from a previous couple.
   ============================================================================ */

/* ============================================================================
   QUICK SETUP — edit these first.
   Every section below reads from here, so one change updates the whole site
   (loader, envelope, hero, details, timeline, RSVP, FAQ, footer, …).
   ============================================================================ */

// ── The couple ──────────────────────────────────────────────────────────────
const COUPLE = {
  bride: "Niña Marise Perez",
  brideNickname: "Niña",
  groom: "Adelon Sanchez",
  groomNickname: "Adelon",
}

// ── Date & times ────────────────────────────────────────────────────────────
const WEDDING_DATE = "December 29, 2026" // e.g. "June 5, 2027"
const WEDDING_DAY = "Tuesday" // 
const TIMES = {
  entourageCall: "1:00 PM", // entourage assembly
  guestArrival: "1:30 PM", // guests arrival / assembly (shown in Event Details + reminders)
  ceremony: "2:00 PM",
  reception: "4:00 PM", // start of program
}

// ── Venues ──────────────────────────────────────────────────────────────────

const CEREMONY_VENUE = {
  name: "Church St. Augustine Parish Church",
  address: "Benigno S. Aquino Avenue, Baliwag, Bulacan, Philippines",
  map: "https://maps.app.goo.gl/PgiHbPDC5Jj9CpQQ6",
  photos: ["/Details/ceremony (1).webp", "/Details/ceremony (2).webp"],
}
const RECEPTION_VENUE = {
  name: " Sheperds Palace, Dalayap, Candaba, Pampanga",
  address: "brgy Candaba, Pampanga, Philippines",
  map: "https://maps.app.goo.gl/buRWssEcVn2vuJxf7",
  photos: ["/Details/reception (4).jpg", "/Details/reception (5).jpg", "/Details/reception (6).jpg"],
}

// ── Venue cards (Event Details section) ─────────────────────────────────────
// layout:
//   "separate" = two cards: ceremony (CEREMONY_VENUE) + reception (RECEPTION_VENUE)
//   "combined" = ONE card for both — use when ceremony and reception share a venue.
//                Name, address, map and photos come from CEREMONY_VENUE.
// badge        = small pill on the photo (e.g. "Ceremony & Reception")
// sectionLabel = label above the venue name (e.g. "Venue")
// showDate     = show the big Month / Day / Year
// showArrival  = show "Arrival: <guest arrival time>" (otherwise "At <time>")
const VENUE_CARDS = {
  layout: "separate" as "separate" | "combined",
  // Used when layout is "combined"
  combined: {
    badge: "Ceremony & Reception",
    sectionLabel: "Venue",
    showDate: true,
    showArrival: false,
    // Time rows on the card, e.g. "Ceremony 4:30 PM | Reception 7:00 PM"
    ceremonyLabel: "Ceremony",
    receptionLabel: "Reception",
    // false = show only the ceremony time on the combined card
    showReceptionTime: false,
  },
  // Used when layout is "separate"
  ceremony: {
    show: true,
    badge: "Ceremony",
    sectionLabel: "Ceremony Venue",
    showDate: true,
    showArrival: true,
  },
  reception: {
    show: true,
    badge: "Reception",
    sectionLabel: "Reception Venue",
    showDate: false,
    showArrival: false,
  },
}

// ── RSVP & contact ──────────────────────────────────────────────────────────
const RSVP = {
  deadline: " November 30, 2026",
  coordinator: "{groom} / {bride}", // {groom} / {bride} → couple nicknames
  phone: "to be announced",
}
const HASHTAGS = ["#destiNIÑAsiADELON"] // ⚠ check — looks like it's from a previous couple

// ── Attire guide (Event Details → Attire Guidelines) ────────────────────────
// SHOW = which cards to display AND their order, top to bottom. Examples:
//   ["guests"]                            guests only
//   ["entourage", "guests"]               entourage + guests
//   ["sponsors", "entourage", "guests"]   complete
//   ["guests", "sponsors"]                guests first, then sponsors
//   []                                    hide the whole attire guide
// Leave out a name to hide that card. Unknown or empty entries are ignored.
// Each card: fill in only what you need — anything left "" or [] is hidden.
//   image:     illustration path in /public ("" = no image; any size/shape works)
//   palette:   colors for this card — "#9CAF88" or { name: "Sage", hex: "#9CAF88" }
//              (names show on the swatches; [] = no palette)
//   ladies / gentlemen:
//     label:     e.g. "Ninang", "Bridesmaids", "Ladies"
//     details:   the dress code text ("" hides this half of the card)
//     highlight: phrase inside details shown bold + underlined ("" for none)
// Guest dress code colors — also shown in the "Dress Code" gentle reminder
const DRESS_CODE_PALETTE: AttireColor[] = [
  { name: "Dusty Pink", hex: "#D49AA3" },
  { name: "Blush Pink", hex: "#E7B8BE" },
  { name: "Champagne Beige", hex: "#DCC3AD" },
  { name: "Charcoal Gray", hex: "#666269" },
  { name: "Navy Blue", hex: "#29364F" },
];

// Attire groups shown in the Details section (components/sections/details.tsx).
//   show      → which groups appear, in order
//   dressCode → small line under the palette title, e.g. "Formal Attire"
//   note      → closing line shown above the card's palette ("" = default color guide note)
//   Each side (ladies / gentlemen) has a label, an optional intro (details, with an
//   optional highlighted phrase) and an optional list of roles with what they wear.
const ATTIRE = {
  show: ["entourage", "sponsors"] as AttireGroupId[],

  entourage: {
    title: "Entourage",
    image: "/Details/new-entourage (3).png",
    dressCode: "Formal Attire",
    palette: [
      { name: "Rose Gold", hex: "#DDA49D" },
      { name: "Dusty Pink", hex: "#D49AA3" },
      { name: "Navy Blue", hex: "#1E3051" },
      { name: "Deep Navy", hex: "#14243F" },
    ] as AttireColor[],

    note: "Romantic rose gold gowns paired with sophisticated navy blue suits, beautifully accented with soft dusty pink details.",

    ladies: {
      label: "Bridesmaids & Flower Girls",
      details:
        "Elegant floor-length rose gold gowns in soft, flowing fabrics such as chiffon, satin, or tulle. Flower girls may wear matching rose gold dresses with delicate floral accents.",
      highlight: "Rose Gold Formal Gowns",
      roles: [] as { role: string; attire: string }[],
    },

    gentlemen: {
      label: "Groomsmen & Bearers",
      details:
        "Classic navy blue three-piece suits paired with crisp white shirts, dusty pink bow ties, matching pocket squares, and polished black formal shoes. Bearers may wear coordinating navy blue suits.",
      highlight: "Navy Blue Suits with Dusty Pink Bow Ties",
      roles: [] as { role: string; attire: string }[],
    },
  },

  family: {
    title: "Family",
    image: "/Details/Family.png",
    dressCode: "Formal Attire",
    palette: [
      { name: "Blue", hex: "#4E86B7" },
      { name: "Yellow", hex: "#F6D35B" },
      { name: "Black", hex: "#1E1E1E" },
    ] as AttireColor[],
    note: "",
    ladies: {
      label: "Ladies",
      details: "",
      highlight: "",
      roles: [
        { role: "Mothers of the Bride & Groom", attire: "Blue long dress." },
        { role: "Sisters", attire: "Yellow gown." },
      ],
    },
    gentlemen: {
      label: "Gentlemen",
      details: "",
      highlight: "",
      roles: [
        { role: "Fathers of the Bride & Groom", attire: "Black suit with a blue necktie." },
        { role: "Brothers", attire: "All-black suit and necktie." },
      ],
    },
  },

  sponsors: {
  title: "Principal Sponsors",
  image: "/Details/new-sponsor-.png",
  dressCode: "Formal Attire",
  palette: [
    { name: "Old Rose", hex: "#D49AA3" },
    { name: "Dusty Pink", hex: "#C98F9A" },
    { name: "Black", hex: "#242124" },
    { name: "Navy Blue", hex: "#1E3051" },
  ] as AttireColor[],

  note: "Elegant old rose gowns paired with classic black suits and navy blue neckties, creating a timeless and sophisticated look for our principal sponsors.",

  ladies: {
    label: "Ninang",
    details:
      "Elegant floor-length formal gowns in shades of old rose or dusty pink. Soft, flowing fabrics such as chiffon, satin, or tulle with delicate floral details are welcome.",
    highlight: "Old Rose Formal Gowns",
    roles: [] as { role: string; attire: string }[],
  },

  gentlemen: {
    label: "Ninong",
    details:
      "Classic black formal suits paired with crisp white dress shirts, navy blue neckties, and polished black leather shoes. A simple boutonniere may complete the look.",
    highlight: "Black Suits with Navy Blue Neckties",
    roles: [] as { role: string; attire: string }[],
  },
},

  guests: {
  title: "Wedding Guests",
  image: "/Details/guest.png",
  dressCode: "Semi-Formal Attire",
  palette: DRESS_CODE_PALETTE,

  note: "Celebrate with us in soft dusty pink, blush, champagne beige, charcoal gray, or navy blue. Choose a shade from our wedding palette for an elegant and coordinated celebration.",

  ladies: {
    label: "Ladies",
    details:
      "Elegant midi or long dresses in shades of dusty pink, blush pink, champagne beige, or navy blue. Soft, flowing fabrics such as chiffon, satin, or tulle are encouraged.",
    highlight: "Midi or Long Dresses",
    roles: [] as { role: string; attire: string }[],
  },

  gentlemen: {
    label: "Gentlemen",
    details:
      "Long-sleeved or short-sleeved collared shirts in dusty pink, blush pink, charcoal gray, or navy blue, paired with tailored trousers in charcoal gray, beige, or dark neutral tones. Complete the look with formal or smart-casual shoes.",
    highlight: "Collared Shirts with Tailored Trousers",
    roles: [] as { role: string; attire: string }[],
  },
},
}

// ── Website address (used for QR codes, link previews, table finder) ────────
// NEXT_PUBLIC_SITE_URL (env) overrides this when set.
const SITE_URL = "https://adelon-and-nina.weddinginvitationrsvp.com/"
// Image shown when the link is shared (Facebook, Messenger, Viber, X, …) — 1200×630 JPG in /public
// Use a NEW filename whenever the image changes — Facebook caches images by URL.
const LINK_PREVIEW_IMAGE = "/Details/imagepreview.png"

// Site address with env override applied and no trailing slash — no need to edit
export const canonicalSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL).replace(/\/$/, "")

// ── Look & feel ─────────────────────────────────────────────────────────────
// "plain"  = no photo backgrounds anywhere (botanical cards, hides photo-only blocks)
// "photos" = photo backgrounds on the loader, envelope and closing section
const DISPLAY_MODE = "plain" as "photos" | "plain"

// ── Shared images ───────────────────────────────────────────────────────────
const BRAND = {
  monogram: "/monogram/monogram.png", // monogram (loader, envelope, closing)
  coupleNameImage: "/Details/newcoupelNames.png", // couple-name lettering (loader, envelope)
  seal: "/monogram/seal.png", // envelope wax seal
  backgroundMusic: "/background_music/Every Time I Close My Eyes.mp3",
}

// Couple photos reused across the site (gallery, loader, reminders, snap & share, closing)
// — every portrait in /public/mobile-background
const COUPLE_PHOTOS = Array.from(
  { length: 12 },
  (_, i) => `/mobile-background/couple (${i + 1}).webp`,
)

// Portraits for the envelope reveal + the main cover photo (soft natural light, no heavy filters)
const COUPLE_PORTRAITS = {
  groom: "/mobile-background/couple (5).webp", // left photo in the envelope
  bride: "/mobile-background/couple (4).webp", // right photo in the envelope
  cover: "/mobile-background/couple (9).webp", // photo pulled out of the envelope + home hero cover photo
}

// Sliding photo marquee behind the loader and envelope.
// Phones use the portrait shots in /public/mobile-background, desktop the landscape
// shots in /public/desktop-background — update the counts when files are added/removed.
const MARQUEE_PHOTO_COUNT = 12
const MARQUEE_PHOTOS = Array.from(
  { length: MARQUEE_PHOTO_COUNT },
  (_, i) => `/mobile-background/couple (${i + 1}).webp`,
)
const MARQUEE_PHOTO_COUNT_DESKTOP = 20
const MARQUEE_PHOTOS_DESKTOP = Array.from(
  { length: MARQUEE_PHOTO_COUNT_DESKTOP },
  (_, i) => `/desktop-background/couple (${i + 1}).webp`,
)

// ── Decorations ─────────────────────────────────────────────────────────────
// Change a path here to swap it on every section at once.
// To change ONE section only, override it there, e.g. decos: { ...SECTION_DECOS, footerVine: "" }
const DECOR = {
  cornerTopLeft: "/deco/new-deco/corner-top-left.png", // floral corner tucked under the top vines (loader + envelope)
  cornerTopRight: "/deco/new-deco/corner-top-right.png",
  cornerBottomLeft: "/deco/new-deco/corner-bottom-left.png",
  cornerBottomRight: "/deco/new-deco/corner-bottom-right.png",
  cornerOverlayTopLeft: "/deco/cornerOverlayTopLeft.png", // floral corner layered over the top vines (loader + envelope)
  cornerOverlayTopRight: "/deco/cornerOverlayTopRight.png",
  headerOrnament: "/deco/new-deco/new-header-ornament.png", // small sprig above titles
  footerVine: "/deco/footerVine.png", // long vine at section ends
  sideLeft: "/deco/lovestorydeco/Elegant-Eucalyptus-Left.png", // love story side sprigs
  sideRight: "/deco/lovestorydeco/Elegant-Eucalyptus-Right.png",
}

// The four corners as one set
const CORNER_DECOS = {
  topLeft: DECOR.cornerTopLeft,
  topRight: DECOR.cornerTopRight,
  bottomLeft: DECOR.cornerBottomLeft,
  bottomRight: DECOR.cornerBottomRight,
}

// Default decoration set used by most sections (corners + ornament + vine)
const SECTION_DECOS = {
  ...CORNER_DECOS,
  headerOrnament: DECOR.headerOrnament,
  footerVine: DECOR.footerVine,
}

// One love story chapter (content/site.ts → loveStory.chapters)
type StoryChapter = {
  date?: string // small caps line above the title ("" shows "Chapter 0X")
  title: string
  image?: string // photo beside the text ("" for none)
  imageAlt?: string // photo description ("" uses loveStory.photoAlt)
  paragraphs: string[] // {groom} / {bride} → nicknames
  imagePosition?: string // which part of the photo stays in frame, e.g. "center 20%" (default "center 30%")
  layout?: "image-left" | "image-right" // optional — chapters alternate sides automatically
}

// Handy derived values — no need to edit
const COUPLE_LABEL = `${COUPLE.groomNickname} & ${COUPLE.brideNickname}`

/* ============================================================================
   SECTIONS — wording and per-section options. Values above are referenced here.
   ============================================================================ */

// Principal sponsors Google Apps Script — used by the main page and /inviteone
const SPONSORS_API = "https://script.google.com/macros/s/AKfycbxJcuIhrEYFXen9O9MqGSObvuzLm0wBSDerEGUO0UUYBhKFoYShVFElp3CBaDyuZUNP/exec"

export const siteConfig = {
  siteUrl: SITE_URL,
  linkPreviewImage: LINK_PREVIEW_IMAGE,
  couple: {
    ...COUPLE,
    monogram: BRAND.monogram,
    backgroundMusic: BRAND.backgroundMusic,
  },
  googleAPI:{
    messageForm: "https://docs.google.com/forms/d/e/1FAIpQLScW07l2wTfvjtulFPtYoYKyUjSGhxgqAOdi6KbnJ93E_zijIw/formResponse",   //done
    message: "https://script.google.com/macros/s/AKfycbwQTiw6gUFsg9rA8ItmpiXV4K_S75WnWk67Wbd2sxGTAsX6K0ijE3eCshTYxveEK4kr/exec", //done 
    guestList: "https://script.google.com/macros/s/AKfycby0kjQYxbUs3YUb5dchyMcydDGhtl-28-Gkz4EfbIx7Mr2lQAYuEMvd2mxjKNyrd5wt/exec",  //done
    guestRequest: "https://script.google.com/macros/s/AKfycbwJ5rLsF-XxgG--oXjkAOhs6TV3JNmsXL0761l6lOs6hDgaxzDD8x3cnGfs3QffQJju/exec",  //done
    entourage: "https://script.google.com/macros/s/AKfycbzsBu53v0M6SXYZY0myyILFvXBnIxmQlWYoUtBxZtLNiQDDCujde3dDWuLkr4oR127H/exec",  //done
    sponsors: SPONSORS_API,  //done 
    // Principal sponsors shown on /inviteone and /invitetwo (entourage section)
    sponsorsInviteOne: SPONSORS_API, // same sheet as sponsors above
    sponsorsInviteTwo: "https://script.google.com/macros/s/AKfycbxJcuIhrEYFXen9O9MqGSObvuzLm0wBSDerEGUO0UUYBhKFoYShVFElp3CBaDyuZUNP/exec",
////google share 
    googleShare: "https://docs.google.com/spreadsheets/d/1jewfY5uUkdcS61izdcQRJ2C5vgGRPEMWcUcHsuOtGXo/edit?usp=sharing",
    videoMessageForm:
      "https://docs.google.com/forms/d/e/1FAIpQLSfeGlEl4CMXWefdvCw6AOPHFS1ROku_rs-Gbofa2LkVJ0sLGQ/viewform", 
  },
  wedding: {
    date: WEDDING_DATE,
    time: TIMES.ceremony,
    venue: CEREMONY_VENUE.name,
    tagline: "are getting married!!!!!",
    theme: "Gray & Blush Pink",
    motif: "#9A9294, #A8606F, #EBCBCF, #F3E8E6",
  },
  // Opening "Save the Date" loading screen (components/loader/LoadingScreen.tsx).
  // Couple names, wedding date and ceremony details come from couple / wedding / ceremony above.
  loadingScreen: {
    // "photos" = sliding photo background + photo date cards
    // "plain"  = no images at all: soft solid background + plain date cards
    display: DISPLAY_MODE,
    // Colors used when display is "plain"
    plainTheme: {
      background: "var(--color-welcome-bg)",
      text: "var(--color-welcome-text)",
      accent: "var(--color-welcome-gold)",
    },
    // Sliding photo marquee behind the loader and envelope (both display modes); files live in /public
    backgroundPhotos: MARQUEE_PHOTOS,
    backgroundPhotosDesktop: MARQUEE_PHOTOS_DESKTOP, // same marquee on screens 768px and up
    // Opening title on the loader and the envelope letter — short joining words ("of", "the") are set in script
    headline: "Save the Date", // "the" is set in the Brittany script (loader + envelope letter)
    // {days} is replaced with the number of days left before wedding.date
    countdownText: "{days} more days to go",
    countdownOneDayText: "1 more day to go",
    countdownTodayText: "Today is the day",
    countdownPastText: "Thank you for celebrating with us",
    coupleNameImage: BRAND.coupleNameImage,
    // Shown in the three date cards (Month / Day / Year), left to right (display: "photos")
    photos: [
      "/frontboxes/couple (1).webp",
      "/frontboxes/couple (2).webp",
      "/frontboxes/couple (3).webp",
    ],
    dateLabels: ["Month", "Day", "Year"],
    // Plain mode invitation card — classic invitation wording around the couple's names ("" to hide a line)
    plainInvite: {
      ornament: DECOR.headerOrnament,
      lineAbove: "Together with their families",
      lineBelow: "request the honour of your presence",
    },
    showCeremonyDetails: true,
    eyebrow: "You're invited",
    message: "We can't wait to celebrate with you",
    // Rotates under the progress bar while the invitation loads
    statusMessages: [
      "Gathering our favorite moments",
      "Setting the table for you",
      "Crafting your invitation experience",
    ],
    durationMs: 10000,
    // Invitation envelope (components/loader/Hero.tsx) — shares display + photos with loader above
    hintText: "Tap the Seal to Open",
    enterButtonText: "View the Invitation",
    sealImage: BRAND.seal,
    // Revealed when the envelope opens: one portrait of each, side by side (groom left, bride right)
    portraits: {
      groom: COUPLE_PORTRAITS.groom,
      bride: COUPLE_PORTRAITS.bride,
    },
    // Bouquet tucked inside the open envelope, peeking out on both sides ("" to hide)
    envelopeFlowers: "deco/new-deco/bottom-L.png",
    // Main page cover photo (home hero, plain display) — one natural, candid couple photo
    coverPhoto: COUPLE_PORTRAITS.cover,
    coverPhotoAlt: COUPLE_LABEL,
    // All four corner florals (top two are drawn smaller in CSS; "" hides a corner)
    cornerDecos: { ...CORNER_DECOS },
    // Floral corners drawn on top of the top corner vines ("" hides one)
    cornerOverlays: {
      topLeft: DECOR.cornerOverlayTopLeft,
      topRight: DECOR.cornerOverlayTopRight,
    },
  },
  // Home hero (components/sections/hero.tsx) — the first section after the envelope.
  // Cover photo + background photos come from loadingScreen (coverPhoto / backgroundPhotos).
  homeHero: {
    // Four corner florals, sized per corner like the loader and envelope ("" hides a corner)
    decos: { ...CORNER_DECOS },
    // Thin double border around the section, under the corner florals (false hides it)
    showFrame: true,
    // Sprig tucked under the bottom of the couple's cover photo ("" hides it)
    coverVine: DECOR.headerOrnament,
  },
  // Couple video (components/sections/couple-video.tsx)
  coupleVideo: {
    title: "A Glimpse of Our Love",
    script: "Our Journey Together",
    subtitle: "Watch the journey that brought our hearts together",
    closingNote: "A glimpse into the moments that made our hearts one",
    // Your own video file in /public (e.g. "/video/our-story.mp4"). When set it is
    // played directly with no YouTube at all; leave "" to use youtubeId instead.
    videoSrc: "https://youtu.be/c6ThrZn8OuY",
    // YouTube video ID — the part after "watch?v=" (or after "youtu.be/")
    youtubeId: "c6ThrZn8OuY",
    // Cover image shown before the video plays
    thumbnail: "/desktop-background/couple (6).webp",
    thumbnailAlt: `${COUPLE_LABEL} — video cover`,
    playLabel: "Play our video",
  },
  // Thank-you messages to family and friends (components/sections/love-story.tsx + StorySection)
  loveStory: {
    title: "With Gratitude",
    subtitle: "to the people we love",
    // Short opening line under the title ("" hides it)
    intro:
      "Before we say “I do,” we want to say “thank you.” To our families, our friends and everyone who has loved, guided and prayed for us: this day is as much yours as it is ours, and we would be so happy to celebrate it with you.",
    // Small sprig above the title ("" hides it)
    headerOrnament: DECOR.headerOrnament,
    // Shown above a chapter's title when it has no date, e.g. "Chapter 03"
    chapterLabel: "With Love",
    // Photo description used when a chapter has no imageAlt
    photoAlt: "{groom} and {bride}",
    // Large faint chapter number (01, 02 …) behind each chapter's text
    showChapterNumbers: false,
    // Small heart divider between chapters
    showChapterDividers: true,
    // Closing block: big word, hashtag, then the verse (also shown in Snap & Share)
    closingEyebrow: "", // large word on top (was "Puhon") — "" hides it
    closingHashtag: "", // hashtag under it (was HASHTAGS[0]) — "" hides it
    closingQuoteLead: "", // bold first line ("" for none)
    closingQuote: "“He has made everything beautiful in its time.”",
    closingCitation: "Ecclesiastes 3:11",
    // Four corner florals framing the section, sized per corner like the loader ("" hides a corner)
    decos: { ...CORNER_DECOS },
    // Thin double border around the section, under the corner florals (false hides it)
    showFrame: true,
    eucalyptusDecos: {
      topLeft: DECOR.sideLeft,
      bottomRight: DECOR.sideRight,
      timelineTop: DECOR.headerOrnament,
      sectionBottom: DECOR.headerOrnament, // dusty-blue sprig under the closing verse ("" hides it)
    },
    // The story, one chapter at a time (fields: see StoryChapter above). Photos come from
    // /public/mobile-background. Add, remove or reorder chapters freely — sides alternate on their own.
    chapters: [
      {
        date: "Our Love Story",
        title: "Where It All Began",
        image: "/mobile-background/couple (7).webp",
        imageAlt: "{groom} and {bride} together",
        imagePosition: "center 25%",
        paragraphs: [
          "From a simple message to forever.",
          "What began with a simple message turned into a love story only God could have written.",
            ],
      },
      {
        date: "Faith, Healing, and Love",
        title: "A Love Written by God",
        image: "/mobile-background/couple (8).webp",
        imageAlt: "{groom} and {bride} smiling together",
        imagePosition: "center 35%",
        paragraphs: [
          "Adelon was praying for someone to spend forever with, while I was learning to love again.",
          "Through unexpected turns, little adventures, milk tea dates, and beautiful and difficult days, we found healing, faith, and a love worth choosing every single day.",
        ],
      },
      {
        date: "August 9, 2023",
        title: "The Day We Became Us",
        image: "/mobile-background/couple (11).webp",
        imageAlt: "{groom} and {bride} together",
        imagePosition: "center 20%",
        paragraphs: [
          "From June 13, 2022, to the day we became us on August 9, 2023, God was quietly writing our story.",
            ],
      },
      {
        date: "Our Answered Prayer",
        title: "The Beginning of Forever",
        image: "/mobile-background/couple (12).webp",
        imageAlt: "{groom} and {bride} together",
        imagePosition: "center 25%",
        paragraphs: [
          "And now, with hearts full of gratitude and loved ones we carry in our hearts, we’re ready to begin our greatest adventure yet.",
          "This is our answered prayer, our favorite love story, and the beginning of forever.",
        ],
      },
    ] as StoryChapter[],
  },
  // Gallery section (components/sections/gallery.tsx)
  gallery: {
    eyebrow: "Our Moments",
    title: "Gallery",
    subtitle: "our favorite moments",
    description:
      "From our first chapter to this beautiful season of commitment — every moment has been a testament to love, faith, and grace.",
    footnote:
      "More pictures will be added as we gather the rest of our favorite moments. Please check back — this gallery is still growing.",
    buttonText: "View Full Gallery",
    buttonHref: "/gallery",
    // Corner florals (sized per corner like the loader), sprig above the title and
    // sprig under the footnote — "" hides any of them
    decos: {
      ...CORNER_DECOS,
      headerOrnament: DECOR.headerOrnament,
      footerVine: DECOR.headerOrnament,
    },
    // Thin double border around the section and the full gallery page (false hides it)
    showFrame: true,
    // Small labels
    swipeHint: "Swipe to explore", // under the phone carousel
    lightboxSwipeHint: "Swipe to navigate", // inside the full-screen photo view
    resetZoomText: "Reset Zoom",
    // Full gallery page (/gallery)
    page: {
      backText: "Back to invitation",
      backTextShort: "Back", // narrow phones
      label: "Gallery", // top bar, beside the couple's names
      emptyText: "No images to display.",
    },
    // Uses COUPLE_PHOTOS; replace with your own list if the gallery should differ.
    // text → caption used as the photo's description
    images: COUPLE_PHOTOS.map((image, i) => ({ image, text: `${COUPLE_LABEL}, photo ${i + 1}` })),
  },

  // Event details section (components/sections/details.tsx)
  // Venue names, addresses, dates, times, maps and venue photos come from ceremony / reception below.
  // In reminder text, {guestsTime} and {ceremonyTime} are replaced from ceremony below.
  eventDetails: {
    eyebrow: "Our Celebration",
    title: "Event Details",
    subtitle: "our special day",
    description: "Everything you need to know about our special day.",
    // Verse under the description — "" hides it
    verse: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
    verseCitation: "1 Corinthians 13:13",
    decos: { ...SECTION_DECOS },
    // Thin double border around the section (false hides it)
    showFrame: true,
    // Venue cards layout:
    //   "separate" = one card each for ceremony and reception (uses ceremony / reception below)
    //   "combined" = ONE card for both — use when ceremony and reception share a venue.
    //                Venue name, address, map and photos come from CEREMONY_VENUE;
    //                the card lists both times (ceremony.time + reception.time).
    // Set in QUICK SETUP → VENUE_CARDS
    venues: VENUE_CARDS,
    labels: {
      arrival: "Arrival",
      at: "At",
      scanForDirections: "Scan for directions",
      getDirections: "Get Directions",
      copyAddress: "Copy Address",
      copied: "Copied!",
    },
    // Cards, colors, images and which groups show → QUICK SETUP → ATTIRE
    attire: {
      title: "Attire Guidelines",
      description: "Our day is dressed in soft dusty pinks, gentle grays and warm creams, and we would love for you to wear them with us. Please find your role below.",
      // Shown above a card's palette
      paletteTitle: "Dress Code Palette",
      paletteSubtitle: "", // script line under the palette title — "" hides it
      colorGuideTitle: "Color Guide",
      colorGuideNote: "Choose any shade from the palette below. Solid colors and soft, flowy fabrics are all welcome.",
      // Order and visibility come from ATTIRE.show (skips blanks, typos and repeats)
      groups: ATTIRE.show
        .filter((id, i, list) => ["entourage", "family", "sponsors", "guests"].includes(id) && list.indexOf(id) === i)
        .map((id) => ({ id, ...ATTIRE[id] })),
      // Shared dress code palette (used by the "Strictly Formal" reminder)
      palette: DRESS_CODE_PALETTE,
    },
    reminders: {
      title: "Gentle Reminders",
      description: "A few thoughtful notes to help everyone enjoy our celebration.",
      // Small photos that take turns above the "Gentle Reminders" title (files in /public/box)
      images: [
        "/box/box(1).webp",
        "/box/box(2).webp",
        "/box/box(3).webp",
        "/box/box(4).webp",
      ],
      // showPalette: shows the dress code palette after the first paragraph
      items: [
        /*{
          title: "Adults-Only Celebration",
          variant: "accent" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "We love your kids, but consider this your night off! Please note that our celebration is adults-only.",
          ],
        },*/
        {
          title: "No Surprise Announcements",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "To keep the focus on the celebration, we kindly ask that there be no surprise announcements or proposals during our wedding.",
          ],
        },
        {
          title: "Keep Our Invitation Private",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Please keep this just between us! Kindly refrain from posting our invitation online.",
          ],
        },
        {
          title: "Parking",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Parking for both cars and motorcycles is available inside the venue.",
          ],
        },
        {
          title: "Unplugged Ceremony",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "We're having a mostly unplugged ceremony. Guests may take photos, but we kindly ask that it be kept minimal. Please avoid blocking or crowding our official photographers so they can capture the special moments. We'd love for everyone to stay present and share the moment with us. Don't worry—professional photos will be shared with you after the event. Thank you for your understanding.",
          ],
        },
        {
          title: "Dress Code",
          variant: "accent" as "accent" | "soft",
          showPalette: true,
          paragraphs: [
            "Guests, kindly come in semi-formal attire in shades of dusty pink or gray from our palette.",
            "Please avoid casual clothes and all-white outfits.",
          ],
        },
        {
          title: "Arrival",
          variant: "soft" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "To ensure everything runs smoothly, please arrive at {guestsTime}. This will give you enough time to find your seat, settle in comfortably, and fully enjoy the beautiful ceremony before it begins at {ceremonyTime}. We truly appreciate your punctuality and look forward to celebrating this special moment with you.",
          ],
        },
        {
          title: "Reception Details",
          variant: "accent" as "accent" | "soft",
          showPalette: false,
          paragraphs: [
            "Please join us for early dinner, laughter, and dancing after the ceremony.",
          ],
        },
      ],
    },
  },
  // Wedding day timeline (components/sections/wedding-timeline.tsx)
  weddingTimeline: {
    kicker: "Join us as we tie the knot!",
    title: "Timeline",
    subtitle: "our wedding day",
    description:
      "From the first arrival to the last farewell, here is how we will spend this day together.",
    // "" hides the verse — Ecclesiastes 3:11 is already shown in the Love Story
    quote: "",
    quoteCitation: "",
    // Optional corner decorations — leave "" to hide
    decos: {
      topLeft: "",
      topRight: "",
      bottomLeft: "",
      bottomRight: "",
    },
    // Each event — shown top to bottom in this order (move a block to reorder):
    //   show:     true = display on the site, false = hide it (still kept here to edit later)
    //   time:     shown above the title; TIMES.* come from QUICK SETUP, others are typed in, e.g. "4:00 PM"
    //   location: text shown under the title; {ceremony} / {reception} are replaced
    //             with ceremony.location / reception.location ("" to hide)
    //   image:    line-art illustration from /public/weddingtimeline; "" to use the icon instead
    //   icon:     fallback icon when there is no image —
    //             "arrival" | "guests" | "rings" | "departure" | "cocktail" | "fireworks" | "dance"
    //   description: not shown on the site (kept only as a note)
    events: [
      {
        show: true,
        time: TIMES.entourageCall,
        title: "Entourage Call Time",
        description: "The couple and entourage gather and get ready.",
        location: "{ceremony}",
        image: "/weddingtimeline/Wedding Entourage Call Time Logo.png",
        icon: "arrival" as TimelineIconName,
      },
      {
        show: true,
        time: TIMES.guestArrival,
        title: "Guests Arrive",
        description: "Kindly be seated before the ceremony begins.",
        location: "{ceremony}",
        image: "/weddingtimeline/Elegant Wedding Guests Arrive Sign.png",
        icon: "guests" as TimelineIconName,
      },
      {
        show: true,
        time: "3:00 PM", //TIMES.ceremony
        title: "Wedding Ceremony",
        description: "We exchange our vows before God, family and friends.",
        location: "{ceremony}",
        image: "/weddingtimeline/WeddingCeremony.png",
        icon: "rings" as TimelineIconName,
      },
      {
        show: true,
        time: "3:30 PM",
        title: "Photo Session",
        description: "Join us for pictures with the newlyweds.",
        location: "{ceremony}",
        image: "/weddingtimeline/PhotoSession.png",
        icon: "rings" as TimelineIconName,
      },
      {
        show: true,
        time: "4:00 PM",
        title: "Cocktail Hour",
        description: "Refreshments while we make our way to the reception.",
        location: "{reception}",
        image: "/weddingtimeline/CockTailHour.png",
        icon: "cocktail" as TimelineIconName,
      },
      {
        show: true,
        time: TIMES.reception,
        title: "Start of Program",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/reception welcom.png",
        icon: "fireworks" as TimelineIconName,
      },
      {
        show: true,
        time: "4:30 PM",
        title: "Grand Entrance",
        description: "Welcome the newlyweds as husband and wife.",
        location: "{reception}",
        image: "/weddingtimeline/assemble.png",
        icon: "fireworks" as TimelineIconName,
      },
      {
        show: true,
        time: "5:00 PM",
        title: "Wedding Feast",
        description: "Let's share a meal and celebrate together.",
        location: "{reception}",
        image: "/weddingtimeline/DinnerService.png",
        icon: "cocktail" as TimelineIconName,
      },
      {
        show: true,
        time: "5:20 PM",
        title: "Cake Cutting",
        description: "",
        location: "{reception}",
        image: "/weddingtimeline/cakecutting.png",
        icon: "fireworks" as TimelineIconName,
      },
      {
        show: true,
        time: "5:40 PM",
        title: "First Dance",
        description: "Our first dance as husband and wife.",
        location: "{reception}",
        image: "/weddingtimeline/dance.png",
        icon: "dance" as TimelineIconName,
      },
      {
        show: true,
        time: "6:30 PM",
        title: "Send-off",
        description: "Thank you for celebrating with us!",
        location: "{reception}",
        image: "/weddingtimeline/SendOff.png",
        icon: "departure" as TimelineIconName,
      },
    ],
  },
  // Wedding entourage (components/sections/entourage.tsx)
  // Names and roles come from the Google Sheet (googleAPI.entourage); couple names from couple above.
  entourage: {
    eyebrow: "Our People",
    title: "Wedding Entourage",
    subtitle: "standing with us",
    description: "Honoring those who stand with us on our special day",
    coupleKicker: "Together as one",
    coupleLine: "The beginning of our forever",
    coupleHeading: "The Couple",
    groomRole: "Groom",
    brideRole: "Bride",
    loadingText: "Loading entourage...",
    retryingText: "Still gathering the wedding party. Trying again...",
    errorText: "Unable to load entourage",
    retryText: "Try again",
    // Corner florals (sized per corner like the loader), sprig above the title and
    // sprig at the end of the section — "" hides any of them
    decos: {
      ...CORNER_DECOS,
      headerOrnament: DECOR.headerOrnament,
      footerVine: DECOR.headerOrnament,
    },
    // Thin double border around the section (false hides it)
    showFrame: true,
    // Rename any heading shown in the entourage card: "Heading as shown": "Your text"
    headingLabels: {
      "Parents of the Groom": "Parents of the Groom",
      "Parents of the Bride": "Parents of the Bride",
      "Principal Sponsors": "Principal Sponsors",
      "Peer Sponsors": "Peer Sponsors",
      "Family of the Groom": "Family of the Groom",
      "Family of the Bride": "Family of the Bride",
      "Man of Honor": "Man of Honor",
      "Best Man": "Best Man",
      "Maid of Honor": "Maid of Honor",
      "Matron of Honor": "Matron of Honor",
      "Little Groom": "Little Groom",
      "Little Bride": "Little Bride",
      "Flower Girls": "Flower Girls",
      "Beloved Entourage": "Beloved Entourage",
      "Candle Sponsors": "Candle Sponsors",
      "Veil Sponsors": "Veil Sponsors",
      "Cord Sponsors": "Cord Sponsors",
      "Bridesmen": "Bridesmen",
      "Escorts": "Escorts",
      "Petal Maidens": "Petal Maidens",
    } as Record<string, string>,
  },
  // RSVP / guest list (components/sections/guest-list.tsx) — card, search, RSVP form and all modals.
  // Placeholders in curly braces are filled in automatically: {name}, {count}, {n}.
  // The RSVP deadline itself comes from details.rsvp.deadline.
  rsvp: {
    headerOrnament: DECOR.headerOrnament, // "" to hide
    title: "RSVP",
    script: "Are you going",
    intro: "Kindly confirm your attendance so we may prepare a place for you at our celebration.",
    deadlineLabel: "RSVP Deadline",
    openButton: "Tap here to respond",
    search: {
      title: "RSVP",
      script: "Find your Name",
      placeholder: "Begin with your first name",
      loading: "Preparing the guest list. We'll keep trying until names appear.",
      refine: "Keep typing to refine results",
      notFoundTitle: "Not finding your name?",
      notFoundText: "We'd love to have you with us. Send a request to join the celebration.",
      requestButton: "Request to Join",
    },
    invite: {
      title: "You are Invited",
      scriptFallback: "to our celebration",
      greeting: "Hello {name}, you are invited to our wedding!",
      seats: "We've reserved {count} for you.",
      seatSingular: "seat",
      seatPlural: "seats",
    },
    responded: {
      title: "Thank You for Responding!",
      text: "We've received your RSVP and look forward to celebrating with you!",
      attending: "You're Attending!",
      declined: "Unable to Attend",
      guestCountLabel: "Number of Guests",
      closeButton: "Close",
    },
    form: {
      attendLabel: "Can you attend? *",
      yes: "Yes!",
      no: "Sorry, No",
      companionsLabel: "Who's Coming With You?",
      companionsHint: "Please provide names and relationships for your {count} additional {guests}",
      guestSingular: "guest",
      guestPlural: "guests",
      companionTitle: "Guest {n}",
      companionNameLabel: "Full Name",
      companionNamePlaceholder: "Name of guest {n}",
      relationshipLabel: "Relationship with {name}",
      relationshipFallbackName: "Primary Guest",
      relationshipPlaceholder: "e.g., Spouse, Friend, Child, Parent",
      // One-tap relationship choices shown under the relationship field
      relationshipOptions: ["Spouse", "Partner", "Child", "Parent", "Sibling", "Friend"],
      companionProgress: "Guest {n} of {total}",
      companionsAdded: "{done} of {total} added",
      prevButton: "Back",
      nextButton: "Next guest",
      phoneLabel: "Phone Number *",
      phonePlaceholder: "09XX XXX XXXX",
      phoneNote: "For wedding updates only. Your number stays private and will never be shown to other guests.",
      submitting: "Submitting...",
      submit: "Submit RSVP",
    },
    phoneAlert: {
      title: "A phone number is needed",
      paragraphs: [
        "We ask for your number so we can reach you with important updates — seating, timing, or anything you may need on the day.",
        "Your number will not appear on this invitation, and it will not be shared with other guests. It is kept private and used only by us and our coordinators to take care of you.",
      ],
      button: "Add my number",
    },
    success: {
      title: "RSVP Confirmed",
      attending: "We're thrilled you'll be joining us — your spot is saved!",
      declined: "We'll miss you, but thank you for letting us know.",
      neutral: "Thank you for your response!",
      messagePrompt:
        "Before you go, leave a message for the couple — your words will be a cherished memory they can always look back on.",
      messageButton: "Leave a Message",
      laterButton: "Maybe later — close",
    },
    request: {
      title: "Request",
      script: "to join us",
      greetingNamed: "Hi {name} — want to celebrate with us? Send a request!",
      greeting: "Want to celebrate with us? Send a request!",
      optional: "(Optional)",
      nameLabel: "Full Name *",
      namePlaceholder: "Enter your full name",
      emailLabel: "Email Address",
      emailPlaceholder: "your.email@example.com",
      phoneLabel: "Phone Number",
      phonePlaceholder: "+63 912 345 6789",
      guestsLabel: "Number of Guests *",
      guestsPlaceholder: "How many guests?",
      messageLabel: "Message",
      messagePlaceholder: "Share why you'd like to join...",
      submitting: "Submitting...",
      submit: "Send Request",
      sentTitle: "Request Sent!",
      sentText: "We've received your request",
      sentSubtext: "We'll review it and get back to you soon",
      autoClose: "This will close automatically",
    },
    messages: {
      thankYou: "Thank you for your response!",
      requestSubmitted: "Request submitted! We'll review and get back to you.",
      loadFailed: "Failed to load guest list",
      selectAttendance: "Please select if you can attend",
      nameRequired: "Name is required",
      requestFailed: "Failed to submit request. Please try again.",
      submitFailed: "We couldn't save your RSVP. Please check your connection and try again.",
    },
  },
  // Messages wall (components/sections/message-wall-display.tsx)
  // Small decorations on each message card — leave "" to hide
  messageWall: {
    cardDecos: {
      topRight: DECOR.cornerTopRight, // sprig tucked in the card's top-right corner
      bottomLeft: "", // e.g. DECOR.cornerBottomLeft (sits behind the text — keep it subtle)
    },
  },
  // Book of guests (components/sections/book-of-guests.tsx) — confirmed guests come from the guest list API.
  bookOfGuests: {
    title: "Book of Guests",
    subtitle: "celebrating with us",
    description:
      "Meet the cherished souls joining us in celebration — your presence makes our day truly special.",
    statsEyebrow: "Our Celebration",
    guestSingular: "Guest",
    guestPlural: "Guests",
    statsCaption: "Celebrating With Us",
    rsvpSingular: "RSVP",
    rsvpPlural: "RSVPs",
    partySingular: "Party",
    partyPlural: "Parties",
    thankYou: "Thank you for confirming your RSVP — your presence means the world to us.",
    updatedLabel: "Updated",
    refreshLabel: "Refresh guest counts",
    listEyebrow: "Joining Us",
    listDescription: "A glimpse of the wonderful guests celebrating with us",
    vipLabel: "VIP",
    noTable: "No Table Yet",
    companionsLabel: "With Them",
    // Shown when a guest has more than 4 companions
    companionsMore: "+{count} more",
    companionsLess: "Show less",
    confirmedLabel: "Confirmed",
    emptyTitle: "Guest list updating",
    emptyText: "Confirmed guests will appear here as RSVPs come in.",
    // How many guest cards show at once (rotates every few seconds when there are more)
    cardsPerView: 4,
    // Corner florals (sized per corner like the loader), sprig above the title and
    // sprig at the end of the section — "" hides any of them.
    // On the invitation page Book of Guests shows the top corners and FAQ the bottom ones.
    decos: {
      ...CORNER_DECOS,
      headerOrnament: DECOR.headerOrnament,
      footerVine: DECOR.headerOrnament,
    },
    // Thin double border around the section (false hides it)
    showFrame: true,
  },
  // FAQ (components/sections/faq.tsx)
  // In answers you can use:
  //   {deadline}    → details.rsvp.deadline
  //   {coordinator} → details.rsvp.coordinator
  //   {contact}     → " at <phone>" when details.rsvp.phone is set (empty while "to be announced")
  //   [link text](#section-id) → a link that smoothly scrolls to that section
  //   A blank line (\n\n) starts a new paragraph; lines starting with "• " show as a bulleted list
  faq: {
    eyebrow: "A Few Notes",
    title: "Frequently Asked Questions",
    subtitle: "everything you need to know",
    description:
      "Helpful notes so you can simply arrive, celebrate, and enjoy this new chapter with us.",
    // Corner florals (sized per corner like the loader), sprig above the title and
    // sprig at the end of the section — "" hides any of them.
    // On the invitation page Book of Guests shows the top corners and FAQ the bottom ones.
    decos: {
      ...CORNER_DECOS,
      headerOrnament: DECOR.headerOrnament,
      footerVine: DECOR.headerOrnament,
    },
    // Thin double border around the section (false hides it)
    showFrame: true,
    // Answers: blank line = new paragraph, "• " = bullet, [label](#section) or [label](https://…) = link.
    // {deadline} {coordinator} {contact} {groom} {bride} are filled in automatically.
    items: [
      {
        question: "When and where is the wedding?",
        answer: `Our wedding will be on ${WEDDING_DAY}, ${WEDDING_DATE}. The ceremony begins at ${TIMES.ceremony}, followed by the reception at ${TIMES.reception}.\n\nBoth the ceremony and the reception will be held at ${CEREMONY_VENUE.name}, ${CEREMONY_VENUE.address}, so there is no need to travel between venues. [Open in Google Maps](${CEREMONY_VENUE.map})`,
      },
      {
        question: "What time should I arrive?",
        answer: `Please arrive by ${TIMES.guestArrival} so you have time to park, find your seat and settle in. The ceremony will begin promptly at ${TIMES.ceremony}.\n\nEntourage members are kindly requested to be at the venue by ${TIMES.entourageCall}.`,
      },
      {
        question: "How do I RSVP?",
        answer:
          "Please RSVP through the [guest list](#guest-list) on this invitation: search for your name and confirm your attendance.\n\nKindly respond by {deadline}.\n\nFor questions, please reach out to {coordinator}{contact}.",
      },
      {
        question: 'Do we still need to RSVP if we already said "Yes" to the couple?',
        answer:
          "Yes, please. Your formal RSVP helps us finalize the headcount for catering and seating, so every guest has a place prepared for them.",
      },
      {
        question: "What if I RSVP'd but can no longer attend?",
        answer:
          "We will miss you, and we understand that some things are beyond our control. Please let us know as soon as possible so we can reallocate your seat/s.",
      },
      {
        question: 'I said "No" but my plans changed. Can I still come?',
        answer:
          "Please message us first, as our guest list is limited. If a seat becomes available, we will let you know as soon as we can. Kindly do not attend unannounced, as we may not have a seat prepared for you.",
      },
      {
        question: 'Can I bring a "Plus One"?',
        answer:
          "As much as we would love to celebrate with everyone, our venue and guest list are limited. Our wedding is strictly by invitation, and only the names reserved for you on the guest list can be accommodated.",
      },
      {
        question: "Are children invited?",
        answer:
          "We love your little ones, but apart from the children in our entourage, our celebration is adults-only. We hope this gives you a relaxing evening off to celebrate with us!",
      },
      {
        question: "What should I wear?",
        answer:
          "Please follow the [attire guide](#details) in Event Details.\n\n• Guests: semi-formal in shades of dusty pink or gray. Ladies may wear a short or long dress; gentlemen may wear a polo or long-sleeve shirt with pants.\n• Principal sponsors: Ninang in a formal dress or long gown in cream or beige; Ninong in a long-sleeve barong with black pants.\n• Entourage: dusty pink gowns for the bridesmaids and flower girls; gray suits for the groomsmen and bearers.\n\nKindly avoid casual clothes and all-white outfits.",
      },
      {
        question: "May we choose our own seats at the reception?",
        answer:
          "We kindly ask that you take the seat reserved for you. Each table has been arranged with care so you can share the evening with the people we hoped you would sit with.",
      },
      {
        question: "Is there parking at the venue?",
        answer:
          "Yes, parking for cars and motorcycles is available inside the venue. Arriving a little early will give you time to park comfortably.",
      },
      {
        question: "Will the ceremony be unplugged?",
        answer:
          "Mostly. You may take a few photos, but please keep it minimal and avoid blocking or crowding our official photographers. We would love for everyone to stay present with us in the moment — professional photos will be shared after the wedding.",
      },
      {
        question: "Can I take photos and videos during the reception?",
        answer:
          "Absolutely! Capture all the joy you can. We would love to see your snaps, so please upload them through [Snap and Share](#snap-share).",
      },
      {
        question: "What if I have dietary restrictions or allergies?",
        answer:
          "Please let us know about any dietary restrictions or allergies when you RSVP so we can make sure you enjoy the celebration comfortably.",
      },
      {
        question: "What gift should we give?",
        answer:
          "Your presence and prayers are the greatest gifts of all. Should you wish to bless us further, please see our [gift guide](#registry).",
      },
      {
        question: "Can I share the invitation online?",
        answer:
          "Please keep this one just between us! Kindly refrain from posting our invitation on social media.",
      },
      {
        question: "May I make an announcement or a proposal during the wedding?",
        answer:
          "To keep the day centered on our celebration, we kindly ask that there be no surprise announcements or proposals during our wedding.",
      },
      {
        question: "When is the best time to take our leave?",
        answer:
          "It would mean so much if you could stay with us until the end of the program. We have prepared the evening with love, and we hope you will laugh, take photos and celebrate with us until the very last dance.",
      },
      {
        question: "How can I help make the day special?",
        answer:
          "• Pray with us for good weather and the Lord's continued blessings as we begin this new chapter as husband and wife.\n• RSVP as soon as your schedule is cleared.\n• Dress according to the attire guide and color palette.\n• Arrive on time.\n• Follow the seating arrangement at the reception.\n• Stay until the end of the program.\n• Join the activities and enjoy!",
      },
    ],
  },
  // Gift guide (components/sections/registry.tsx). The signature uses couple.groomNickname / brideNickname.
  registry: {
    eyebrow: "A Token of Love",
    title: "Gift Guide",
    subtitle: "with gratitude",
    description: "Your presence on our wedding day is the greatest gift of all.",
    paragraphs: [
      "Your presence and prayers are all that we request; but should you wish to bless us further, a monetary gift is one we humbly suggest.",
      "Your love and generosity mean the world to us.",
    ],
    thankYou: "Thank you for being part of our story.", // "" hides the line
    signOff: "With joyful hearts,",
    signature: "{groom} & {bride}", // "" falls back to "{groom} & {bride}" nicknames
    // Colors — any CSS color or a palette token from app/globals.css (e.g. "var(--color-motif-accent)")
    colors: {
      title: "var(--color-welcome-navy)",                                              // "Gift Guide", account names
      script: "var(--color-welcome-heading)",                                          // drop cap, couple signature
      eyebrow: "var(--color-welcome-heading)",                                         // small caps labels, icons
      body: "var(--color-welcome-text)",                                               // paragraphs
      soft: "color-mix(in srgb, var(--color-welcome-text) 75%, white)",                // "With joyful hearts," and secondary text
      card: "#FFFFFF",                                                                 // letter card
      cardEdge: "color-mix(in srgb, var(--color-motif-medium) 65%, transparent)",      // letter card border
      accountCard: "color-mix(in srgb, var(--color-motif-medium) 12%, white)",         // e-gift account card
      button: "linear-gradient(180deg, var(--color-welcome-heading) 0%, color-mix(in srgb, var(--color-welcome-heading) 72%, var(--color-welcome-navy)) 100%)", // gift seal, selected tab, Save QR
      line: "var(--color-motif-yellow)",                                               // sage dividers
      glow: "color-mix(in srgb, var(--color-motif-medium) 30%, transparent)",          // tab track / borders
      background: "var(--color-motif-cream)",                                          // section background
    },
    // E-gift accounts — optional, as many as you like.
    //   showAccounts: false hides the whole block
    //   show:  false hides one account
    //   qr:    "/QR/BPI.png" to show a QR image, or "" when you have no QR (card shows name + number only).
    //          Guests can tap the QR to enlarge it and save it with the "Save QR" button.
    //   accountNumber: shown under the name (display only)
    //   With 2+ visible accounts, guests switch between them with a toggle; each shows its QR and a "Save QR" button
    showAccounts: true,
    accountsTitle: "For e-gifts",
    accountsNote: "Choose an account, then scan its QR — tap the QR to enlarge.",
    saveQrLabel: "Save QR",
    zoomNote: "Scan with your banking or e-wallet app, or save it and upload from your gallery.",
    // ⚠ The QR file names are swapped — checked by decoding each QR:
    //   /QR/BDO.png → pays the GCash account (G-Xchange, "BR*******E L** A.")
    //   /QR/BPI.png → pays the BDO account (Banco de Oro, "Brei", account ending 8451)
    accounts: [
      { show: true, label: "GCash", accountName: "NI*A", accountNumber: "0955 087 ****", qr: "/QR/gcash1.jpg" },
      { show: true, label: "GCash", accountName: "AD***N", accountNumber: "0927 170 ****", qr: "/QR/gcash2.jpg" },
    ] as { show: boolean; label: string; accountName: string; accountNumber: string; qr: string }[],
    // Leave any path "" to hide that decoration
    decos: { ...SECTION_DECOS },
  },
  // Table finder page (/table — components/table-finder.tsx)
  tableFinder: {
    decos: { ...CORNER_DECOS },
    // "Find Your Table" QR card on the dashboard (components/table-finder-qr-card.tsx)
    // {couple} → "Groom & Bride" nicknames. "" hides a line or image.
    qrCard: {
      coupleNameImage: BRAND.coupleNameImage, // unused: the card sets the names in type like the loader
      coupleImage: "/Details/coupleimage.png", // couple illustration beside the text
      eyebrow: "The wedding of",
      title: "Find Your Table",
      script: "please be seated",
      description:
        "Place this code at the entrance. Guests scan it, search their name, and go straight to their table.",
      scanLabel: "Scan to find your table",
      buttonText: "Download QR",
      downloadNote: "Saves a print-ready PNG for signs and table cards.",
      previewText: "Preview seating page",
    },
  },
  // Entourage proposal pages (components/proposal-page.tsx)
  // Text placeholders: {name} = invitee, {role} = role title, {groom} / {bride} = nicknames.
  // Each invitation type has its own wording:
  //   party      → Best Man, Maid/Matron of Honor, Bridesmaid, Groomsman, Little Bride, secondary sponsors
  //   sponsor    → Principal Sponsors (Ninong / Ninang)
  //   bearer     → Ring / Coin / Bible / Herald Bearer
  //   flowerGirl → Flower Girl
  // A list ([...]) shows one paragraph per line; "" or [] hides that part.
  proposal: {
    decos: { ...CORNER_DECOS },
    coupleNameImage: BRAND.coupleNameImage, // unused: names are set in type like the loader
    coupleImage: "/Details/coupleimage.png", // couple illustration above the question
    ornament: DECOR.headerOrnament, // small sprig at the top of the card; "" to hide
    // Eucalyptus sprigs on either side of the couple name; "" to hide one
    nameDecos: { left: DECOR.sideLeft, right: DECOR.sideRight },
    showDate: true, // big date under the couple name (Month / Day / Day-number / Time / Year)
    // Use "Maid of Honor" for unmarried, "Matron of Honor" for married
    honorAttendant: "Matron of Honor" as "Matron of Honor" | "Maid of Honor",
    roles: proposalRoleDefinitions,
    roleIdAliases: proposalRoleIdAliases,
    // Shared labels used on every invitation.
    // Placeholders: {name} invitee, {role} role title, {groom} / {bride} nicknames.
    labels: {
      headerEyebrow: "A Personal Invitation",
      headerScript: "written just for you",
      saveTheDate: "Save the Date",
      roleOffered: "Your role",
      preparedFor: "Written for",
      askQuestion: "Will you be our",
      registeredName: "Your name on our list",
      returnButton: "Return to Our Wedding Page",
      saving: "Saving...",
      sending: "Sending...",
      sendButton: "Send My Response",
      goBack: "Go Back",
      saveError: "We couldn't save your response just now. Please try again.",
      // Shown when the invite link has no name and the guest says yes
      nameForm: {
        title: "You Said Yes",
        script: "our hearts are full",
        subheader: "Just one little thing",
        body: "We're so happy to have you with us! How would you like your name to appear on our invitation and guest list?",
        label: "Your Preferred Name",
        placeholder: "e.g. Tita Maria Clara / Mr. James Reyes",
        required: "Please type your preferred name so we can include you properly.",
        submit: "Confirm My Name",
        cancel: "Cancel",
      },
    },
    copy: {
      party: {
        greeting: "Dear",
        intro: [
          "Before anything else, we wanted you to hear this from us personally.",
          "We're getting married! After everything we've shared so far, we're ready to begin the next chapter of our lives together, and we couldn't wait to tell you.",
        ],
        body: [
          "This little letter isn't a general invitation. We wrote it with you in mind.",
          "When we pictured our wedding day, we thought about the people who have walked with us, laughed with us and cheered us on. Your name came up right away.",
          "We would love for you to be more than a guest. We'd love you right beside us, sharing the nerves, the joy, the happy tears and every memory we'll keep from that day.",
        ],
        askLead: "So, with all our hearts, we'd like to ask you",
        askNote:
          "We know it takes a bit of your time and effort, and we don't take that lightly. More than anything, we just want you there with us, celebrating this moment together.",
        yesButton: "Yes, I'd Love To!",
        noButton: "I Can't, But With Love",
        signOff: "With all our love,",
        yes: {
          title: "You Said Yes",
          script: "thank you",
          subheader: "You just made our day",
          roleLine: "Standing with us as our {role}",
          body: [
            "Thank you, {name}. Knowing you'll be right beside us makes our wedding feel even more like us. We can't wait to celebrate, laugh, and make memories with you. We'll be in touch soon with all the little details!",
          ],
          signOff: "With so much love,",
        },
        no: {
          title: "Thank You",
          script: "for telling us",
          subheader: "We completely understand",
          body: [
            "Thank you for taking the time to read our letter and think it over. There are truly no hard feelings. Whether you're beside us or cheering from wherever you are, we're grateful to have you in our lives.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "with love",
          subheader: "Your reply has reached us",
          body: [
            "We hope you'll still celebrate with us in your own way. Your love and good wishes mean the world to us.",
          ],
          signOff: "With love and warmest wishes,",
        },
      },
      sponsor: {
        greeting: "Dear",
        intro: [
          "We wanted to share some happy news with you, and we wanted you to hear it from us first.",
          "We're getting married, and we're about to begin a new life together as husband and wife.",
        ],
        body: [
          "This letter is not a general invitation. It's a personal request, written especially for you.",
          "As we prepare for this day, we keep thinking of the people we look up to. You have shown us, in ways you may not even realize, what a loving and faithful life looks like.",
          "To us, a {role} is more than a name in our program. It is someone whose wisdom we trust, whose prayers we hold dear, and whose example we hope to follow as we build our own home.",
        ],
        askLead: "With deep respect and sincerity, we'd like to ask you",
        askNote: "Having you stand with us, and having your blessing on our marriage, would mean more to us than we can say.",
        yesButton: "Yes, I'd Be Honored 🤍",
        noButton: "I Can't, But With Love",
        signOff: "With love and respect,",
        yes: {
          title: "You Said Yes",
          script: "thank you",
          subheader: "We are truly honored",
          roleLine: "Our {role}",
          body: [
            "Thank you, {name}, for accepting this role with such an open heart. Your guidance and prayers mean so much to us, and we're grateful to begin our marriage with you beside us. We'll reach out soon with the details.",
          ],
          signOff: "With love and heartfelt gratitude,",
        },
        no: {
          title: "Thank You",
          script: "for your kindness",
          subheader: "We completely understand and respect your decision",
          body: [
            "Thank you for reading our letter and giving our request your thought. There are no hard feelings at all. We're simply grateful for you, and we'd be happy to have your prayers and blessings in whatever way you can share them.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "with gratitude",
          subheader: "Your reply has reached us",
          body: [
            "Thank you for being part of our story. Your love and good wishes mean the world to us.",
          ],
          signOff: "With love and warmest wishes,",
        },
      },
      bearer: {
        greeting: "Hi",
        intro: [
          "Guess what? We have the happiest news, and we wanted to tell you first! 🤍",
          "{groom} & {bride} are getting married!",
        ],
        body: [
          "Our wedding is going to be a very special day, and it wouldn't feel complete without you there with us.",
        ],
        askLead: "So we have a super important question, just for you:",
        askNote: "You'd get to walk down the aisle and carry something very precious for our ceremony. We think you'd be amazing at it!",
        yesButton: "Yes, I'd Love To! 🤍",
        noButton: "Maybe Next Time 🤍",
        signOff: "With lots of love,",
        yes: {
          title: "Yay!",
          script: "you said yes!",
          subheader: "You're officially on our team!",
          roleLine: "Our {role}",
          body: [
            "We're so excited to have you as our {role}! We can't wait to see you walk down the aisle. You have a very special job, and we know you'll do great. See you on our big day! 🤍",
          ],
          signOff: "With lots of love,",
        },
        no: {
          title: "That's Okay!",
          script: "we understand",
          subheader: "No worries at all 😊",
          body: [
            "Thank you for thinking about being our {role}. You are special to us no matter what, and we'd love to celebrate with you either way.",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "thank you",
          subheader: "Thanks for letting us know",
          body: ["You are so special to us, and we can't wait to celebrate with you."],
          signOff: "With lots of love,",
        },
      },
      flowerGirl: {
        greeting: "Hi",
        intro: [
          "Guess what? We have the happiest news, and we wanted to tell you first! 🤍",
          "{groom} & {bride} are getting married!",
        ],
        body: [
          "Our wedding needs a little extra sweetness, lots of smiles, and a sprinkle of magic. We thought of you right away.",
        ],
        askLead: "And we have a very special role we'd love for you to have:",
        askNote: "You'd get to walk down the aisle before the bride and make our day even more beautiful. We think you'd be perfect!",
        yesButton: "Yes, I'd Love To! 🌸",
        noButton: "Maybe Next Time 🤍",
        signOff: "With lots of love,",
        yes: {
          title: "Yay!",
          script: "you said yes!",
          subheader: "We're so happy you'll be our Flower Girl!",
          roleLine: "Our {role}",
          body: [
            "We can't wait to see you walk down the aisle! Have fun, smile big, and enjoy every moment. See you on our big day! 🤍",
          ],
          signOff: "With lots of love,",
        },
        no: {
          title: "That's Okay!",
          script: "we understand",
          subheader: "No worries at all 😊",
          body: [
            "Thank you for thinking about being our Flower Girl. You are special to us no matter what, and we'd love to celebrate with you either way!",
          ],
        },
        sent: {
          title: "Response Sent",
          script: "thank you",
          subheader: "Thanks for letting us know",
          body: ["You are so special to us, and we can't wait to celebrate with you."],
          signOff: "With lots of love,",
        },
      },
    },
  },
  details: {
    rsvp: { ...RSVP },
  },
  contact: {
    bridePhone: "to be announced",
    groomPhone: "to be announced",
    email: "to be announced",
  },
  giftRegistry: {
    // QR_1:{
    // id: "BPI",
    // src: "/QR/BPI.png",
    // label: "BPI",
    // accountNumber: "KAMS : ***********569",
    // },
    // QR_2:{
    // id: "MariBank",
    // src: "/QR/MariBank.png",
    // label: "MariBank",
    // accountNumber: "****7672",
    // }
    // ,
    // QR_3:{
    // id: "Gcash",
    // src: "/QR/pleaseProvideQR.png",
    // label: "Gcash",
    // accountNumber: "to be announced",
    // }
  },
  // Built from QUICK SETUP — edit the values at the top of the file
  ceremony: {
    location: CEREMONY_VENUE.name,
    venue: CEREMONY_VENUE.address,
    map: CEREMONY_VENUE.map,
    date: WEDDING_DATE,
    day: WEDDING_DAY,
    time: TIMES.ceremony,
    entourageTime: TIMES.entourageCall,
    guestsTime: TIMES.guestArrival,
    image: CEREMONY_VENUE.photos,
  },
  reception: {
    location: RECEPTION_VENUE.name,
    venue: RECEPTION_VENUE.address,
    map: RECEPTION_VENUE.map,
    date: WEDDING_DATE,
    day: WEDDING_DAY,
    time: TIMES.reception,
    image: RECEPTION_VENUE.photos,
  },
  dressCode: {
    theme: "Whimsical Spring Minimalist",
    sponsors: {
      title: "Sponsors",
      ninang: {
        label: "Ninang",
        description: "Long gown in the shade of silver gray.",
        image: "/Details/Ninang.png",
        palette: ["#D8D3CD", "#C0C0C0", "#A9A9A9", "#969090", "#8C8686"],
      },
      ninong: {
        label: "Ninong",
        description: "Barong Tagalog and black slacks.",
        image: "/Details/Ninong.png",
        palette: ["#D0A386", "#E3C5B3", "#E4DCD1"],
      },
    },
    entourage: {
      title: "Entourage",
      bridesmaid: {
        label: "Bridesmaids",
        description: "Long gown that suits our color motif.",
        image: "/Details/bridesmaid.png",
        palette: ["#B4A3D4", "#C8A2C8"],
      },
      groomsmen: {
        label: "Groomsmen",
        description: "Long sleeve Barong Tagalog and black slacks.",
        image: "/Details/Groomsmen.png",
        palette: ["#D0A386", "#E3C5B3", "#E4DCD1"],
      },
    },
    guests: {
      title: "Guests",
      label: "Guests",
      description: "Casual attire: Whimsical Spring.",
      image: "/Details/guest.png",
      palette: ["#835643", "#C48C73", "#E3CAC5", "#CBAFA1", "#F2E9E2"],
    },
    paletteNote:
      "Our theme is Whimsical Spring Minimalist. Entourage: women, a flowy spring sage green dress, strictly floor length; gentlemen, a black and white suit, a white and gray suit, or sage green long sleeves with gray or brown pants — strictly no rubber shoes. Guests: casual attire, Whimsical Spring.",
    closing:
      "Thank you for helping us bring our wedding vision to life. We can't wait to celebrate with you!",
    note: "We kindly request our guests to dress in attire following our Whimsical Spring Minimalist palette.",
  },
  narratives: {
    ourStory: `Once upon a signature…

Our story began with a simple signature, one that slowly turned into something magical. He was my financial advisor, and I was there to sign documents. It was July 5, 2021, and we met at the Lobby of the building. Little did we know, that ordinary day would start a story neither of us expected.

I wasn't looking for anything, yet somehow, our connection grew in its own gentle, unexpected way. And then, on June 1, 2022, our story truly began—we became us. We found a love that feels like home.

Our journey wasn't rushed, but perfectly timed. We believe that God brought us together in His own way and season.

With hearts full of gratitude, we step into this new chapter hand in hand, trusting His plan and celebrating a love rooted in faith, patience, and grace.

Today, we choose each other- again and again- and we can't wait to celebrate this new chapter with the people we love most.`,
    groom: `The first time Mark saw Catherine, time seemed to slow down. It was an ordinary day that instantly became unforgettable: one smile, one hello, and suddenly his world had a new center. He didn't have the perfect words ready, but he knew he had met someone who felt like home.

Early conversations turned into late-night talks, sharing dreams, favorite meals, and whispered prayers for a future together. With every small adventure—coffee runs, long drives, quiet walks—Mark found himself choosing her over and over again. He loved how she laughed freely, how she listened with her whole heart, and how her faith steadied him.

There were seasons of distance and long workdays, but every reunion reminded him why he stayed patient: because Catherine was worth every mile and every minute apart. When he finally knelt to ask for her hand, it wasn't a question of "if," only "when can we start forever?"`,
    bride: `Catherine remembers the first time Mark said her name. It was gentle but sure, a kindness that made her feel both seen and safe. In that softness, she found a partner who met her with the same grace she prayed to give.

Mark's steadiness won her heart: the way he showed up, even when schedules were tight, and how he always found lightness in the small things. He celebrated her wins, held space for her worries, and never hesitated to choose "us" in every decision.

Now, as they prepare to say yes before God and the people they love most, Catherine is grateful for the patience, humor, and hope Mark brings to every day. She knows this next chapter is just the start of the love story they get to write together.`,
  },
  colors: {
    primary: "#87AE73",
    secondary: "#F5F5DC",
  },
  // Wedding playlist (components/sections/wedding-playlist.tsx). {couple} → "Groom & Bride" nicknames.
  playlist: {
    eyebrow: "Our Soundtrack",
    title: "A Playlist from our hearts",
    script: "songs of our love",
    subtitle: "Songs that have been part of our journey together",
    // Shown on the playlist card
    cardEyebrow: "Spotify Playlist",
    playlistName: `${COUPLE_LABEL} Wedding`,
    cardNote: "Press play and listen along — every song holds a little piece of our story.",
    buttonText: "Open in Spotify",
    // Corner florals (sized per corner like the loader) — "" hides any of them
    decos: { ...CORNER_DECOS, headerOrnament: DECOR.headerOrnament },
    // Thin double border around the section (false hides it)
    showFrame: true,
    embedUrl:
    //https://open.spotify.com/embed/playlist/5sT43YjdM8pJ3xtEkrxyEY?utm_source=generator&si=e5e64aa63fd04356
      "https://open.spotify.com/embed/playlist/5ZNTnGQuZwJF7qehJGyjrt?utm_source=generator&si=f625387fd73f4c1e",
    spotifyUrl: "https://open.spotify.com/playlist/5ZNTnGQuZwJF7qehJGyjrt?si=t-J1gI0TRW2k8PDANn4iPQ",
  },
  // Closing "See you there!" section (components/sections/see-you-there.tsx).
  //   photos mode (loadingScreen.display "photos") → full-screen couple photo
  //   plain mode  (loadingScreen.display "plain")  → botanical card, no photo
  // {couple} → "Groom & Bride" nicknames.
  seeYouThere: {
    titleLine1: "See you",
    titleLine2: "there!",
    // Full-bleed photos: crossfade on mobile, side-by-side triptych on md+ (portrait shots work best)
    photos: [COUPLE_PHOTOS[4], COUPLE_PHOTOS[5], COUPLE_PHOTOS[6]],
    photoAlt: "{couple}",
    eyebrow: "Until we meet",
    script: "with love, {couple}", // "" hides it
    message: "We can't wait to celebrate this beautiful day with you.", // "" hides it
    // Plain mode
    plain: {
      eyebrow: "Until we meet",
      script: "with love, {couple}",
      message: "We can't wait to celebrate this beautiful day with you.",
      // Corner florals — top two here, bottom two on the footer below; "" hides any of them
      decos: { ...CORNER_DECOS, footerVine: DECOR.headerOrnament },
      // Thin double border around See You There + footer (false hides it)
      showFrame: true,
    },
  },
  // Footer (components/sections/footer.tsx).
  // {couple} → "Groom & Bride" nicknames, {year} → current year. Date comes from ceremony, deadline from details.rsvp.
  footer: {
    showMonogram: true, // couple.monogram, tinted to the motif
    dateLabel: "Wedding Date",
    // Ceremony & reception at a glance (times and places come from ceremony / reception)
    summary: {
      show: true,
      ceremonyLabel: "Ceremony",
      receptionLabel: "Reception",
    },
    noteTitle: "A Note From Us",
    // Typed out one after another
    quotes: [
      '"I have found the one whom my soul loves." – Song of Solomon 3:4',
      "Welcome to our wedding website! We've found a love that's a true blessing, and we give thanks to God for writing the beautiful story of our journey together.",
      "Thank you for your love, prayers, and support. We can't wait to celebrate this joyful day together!",
    ],
    rsvp: {
      show: true,
      title: "RSVP Deadline",
      label: "Please respond by",
      note: "Please confirm your attendance by this date.",
      button: "Tap here to respond",
      href: "#guest-list",
    },
    // Social links — replace each href with your own profile link.
    //   show: false hides one; platforms: facebook | instagram | tiktok | youtube | twitter | threads | messenger | email
    //   email: use "mailto:you@example.com"; messenger: use "https://m.me/yourpage"
    followTitle: "Follow Us",
    followNote: "Share your photos and tag us — we'd love to see the day through your eyes.",
    socials: [
      { show: true, platform: "facebook", href: "https://www.facebook.com" },
      { show: true, platform: "instagram", href: "https://www.instagram.com/" },
      { show: true, platform: "tiktok", href: "https://www.tiktok.com/" },
      { show: true, platform: "youtube", href: "https://www.youtube.com" },
      { show: true, platform: "twitter", href: "https://x.com/" },
      { show: false, platform: "threads", href: "https://www.threads.net/" },
      { show: false, platform: "messenger", href: "https://m.me/" },
      { show: false, platform: "email", href: "mailto:" },
    ] as {
      show: boolean
      platform: "facebook" | "instagram" | "tiktok" | "youtube" | "twitter" | "threads" | "messenger" | "email"
      href: string
    }[],
    quickLinksTitle: "Quick Links",
    links: [
      { label: "Home", href: "#home" },
      { label: "Event Details", href: "#details" },
      { label: "RSVP", href: "#guest-list" },
      { label: "Gallery", href: "#gallery" },
      { label: "Messages", href: "#messages" },
      { label: "FAQ", href: "#faq" },
    ],
    copyright: "© {year} {couple} — crafted with love, prayers, and gratitude.",
    tagline: "This celebration site was designed to share our story and joy with you.",
    credit: {
      show: true,
      developedBy: "Developed by",
      developerName: "Lance Valle",
      developerUrl: "https://lance28-beep.github.io/portfolio-website/",
      promoText: "Want a website like this? Visit",
      promoName: "Wedding Invitation Naga",
      promoUrl: "https://www.facebook.com/WeddingInvitationNaga",
    },
    // Corner florals — bottom two here, top two on See You There above; "" hides any of them
    decos: { ...CORNER_DECOS, headerOrnament: DECOR.headerOrnament },
    // Thin double border when the footer is shown on its own (false hides it)
    showFrame: true,
  },
  // Snap & Share (components/sections/snap-share.tsx). {couple} → "Groom & Bride" nicknames.
  snapShare: {
    googleDriveLink:
      "https://drive.google.com/drive/folders/1_LvIc5I1fW7CaHJKs9Z46EZXpfTHvJ79?usp=sharing",
    albumQR: "/QR/AlbumQR.png",
    hashtag: HASHTAGS,
    instructions: "Please scan this QR Code and upload the photos and videos you have taken during our wedding reception. We are delighted to see your snaps too!",
    title: "Snap and Share",
    subtitle: "Share your memories",
    description:
      "Help us remember the little moments of {couple}'s day — every smile, embrace, and candid laugh. Your photos and clips complete our love story.",
    // "Our Favorite Moments" photo card — always hidden when loadingScreen.display is "plain"
    moments: {
      show: true,
      title: "Our Favorite Moments",
      caption: "Share your snapshots to be featured in our keepsake gallery.",
      // 3 portrait photos: one tall feature on the left, two stacked on the right
      images: [
        "/mobile-background/couple (1).webp",
        "/mobile-background/couple (2).webp",
        "/mobile-background/couple (12).webp",
      ],
    },
    website: {
      show: true,
      title: "Share Our Wedding Website",
      description:
        "Spread the word about {couple}'s celebration. Share this QR code so friends and family can join us.",
      downloadButton: "Download QR",
      note: "Scan with any camera app to open the full invitation and schedule.",
    },
    hashtags: {
      show: true,
      title: "Wedding Hashtags",
      copy: "Copy",
      copied: "Copied",
      copyAll: "Copy All",
      allCopied: "All Copied!",
    },
    social: {
      show: true,
      title: "Share on Social Media",
      description: "Help spread the word about {couple}'s wedding across your favorite platforms.",
      // Remove any you don't want: "instagram" | "facebook" | "tiktok" | "twitter"
      platforms: ["instagram", "facebook", "tiktok", "twitter"] as ("instagram" | "facebook" | "tiktok" | "twitter")[],
      shareText: "Celebrate {couple}'s wedding! Explore the details and share your special memories:",
    },
    // Shown only when googleDriveLink is set
    upload: {
      badge: "Upload Your Photos & Videos",
      scanNote: "Scan with your camera app",
      copyLink: "Copy Link",
      copied: "Copied!",
      downloadQr: "Download QR",
      uploadButton: "Upload Photos",
    },
    closing:
      "Thank you for helping make {couple}'s wedding celebration memorable. Your photos and messages create beautiful memories we will treasure for a lifetime.",
    closingTag: "Thank you for sharing the joy",
    // "Puhon" banner — text comes from loveStory.closing*; photos crossfade behind it
    puhon: {
      show: true,
      images: [
        "/desktop-background/couple (11).webp",
        "/desktop-background/couple (5).webp",
        "/desktop-background/couple (2).webp",
      ],
      intervalMs: 5000, // time each photo stays before fading to the next
    },
  },
  accommodation: {
    coordinator: {
      name: RSVP.coordinator,
      phone: RSVP.phone,
    },
    hotels: [
      {
        name: "La Luna Resort",
        discount: "Offered 20% discount for early booking",
        facebook: "https://www.facebook.com/lalunabeachresortofficial",
      },
      {
        name: "GOSAM Beach Resort",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/profile.php?id=100083461714073",
      },
      {
        name: "Calicoan Villa",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/CalicoanVilla",
      },
      {
        name: "G Camp Beachfront",
        discount: "Offered 10% discount",
        facebook: "https://www.facebook.com/profile.php?id=100085772194096",
      },
      {
        name: "Punta Viajero Beach Resort",
        discount: "Offered 15% discount",
        phone: "0932 214 6408",
        facebook: "https://www.facebook.com/puntoviajeroresort",
      },
      { name: "Balay Sunset" },
      { name: "Balay Pacifico" },
      { name: "Casa Nala" },
      { name: "The Grey Inn" },
    ],
    carRentals: [
      {
        name: "Apex Car Rental Tacloban",
        facebook: "https://www.facebook.com/profile.php?id=61574882327115",
      },
      {
        name: "Cassey Wheels Car Rental",
        facebook: "https://www.facebook.com/search/top?q=casseywheels%20car%20rental",
      },
    ],
  },
}
