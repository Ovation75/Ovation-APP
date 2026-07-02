---
version: alpha
name: BROADSIDE
description: A bold flat editorial broadside design system built on hard 2px ink rules, oversized display type, and saturated signal color blocks against a warm cream paper background.
theme: light

colors:
  paper:      "#F4EFE5"
  stock:      "#EBE4D2"
  bone:       "#FBF8F1"
  ink:        "#0A0A0A"
  ink-soft:   "#1F1B16"
  muted:      "#6B6357"
  signal:     "#FF2D1A"
  acid:       "#D4FF3D"
  cobalt:     "#1635E8"
  on-ink:     "#F4EFE5"
  on-signal:  "#FBF8F1"
  on-acid:    "#0A0A0A"
  on-cobalt:  "#FBF8F1"
  primary:    "#FF2D1A"
  secondary:  "#D4FF3D"
  tertiary:   "#1635E8"
  neutral:    "#0A0A0A"
  surface:    "#F4EFE5"
  on-surface: "#0A0A0A"
  border:     "#0A0A0A"
  focus:      "#1635E8"
  error:      "#FF2D1A"

typography:
  display-family: "Archivo Black, Arial Black, sans-serif"
  body-family:    "Inter, system-ui, -apple-system, sans-serif"
  mono-family:    "JetBrains Mono, ui-monospace, SF Mono, monospace"
  hero:
    family: "Archivo Black"
    size: "12rem"
    weight: 900
    lineHeight: 0.92
    tracking: "-0.02em"
    case: uppercase
  display-xl:
    family: "Archivo Black"
    size: "5.5rem"
    weight: 900
    lineHeight: 0.92
    tracking: "-0.02em"
    case: uppercase
  display-lg:
    family: "Archivo Black"
    size: "3.5rem"
    weight: 900
    lineHeight: 0.92
    tracking: "-0.02em"
    case: uppercase
  display-md:
    family: "Archivo Black"
    size: "2.25rem"
    weight: 900
    lineHeight: 1.0
    tracking: "-0.01em"
    case: uppercase
  headline-lg:
    family: "Inter"
    size: "1.5rem"
    weight: 700
    lineHeight: 1.1
  headline-md:
    family: "Inter"
    size: "1.125rem"
    weight: 700
    lineHeight: 1.2
  body-md:
    family: "Inter"
    size: "1rem"
    weight: 400
    lineHeight: 1.5
  body-sm:
    family: "Inter"
    size: "0.875rem"
    weight: 400
    lineHeight: 1.5
  label-sm:
    family: "JetBrains Mono"
    size: "0.75rem"
    weight: 500
    tracking: "0.12em"
    case: uppercase
  micro:
    family: "JetBrains Mono"
    size: "0.6875rem"
    weight: 500
    tracking: "0.12em"
    case: uppercase

rounded:
  none: "0"
  sm:   "0"
  md:   "0"
  lg:   "0"
  xl:   "0"
  full: "999px"

spacing:
  "2xs": "0.25rem"
  xs:    "0.5rem"
  sm:    "0.75rem"
  md:    "1rem"
  lg:    "1.5rem"
  xl:    "2rem"
  "2xl": "3rem"
  "3xl": "4.5rem"
  "4xl": "7rem"
  gutter:        "1.5rem"
  container-max: "1280px"

borders:
  hair: "1px"
  rule: "2px"
  bold: "4px"
  default: "2px solid {colors.ink}"

elevation:
  flat:          "none"
  offset-ink:    "6px 6px 0 0 {colors.ink}"
  offset-signal: "6px 6px 0 0 {colors.signal}"
  offset-acid:   "6px 6px 0 0 {colors.acid}"
  offset-cobalt: "6px 6px 0 0 {colors.cobalt}"

focus:
  ring: "0 0 0 3px {colors.acid}, 0 0 0 5px {colors.ink}"

motion:
  duration-fast: "90ms"
  duration-base: "140ms"
  ease-hard:     "cubic-bezier(0.2, 0.9, 0.2, 1)"

components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    border: "2px solid {colors.ink}"
    typography: "{typography.body-md}"
    case: uppercase
    tracking: "0.06em"
    rounded: "{rounded.none}"
    padding: "0.875rem 1.5rem"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.acid}"
    transform: "translate(-2px, -2px)"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1.5rem"
    height: "52px"
  button-secondary-hover:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.none}"
  input-field:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1rem"
    placeholderTypography: "{typography.label-sm}"
  input-field-focus:
    backgroundColor: "{colors.paper}"
    border: "2px solid {colors.cobalt}"
    ring: "inset 0 0 0 2px {colors.cobalt}"
  card:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.5rem"
    elevation: "{elevation.flat}"
  card-header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label-sm}"
    padding: "1rem 1.5rem"
  card-offset:
    elevation: "{elevation.offset-signal}"
  checkbox:
    backgroundColor: "{colors.paper}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.none}"
    size: "22px"
  checkbox-checked:
    backgroundColor: "{colors.acid}"
    markColor: "{colors.ink}"
  tabs:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.none}"
  tabs-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.acid}"
    underline: "3px solid {colors.acid}"
  chip:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.ink}"
    rounded: "{rounded.full}"
    typography: "{typography.label-sm}"
    padding: "0.25rem 0.75rem"
  sticker:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    border: "2px solid {colors.ink}"
    transform: "rotate(-2deg)"
    typography: "{typography.label-sm}"
  marquee:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border-y: "2px solid {colors.ink}"
    typography: "{typography.label-sm}"
    height: "auto"
    animation: "marquee-slide 28s linear infinite"
  alert-danger:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    border: "2px solid {colors.ink}"
  alert-success:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.on-acid}"
    border: "2px solid {colors.ink}"
---

## Overview

BROADSIDE treats the screen like a printed protest poster. The system is built on three uncompromising moves: monumental display type set in condensed black letterforms, hard 2px ink rules that frame every surface, and solid blocks of saturated signal color used like ink on stock. There are no shadows, no gradients, no blurs, no glass. Depth is suggested only by overlapping framed blocks and the occasional offset duplicate sitting flat behind a surface.

The system is light by theme but never quiet. The warm cream `paper` ground (`#F4EFE5`) reads as stock rather than as a neutral UI background. Against that ground, a near-black `ink` (`#0A0A0A`) carries type and borders, while three signal colors — signal red, acid chartreuse, and cobalt blue — punch through as emphasis. The centered hero is the system's anchor: an oversized display headline that takes the full width of the page and dares the rest of the layout to keep up.

BROADSIDE is intended for editorial product surfaces, manifesto-driven landing pages, opinionated marketing, indie tools, and any interface that benefits from feeling printed rather than rendered. It is deliberately not a neutral SaaS kit.

## Colors

The palette is split into four roles:

- **Stock.** `paper` is the primary background. `stock` is a half-step recessed surface used for input fields and inset panels. `bone` is a half-step elevated surface used for cards and chips.
- **Ink.** `ink` (`#0A0A0A`) is the sole border color and the dominant type color. `ink-soft` and `muted` are reserved for secondary copy.
- **Signal.** Three colors carry emphasis and never share a surface unless intentionally. `signal` (red, `#FF2D1A`) is reserved for primary actions, hero accents, and danger. `acid` (`#D4FF3D`) marks highlights, active tab text, checkbox fill, and focus rings. `cobalt` (`#1635E8`) is informational — links, tertiary chips, and selected-input affordances.
- **On-color.** `on-signal`, `on-acid`, `on-cobalt`, and `on-ink` are paired contrast colors. Acid uses ink-on-acid for legibility; signal and cobalt use bone-on-color.

Contrast notes: ink on paper meets WCAG AAA. Acid blocks pair with ink type only; ink-on-acid is the only sanctioned combination on that fill. Signal red is reserved for short labels, buttons, and short headline runs because of luminance.

## Typography

Three families, no serifs:

- **Archivo Black** (Google Fonts) — the display voice. Used at hero scale up to 12rem with uppercase and -0.02em tracking. Reserved for display levels and card titles. Never used at body sizes.
- **Inter** (Google Fonts) — the body and interface voice. Used in weights 400 to 700 for paragraphs, labels on buttons, navigation items, headlines, and form copy.
- **JetBrains Mono** (Google Fonts) — the meta voice. Used uppercase with 0.12em tracking for labels, counters, chips, tags, marquee text, and any numeric or technical content. The monospaced family is the system's tactile signature.

Hierarchy is established by size and weight contrast, not by color. Display type is dramatically larger than body type — usually 8x or more — so that a hero headline is unmistakable as the page's primary entry point. There is no hard subheadline level between display and body; the system uses mono labels above and below display headlines as the visual link.

## Layout

The page is organized as a vertical stack of framed bands. Each band stretches to the viewport width and is separated by hard `2px` ink rules. Inside each band, content sits inside a centered container capped at 1280px with 1.5rem gutters.

The hero band is always centered. Headlines run to the container edges or beyond, with eyebrow labels and CTAs centered below. Body bands use a 2/3/4 column responsive grid that collapses to one column under 720px. Generous negative space is intentional — type and color blocks are the layout, and white space is the silence around the shout.

Rotation is used sparingly. Stickers and tags rotate -2° to 3° to break the rectangular grid without softening it. Cards, buttons, and inputs never rotate.

## Elevation & Depth

The system is flat by definition. There are no shadows, no blurs, and no gradients in any component token. Depth is conveyed through three mechanisms only:

1. **Color contrast.** A bone card on paper reads as elevated. A stock field inside an ink frame reads as inset.
2. **Framed overlap.** Two ink-framed blocks can overlap, with the front block visually on top. This is the dominant editorial depth move.
3. **Offset duplicate.** A solid color block sitting 6px to the lower-right of an ink-framed block produces a hard, printed-paper depth. Used sparingly on the primary CTA and the signature element. The offset is never blurred and never softened.

The system token `elevation.flat` is the default. The `offset-*` tokens are reserved for emphasis surfaces.

## Shapes

Hard rectangles are the default. Cards, buttons, inputs, fields, headers, alerts, panels, and dialogs all use `rounded.none` (0px radius). Sharp corners and 2px borders are the system's shape language — they are not subtractive decoration but the primary visual rhythm.

The pill radius (`rounded.full`, 999px) is reserved for chips, badges, radio buttons, switch tracks, and the marquee strip. The tension between hard rectangles and full pills is intentional: it gives the system a tactile, slightly chaotic editorial feel without compromising the flat-rectangle dominance.

Custom geometry: the checkbox is a hard 22px square with a 2px ink frame and a notched ink check on acid fill. The brand mark is a 14px ink-framed signal-red square that anchors the wordmark — a printed-color-bar reference.

## Components

### Buttons

The button is the system's clearest expression. A solid fill, a 2px ink frame, uppercase Inter at weight 700 with 0.06em tracking, and zero radius. There are six fill variants:

- `btn--primary` — signal red on ink frame, bone text. Used for the single most important action on any view.
- `btn--secondary` — paper on ink frame. Used for secondary actions adjacent to a primary.
- `btn--ink` — ink on ink frame, on-ink text. Used for dark backgrounds or to invert a section.
- `btn--acid` — acid on ink frame. Used for highlight CTAs and active-state buttons.
- `btn--cobalt` — cobalt on ink frame. Used for informational or link-style CTAs.
- `btn--ghost` — transparent on ink frame. Used inside dense lists and toolbars.

Hover translates the button -2px on both axes — a hard offset that mimics lifting a print plate. Active reverses it. The `btn--offset` modifier reveals a hidden colored offset block 6px behind the button, which collapses to 3px on hover. Disabled buttons drop to 50% opacity and lose pointer events.

### Inputs

Inputs are stock-cream rectangles inside 2px ink frames with sharp corners. Placeholder copy is uppercase JetBrains Mono in muted ink. On hover, the field lifts to bone. On focus, the field switches to paper and the frame becomes cobalt, with an inset 2px cobalt ring for unmistakable focus identification. Invalid fields swap the frame to signal red. Labels and hints above and below the field use mono uppercase at 0.75rem and 0.6875rem respectively. `select` elements use a hand-drawn ink chevron rendered with two CSS gradients instead of an SVG.

The `input-group` wraps an input and an ink addon (such as a unit, prefix, or action label) inside a shared frame, giving paired affordances a single border treatment.

### Cards

A card is a bone (or paper) surface inside a 2px ink frame. It has three optional sub-regions: a colored header bar, a body, and a footer. The header carries a mono uppercase title and may be filled with ink, acid, signal, or cobalt to categorize the card. The body uses Inter for prose and an oversized Archivo Black title where editorial weight is needed. The footer uses stock cream and hard ink rules above. Cards may carry a rotated sticker tag pinned to the top-right and may opt into an offset color block behind the frame.

### Checkboxes & Radios

A 22px hard square frame with a 2px ink border. Unchecked is paper. Checked swaps the fill to acid and reveals an ink notch check. Focus shows a cobalt outline. Radios use the same anatomy but with pill radius and an ink dot. The `.checkbox--lg` modifier scales the control to 28px for high-priority forms.

### Tabs

A row of framed buttons joined by shared 2px ink walls — no outer radius, no gap. The inactive tab uses paper on ink and Inter uppercase. The active tab swaps to ink fill with acid text and an acid underline at 3px. Hover lifts the tab to stock cream. Counters inside tabs sit in 18px-min acid blocks that swap to signal red on the active tab.

### Marquee Strip — signature element

A full-width horizontal band with 2px ink rules top and bottom, scrolling continuously left-to-right via a 28s linear CSS animation. Content is JetBrains Mono uppercase with bullet separators between phrases. Occasional phrases use the `marquee__phrase--punch` class to render in acid or signal red, creating a rhythmic editorial accent. Three fill variants — paper, ink, acid, and signal — let the strip act as section divider, hero banner, status bar, or footer. Motion is paused entirely under `prefers-reduced-motion: reduce`.

### Supporting elements

Chips and badges use the pill radius and mono uppercase labels, with ink, acid, signal, and cobalt fills. Stickers are rotated chips used for promotional or status flags. Icon tiles are 56px ink-framed squares carrying Phosphor icons at 28px in regular weight (the chosen icon library — see [Phosphor Icons](https://phosphoricons.com/), MIT-licensed). The navbar uses the same 2px ink-rule treatment with a brand mark, mono uppercase links, and a hard hover inversion. Alerts share the card frame anatomy and use signal red, acid, and bone as their semantic fills.

## Do's and Don'ts

**Do.**

- Set hero headlines large — at least 6rem on desktop, scaling to 12rem at viewport widths above 1400px. Crowding the display sizes defeats the system's point.
- Use exactly one primary CTA per view, in `btn--primary` with the `btn--offset` modifier on the hero.
- Pair acid fills with ink type only. Pair signal and cobalt fills with bone or paper type.
- Use the marquee strip as a deliberate section divider — one or two per page, not as continuous decoration.
- Use rotation only on stickers, chips, and tags, and only between -3° and 3°.
- Keep all corners sharp on rectangles and all chips/badges as full pills. The contrast between the two is the system's tension.

**Don't.**

- Don't introduce drop shadows, glassmorphism, gradients, or blurs. The system is flat by definition; any soft depth treatment breaks the language.
- Don't add `border-radius` to buttons, inputs, cards, panels, dialogs, or alerts.
- Don't use Archivo Black at body sizes or inside paragraphs. It is reserved for display levels and card titles.
- Don't combine multiple signal colors inside a single component fill (no signal + acid + cobalt blocks side by side inside one card). Use one signal at a time per surface and let ink and paper do the heavy lifting.
- Don't use serif fonts, custom SVG icons, or icons from libraries other than Phosphor. Mixing icon families dilutes the system's voice.
- Don't soften focus rings — the cobalt focus ring is part of the language, not an accessibility afterthought. Keep it visible and high-contrast.
