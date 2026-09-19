# Madhusudhan — brand website

Marketing site for Madhusudhan / SMC Agri Limited, implemented from the
[SMCAGRI Figma file](https://www.figma.com/design/sgFTPPaJyPOqnS58JZ9FvM/SMCAGRI).

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript** — static-rendered marketing pages, built-in font and image optimisation, one-click Vercel deploys.
- **Tailwind CSS v4** for utilities and brand tokens (`src/app/globals.css`); the hero uses a CSS module with container-query units so the composition keeps the design's proportions at any viewport ratio.
- **Fonts** via `next/font/google`: Geist (headings, nav), Poppins 300/700 (body copy, partner wordmarks), Kulim Park (EXPLORE and captions) — self-hosted at build time.
- No animation library: entrance choreography and idle motion are CSS keyframes; the footage player is a framework-free class.

## Run

```bash
npm install
npm run dev      # http://localhost:3040
npm run lint     # eslint
npx tsc --noEmit # typecheck
npm run build && npm start
```

## Structure

```
src/
  app/                    layout (fonts, metadata), page (section order), globals.css
  assets/sections/        statically imported section art (optimised by next/image)
  assets/products/        pack shots for the catalogue (shared by sections)
  assets/brand/           SMC logo (footer)
  components/
    layout/               SiteHeader (menu · brand · contact), SiteFooter (site-wide, #contact)
    sections/
      hero/               Hero, HeroVideo (poster + two <video> slides), ProductSlot, PartnerStrip
      farm-to-freezer/    "From Farm To Freezer" (Figma 63:3467 et al.)
      harvest/            "Harvest" (Figma 66:3523)
      better-way/         "How much could you grow": pinned corn-dip scene (Figma 68:3808), CornDipScene
      move-fast/          "Then we move fast" + IQF line footage (Figma 103:4250)
      freeze-fast/        "Freeze fast. Keep more", pinned bag → pack sweep (Figma 103:4340)
      product-universe/   "Goodness, ready when you are" product grid (Figma 119:627 in 1:3)
      farm-to-homes/      "From one farm to half a million homes" band above the footer (Figma 119:843)
    ui/                   RevealOnScroll (in-view entrances), SplitWords (word-by-word rise),
                          InViewVideo (plays in view: once or looping, buffers a screen ahead),
                          LoopVideo (background footage that never stops),
                          ScrollScene (track progress → --progress for pinned scenes),
                          ScrollProgress (element progress through a range → --p),
                          DotLink (the outlined "• Learn more •" link)
  data/                   products.ts (hero footage), catalogue.ts (product range), partners.ts,
                          navigation.ts (header + footer links, site facts)
  lib/                    hero-footage-player.ts (loops, circular product reveal, watchdog; no React),
                          use-scroll-progress.ts (scroll progress hook, layout read on resize only),
                          corn-dip-renderer.ts (canvas frame sequence for the pinned dip)
public/
  hero/                   pack thumbnails, EXPLORE ring/disc SVGs (from Figma)
  partners/               partner logos (blinkit)
  video/                  per-product footage: <slug>-v6-1080.mp4, -v6-portrait.mp4, posters;
                          section films (corn-dip-v1, iqf-line-v1, farm-montage-v1)
  frames/corn-dip-v4/     scrub frames f004–f095, painted p004–p022 (feathered alpha),
                          edges.webp / bottoms.webp / sky.webp (per-frame backdrop fills)
```

Each section owns a CSS module. Figma-exact sections use `--u` = one Figma pixel in container units (`calc(100cqw / 1430)`), so measurements are written as `calc(var(--u) * <figma px>)` and the composition scales with the viewport width.

## From Farm To Freezer

Eyebrow, two-line title, lede, then the harvest scene: the line-art field (64% opacity), the rotated corn cob and a frosted card. Entrances are driven by `RevealOnScroll` (`data-inview`), content stays visible without JS, and the line art drifts with scroll where `animation-timeline: view()` is supported. The card's copy ("Just drop it…") is the Figma placeholder from the reference site; replace it in `FarmToFreezer.tsx`.

**Corn journey** (scrubbed both ways by `ScrollProgress`, `--p` 0 with the scene's top at the top of the screen → 1 when its bottom is 15% from the top): the husk's leaves dissolve and the bare cob — the "How much could you grow" cob, fitted onto the husked one by a kernel-overlap search (scale 0.84, −4°, offset 13.28% / −12.24% about its centroid) — shows through, turns upright and drops. The drop first cancels the page scroll (the cob holds still while its leaves come off), then adds an eased-in fall of 60% of the screen, so it sinks into the rising edge of Harvest, which clips it.

## Harvest

Split section: footage on the left with a white statement (lines rise in; the small print reveals word by word with Figma's line breaks), eyebrow and title on the right, and a plant drawing.

- **Footage:** `public/video/farm-montage-v1-1080.mp4` (the supplied `farm_main_video.mp4`: farmer in the field, sprayer, drone, irrigation, greenhouse, pasture; H.264 CRF 25, 6.2 MB, no audio) via `LoopVideo` — muted loop, starts a screen before it arrives and never stops (any unrequested pause is recovered). Poster = its first frame.
- **Plant:** the filled layer rises from the ground to Figma's level (the bottom 25.85%) as the plant comes up the screen — `ScrollProgress` from its foot at the bottom edge to its foot at 55% of the height — and drains again when scrolling back. Without JS it shows the Figma level.
- **The statement copy comes from the reference site** (fertiliser messaging) — replace it before launch.

## How much could you grow (better-way)

**Desktop: one pinned screen** (`CornDipScene`, modelled frame by frame on the reference site's tablet drop). The page is held for 280svh of scroll while:

1. *approach* (first 40%): the title, pitch and cards scroll up and off the screen at page speed (`--a`), the water and the `smcagri` wordmark rise from below and ease into place (`--w`), and the crisp Figma corn starts to fall — from rest, gathering speed (8% of the screen);
2. *film* (last 60%): the corn-dip clip, scrubbed by the scroll in both directions, takes the corn into the water — splash, sinking, bubbles — while the camera eases down with it.

**One corn, one size, one continuous fall.** The Figma corn (`corn-cob.png`) is drawn by the canvas throughout, at the clip's scale (kernel widths matched, so nothing zooms). The clip starts scrubbing at exactly the speed the approach's fall ends with (Hermite time-warp, `m0` in the renderer), so the corn never stops; adjacent frames are cross-faded so slow scrolling stays smooth. Above the surface the Figma corn rides the clip corn's measured pose (drop by phase correlation, tilt about its middle) and is cut at the water line; under it, the clip shows the corn at the same size. Over frames 16–21 the painted frames cross-fade into the originals while the Figma corn fades, so the clip's corn takes over as it goes under.

**No box.** At the corn's scale the clip doesn't reach the screen edges, so every frame has feathered edges (baked into its alpha) over fills taken from that same frame: `edges.webp` (per frame, the left/right edge colour columns — median of 40 px, smoothed except at the water line), `bottoms.webp` (per frame, the water along the bottom edge, corn and bubbles masked out) and `sky.webp` (the still sky above, fading into the section gradient). The clip's sky doesn't move between frames (measured), so one sky serves all. `public/frames/corn-dip-v4/` holds the scrubbed frames f004–f095 (the clip from frame 26, every 2nd, graded to the section's lime) and p004–p022 (the clip's corn painted out above the water; p004 also under it) — 4.2 MB. Normal blending, so the corn stays crystal clear. Frames load two screens ahead of the section. The section clips with `overflow: clip` — `hidden` would break the sticky stage.

**Phones:** the old two-screen layout — Figma corn (image rotated −26.07°) with the copy, then `public/video/corn-dip-v1-1080.mp4` playing once in view.

Deviations: the headings use **Outfit** as a free stand-in for **Nohemi** (paid) — swap `--font-outfit` in `layout.tsx` for the licensed files. The pitch is set in the cards' olive instead of Figma's cream, which is ~1.1:1 on that part of the gradient. The pitch and card copy (incl. "CropTab™", another company's trademark) come from the reference site and must be replaced.

## Then we move fast (move-fast)

Split section like Harvest: title, statement (word by word) and Learn more on the cream panel; the right half plays `public/video/iqf-line-v1-1080.mp4` in a loop while in view. The clip is the IQF-line montage supplied as `Frozen_vegetables_falling_on_con…_20260919143722.mp4` (its first frame is the Figma still): Gemini star removed with the shared mask (`unblend.py`, same position as the other 1280×720 clips), upscaled to 1080p (lanczos + CAS 0.35), H.264 CRF 21 capped at 5.5 Mb/s. It is framed like Figma's footage box (715 × 1080 at y −162 → 120% of the half's height from −18%) and opens from the centre seam on reveal. **The statement is the reference site's copy** ("Farm Minerals", fertilisers) — replace it in `MoveFast.tsx`.

## Freeze fast. Keep more (freeze-fast)

Figma draws this frame twice: the clear IQF bag of frozen kernels, and 820px lower the same composition with the branded Madhusudan pack. It is built as one pinned screen: `ScrollScene` gives the section a 230svh track and writes `--progress`; the stage sticks for the whole track and a frost line sweeps down the product, turning the bag (below the line) into the pack (above it) between 20% and 75% of the scroll. Title, dot grid and glass cards stay put with a little parallax. The glow is Figma's radial (centre 715, 363; radius 978.5), scaled by the width horizontally so wide screens keep Figma's tinted corners, and the stage's bottom blends into the cream section colour.

- `iqf-bag.png` is Figma's image 25 (1024 × 1536).
- `assets/products/sweet-corn.png` (shared with Product universe) replaces Figma's image 26, which is only 180 × 215 (the hero thumbnail) and turns soft at 674px. It was cut from the hero corn clip's pack reveal: the pack is keyed off the red backdrop, squared up with a four-corner perspective warp, colour-matched to Figma's pack art and placed on Figma's canvas proportions. **Swap in the print artwork** when the client supplies it (same 180:215 canvas, pack body inset like Figma's).
- "Small technical statement" in the stat card is Figma's placeholder line.

## Product universe (product-universe)

Eyebrow, two-weight title and eight product cards (`src/data/catalogue.ts`) in three columns, each pack breaking out of the top of its lime-gradient card. One Figma px is `min(100cqw / 1430, 100svh / 956)`: the title plus the first row always fit one screen, and the remaining two rows fit the next. The frame is centred when the height is the limit. Rows rise in as they arrive; hovering a card lifts the pack and fills the ↗ tile. The section is the header menu's `#products` target. Cards are not links yet (no product pages) — wrap them when the routes exist.

Pack art: Figma only has 180 × 215 thumbnails for six of the eight packs. Baby corn and soya chaap are full-size exports, sweet corn reuses the sharp cut from freeze-fast, and mixed vegetables, green peas, french fries, jackfruit and matar paneer are the Figma thumbnails upscaled 3× (Lanczos + light sharpening). **Replace them with real packshots** (transparent PNG on the same 180:215 canvas) for crisp results.

## From one farm to half a million homes (farm-to-homes)

The #5c9105 band directly above the footer (Figma 119:843, 1430 × 605.66; `--u = min(100cqw / 1430, 100svh / 605.66)`, so it always fits one screen). Title, company line (word by word) and "Talk to our team" (DotLink in cream, fills cream with green text; → `#contact`) on the left. On the right, Figma's clipped collage: three photos and three olive "pixels" (flat #414f1e / #7c914c tiles — Figma exported them as images) set corner to corner. The tiles open one after another on reveal and, where scroll timelines exist, rise into place on the band's own timeline, landing exactly on Figma's grid once the band is in view. The grain photo had a corrupted, partly transparent 5px edge in the Figma export and is cropped to its clean 615px interior. **The three photos come from the reference site** (file names `american_upd`, `footer-2`) — replace them with SMC's own photography.

## Footer (layout/SiteFooter)

Figma 119:773, rendered site-wide from `layout.tsx`: logo, two link columns, the contact block (`#contact` — every "Contact us" / "Learn more" link lands here), LinkedIn, copyright (year from the build date), legal links and the Maple Studios credit. Scales with the width (`--u = min(100cqw / 1430, 100svh / 236)`), text floored at 10.5px. The logo is composed from Figma's two 134 × 78 crops (leaves + wordmark, stretched like the design) — swap in the vector logo when available. Pages that do not exist yet (about, sustainability, blog, legal) and the LinkedIn / credit URLs are `#` placeholders in `data/navigation.ts`.

## Hero

- **Composition.** One design unit `--s` is 1/100 of the hero width, capped by height (`min(1cqw, 1.45cqh)`), so flat viewports scale the type and controls down instead of overflowing. Horizontal positions are % of the width, vertical positions are `cqh`. Below 1024px the copy and controls reflow into a column.
- **No box around the video.** Desktop plays landscape footage edge to edge (`object-fit: cover`). Each clip is pre-composed onto its own studio backdrop continued to the frame edges, so calm phases (ring, pack) sit zoomed out while bursts play full frame (see *Footage pipeline*). Phones play portrait footage centred on the column's stage; its top and bottom fade into the product's `surround` colour, which the page also uses around it.
- **Picker.** The two thumbnails beside EXPLORE always show the products that are *not* playing. Pressing one plays it; the product that was playing takes its place in that slot. Presses are ignored while a switch is in flight (`aria-busy`).
- **Switching.** `HeroFootagePlayer` (`src/lib/hero-footage-player.ts`) keeps two full-hero slides. The new clip loads in the hidden slide; once it can play through, it is revealed by a soft-edged circle growing from the tapped thumbnail (a `mask-image` driven by the registered `--reveal` length), so the two scenes never mix colours. Loops dissolve over 0.55s so the pack reveal flows back into the ring.
- Playback pauses off-screen or in a hidden tab and resumes on return; reduced-motion users get the poster only; the other products' clips are pre-warmed after the first one plays.
- **Never stops:** a watchdog (every ~0.7s) restarts the active clip whenever it should be playing but is not (stall, stray pause, missed loop), and a clip that ends while the next product is loading keeps looping. Only a real autoplay refusal (`NotAllowedError`) waits for input — an `AbortError` from the player's own pause/src change used to be mistaken for one and could leave the hero frozen after scrolling away and back.

## Footage pipeline (scratchpad `v2/`, ffmpeg + Anaconda python)

| Step | Script | Notes |
|---|---|---|
| Watermark removal (corn) | `analyze.py` → `unblend.py` | Estimates the Gemini star's alpha mask from two frames with different backgrounds, inverts the blend on every frame, smooths a thin band around the outline. |
| Composition | `compose2.py <product> <landscape\|portrait>` | Clean plate (temporal median) → each edge's backdrop colour and gradient continued outward (C1, bounded) → per-side drift correction per frame → matched grain. Animated framing: zoomed out for ring/pack, zoomed in (rim off-canvas) while pieces cross the source edges. |
| Encode | `fast6.sh` | H.264 MP4 (`+faststart`, CRF 20 desktop / 22 phone, `cas=0.3`), JPEG posters. All six renders run in parallel. |

Files in `public/video/`: `<product>-v6-1080.mp4`, `<product>-v6-portrait.mp4`, `<product>-v6-poster.jpg`, `<product>-v6-portrait-poster.jpg`; section films `corn-dip-v1-*` and `iqf-line-v1-*`. They are served with immutable cache headers (`next.config.ts`); when a clip changes, bump the version in the file names and in `src/data/products.ts`.

## Assets

- `public/hero/product-sweet-corn.png`, `product-soya-chaap.png` — Figma exports. `product-mix-veg.png` was cut from the clip's pack reveal because the file has no packshot for it; replace when one is supplied.
- The SMC brand mark in `SiteHeader` and the "blinkit" wordmarks are placeholders drawn/typed in code; drop the real SVGs into `public/brand` / `public/partners` and reference them from `data/`.
