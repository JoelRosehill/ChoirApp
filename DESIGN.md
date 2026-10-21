---
name: Koris
description: A choir's attendance, woven one unit per singer on unbleached linen.
colors:
  linen: "oklch(95.5% 0.006 90)"
  linen-2: "oklch(92.5% 0.009 85)"
  field: "oklch(98.5% 0.004 90)"
  hair: "oklch(83% 0.012 70)"
  ink: "oklch(22% 0.014 35)"
  ink-2: "oklch(43% 0.014 35)"
  madder: "oklch(46% 0.165 27)"
  madder-press: "oklch(39% 0.145 26)"
  madder-tint: "oklch(92% 0.03 25)"
  on-madder: "oklch(97.5% 0.008 85)"
  ok: "oklch(44% 0.1 150)"
typography:
  numeral:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  date:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  section:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  brand:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.25
  answer:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.2
  subhead:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
    lineHeight: 1.5
  hint:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1
rounded:
  r: "3px"
spacing:
  u-1: "4px"
  u-2: "8px"
  u-3: "12px"
  u-4: "16px"
  u-5: "20px"
  u-6: "24px"
  u-8: "32px"
  u-10: "40px"
  u-12: "48px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "0 16px"
    height: "48px"
  button-hover:
    backgroundColor: "{colors.linen-2}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.madder}"
    textColor: "{colors.on-madder}"
    rounded: "{rounded.r}"
    padding: "0 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.madder-press}"
    textColor: "{colors.on-madder}"
  button-small:
    padding: "0 12px"
    height: "44px"
    typography: "{typography.body-small}"
  vote-yes-pressed:
    backgroundColor: "{colors.madder}"
    textColor: "{colors.on-madder}"
    rounded: "{rounded.r}"
    height: "48px"
  vote-no-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.r}"
    height: "48px"
  vote-big:
    height: "56px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.r}"
    padding: "10px 12px"
    height: "48px"
  header:
    backgroundColor: "{colors.madder}"
    textColor: "{colors.on-madder}"
    height: "56px"
  mark-yes:
    backgroundColor: "{colors.madder-tint}"
    textColor: "{colors.madder}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "2px 8px"
  mark-no:
    backgroundColor: "{colors.linen-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "2px 8px"
  name-chip:
    backgroundColor: "{colors.linen-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.r}"
    padding: "4px 10px"
  panel:
    backgroundColor: "{colors.linen-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "16px"
  flash:
    backgroundColor: "{colors.madder-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "20px"
  weave-unit:
    backgroundColor: "{colors.linen-2}"
    height: "12px"
    width: "24px"
  weave-unit-on:
    backgroundColor: "{colors.madder}"
  weave-unit-reached:
    backgroundColor: "{colors.ok}"
---

# Design System: Koris

## Overview

**Creative North Star: "The Woven Belt"**

Koris treats attendance as cloth being made. Every event carries a band of units, one per singer the event needs, and each "Būšu" weaves one more unit in madder until the band closes at its minimum and turns forest green. The count is always exact ("4 no 20", "7 būs"); there is no percentage anywhere in the system. The band is the one image the whole product is built around, and everything else stays plain so it can be read on sight.

The material is a Latvian woven belt (josta) laid on unbleached linen: a linen ground, near-black ink, and madder red, with forest green held back for the moment an event is certain. The madder header is a strip of that belt, and its lower edge is cut into a woven selvage of points and diamond eyes. One sturdy grotesque sets everything from the 44px tally numeral to the 13px month under a date. Surfaces are flat cloth: no cards, no shadows, only hairline rules between rows and quiet linen panels for asides.

The register is Operate: dense enough to answer three events without scrolling far, large enough for older singers on phones (48px minimum targets, 17px body). Light and dark themes follow the device; dark mode turns the linen to a warm near-black and lifts the madder so it still reads as dye, not warning.

**Key Characteristics:**
- Three values (linen, ink, madder) plus forest green reserved for the reached state.
- The woven band: one unit per singer, filled units carry a linen diamond eye, long bands wrap into equal rows of at most 25.
- A madder header band ending in a woven selvage strip.
- One grotesque, Schibsted Grotesk, at every level; tabular numerals for every count.
- A 4px weave-pick spacing grid; one 3px corner; hairline rules instead of borders and shadows.
- Status never by colour alone: every state pairs its colour with a word and an icon.

## Colors

A three-value dye palette on unbleached linen: warm, low-chroma neutrals, one saturated madder, and a single forest green that appears only when an event will happen.

### Primary
- **Madder Red** (oklch(46% 0.165 27)): the dye of the belt. Fills the header band, the primary button, the pressed "Būšu" vote, every woven unit already answered, the focus ring, text selection, the caret and today's date block. Also the voice of errors and the "Dzēst" link: madder is the colour that asks for attention. In dark mode it lifts to oklch(60% 0.17 27), madder used as text lifts further to oklch(72% 0.14 27), and the header deepens to oklch(37% 0.13 26) so its light text holds contrast.
- **Pressed Madder** (oklch(39% 0.145 26)): hover and press state of madder fills only.
- **Madder Wash** (oklch(92% 0.03 25)): a tint of madder, not a fourth value. Ground for the member's own "Būšu" mark and for the confirmation flash after the director creates an event or sends a reminder.

### Secondary
- **Forest Green** (oklch(44% 0.1 150)): the reached state. Fills the units of a band that has met its minimum and colours the "Notiks" status with its check. In dark mode it lifts to oklch(74% 0.13 150).

### Neutral
- **Unbleached Linen** (oklch(95.5% 0.006 90)): the page ground, and the colour of the diamond eye cut into every filled weave unit.
- **Linen Fold** (oklch(92.5% 0.009 85)): the second linen. Empty weave units, name chips, the "Nebūšu" mark, notice and notification panels, and the hover fill of outline buttons.
- **Bleached Field** (oklch(98.5% 0.004 90)): text inputs only, a lighter patch so a field reads as somewhere to write.
- **Thread Hair** (oklch(83% 0.012 70)): hairline rules between rows and above the footer, the inset outline of empty weave units, the resting stroke of inputs, the scrollbar thumb.
- **Ink** (oklch(22% 0.014 35)): all primary text, outline button strokes, and the fill of the pressed "Nebūšu" vote.
- **Faded Ink** (oklch(43% 0.014 35)): secondary text: time and place, months, counts beside headings, hints, placeholders, the footer.
- **Unbleached on Madder** (oklch(97.5% 0.008 85)): text and icons on madder fills and in the header.

### Named Rules
**The Three Values Rule.** The palette is linen, ink and madder. Linen Fold, Bleached Field, Faded Ink and Madder Wash are shades of those three, never new hues. Adding a blue, a yellow or a grey with its own temperature breaks the cloth.

**The Notiks Green Rule.** Forest green appears only on a band that has reached its minimum and on the "Notiks" status beside it. Never on buttons, links, success messages or confirmations; those stay madder or linen.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Schibsted Grotesk (same stack)

**Character:** One sturdy, slightly condensed grotesque, self-hosted as a 400–900 variable font in latin and latin-ext subsets so Latvian diacritics (ā, ē, ģ, ķ, ļ, ņ, š, ž) render in the same face. Hierarchy comes from weight and size only; intermediate weights (650, 750) are used deliberately to step between levels without changing face.

### Hierarchy
- **Numeral** (800, 2.75rem, 1, -0.03em, tabular): the yes-count on an event page, beside its "būs" or "no 20".
- **Display** (800, 2.25rem, 1.15, -0.02em): the event title on its own page.
- **Headline** (800, 1.75rem, 1.15, -0.02em): page titles ("Gaida tavu atbildi", "Kā tevi sauc?", "Jauns pasākums").
- **Date** (800, 1.625rem, 1, -0.02em, tabular): the day number in a row's date block.
- **Section** (750, 1.3125rem, 1.25, -0.01em): second-level headings ("Tavas atbildes", "Vai būsi?").
- **Title** (700, 1.1875rem, 1.25): event titles in list rows; the choir name in the header sits at 800, 1.25rem.
- **Body** (400, 1.0625rem, 1.5): running text and inputs. Ledes cap at 36ch.
- **Body small** (400, 0.9375rem): meta lines, band text, name chips, hints, footer.
- **Label** (650, 0.9375rem): field labels and marks; buttons use 650 at body size.
- **Caption** (650, 0.8125rem, 1): the month under a date number.

### Named Rules
**The One Grotesque Rule.** Every level, from the tally numeral to the month caption, is Schibsted Grotesk. No second face, no system display face, no monospace for numbers; counts get tabular figures instead.

**The Exact Count Rule.** Counts are written as numbers of people: "4 no 20", "7 būs", "Trūkst vēl 16". Never a percentage, never a ratio bar, and every count beside a heading is a bare Faded Ink numeral at 0.8em and 600.

## Layout

A single centred column, max 40rem wide, with a 16px gutter on phones and 24px from 480px up. Everything is one column at every width; the desktop view is the phone view with more linen around it.

Spacing runs on a 4px weave-pick grid (`--u: 4px`), written as multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48. Half-picks (6px, 10px) appear only inside small things: chip and field padding, icon gaps. The header sits 40px above the first heading; second-level headings take 48px above and 12px below; list rows are 20px top and bottom with a 3rem date column and a 16px gap.

Event rows are a two-column grid: a centred date block, then title, meta line, woven band, and either the two vote buttons or the member's mark. The vote pair is always two equal columns with an 8px gap, filling the row's width so the primary answer sits at thumb height. Form fields stack at 20px with a 28rem cap; the date/time pair collapses to one column below 340px.

### Named Rules
**The Weave-Pick Rule.** Every margin, padding and gap between components is a multiple of 4px. The only exceptions are the woven band's own geometry (units, gaps and the header selvage are drawn in fixed pixels) and half-picks inside chips and fields.

## Elevation & Depth

The system is flat cloth. There are no drop shadows. Depth is conveyed by tone (linen ground, Linen Fold panels, a lighter Bleached Field for inputs) and by hairline rules. `box-shadow` is used only as an inset hairline, so rules can be thinner than a CSS pixel on dense screens.

### Shadow Vocabulary
- **Row rule** (`box-shadow: inset 0 var(--hair-w) 0 var(--hair)`): the hairline above each list row after the first and above the footer.
- **Unit outline** (`box-shadow: inset 0 0 0 var(--hair-w) var(--hair)`): the outline of an empty weave unit; removed once the unit is filled.

`--hair-w` is 1px, 0.5px at 2dppx and 0.34px at 3dppx, so every hairline lands at one device pixel.

### Named Rules
**The Flat Cloth Rule.** Nothing floats. No drop shadows, no offset shadows, no blur. A surface is separated by a tone of linen or a hairline, never by lift.

## Shapes

Squared corners softened to a single 3px radius (`--r`): buttons, inputs, marks, name chips, panels, flashes and the focus ring all share it. Weave units are sharp rectangles with a diamond eye clipped into their centre when filled. The header's lower edge is a repeating 16px by 10px selvage: a downward point every 16px with a diamond eye cut through it, drawn as a mask in the header's own colour. The diamond recurs as the footer separator (a 5px square turned 45°) and in the app icon, a madder square with nested linen and madder diamonds.

### Named Rules
**The 3px Rule.** One radius. Nothing is pill-shaped and nothing is rounder than 3px; weave units take no radius at all.

## Components

### Buttons
Sturdy and outlined, like a stitched edge.
- **Shape:** softened square (3px), 48px minimum height, 16px side padding, 1.5px Ink stroke, weight 650.
- **Default (outline):** transparent on linen, Ink text and stroke. Hover fills Linen Fold.
- **Primary:** Madder fill and stroke, Unbleached text; hover and press go to Pressed Madder. One per form ("Turpināt", "Ieiet", "Izveidot un saņemt saiti").
- **Small:** 44px high, 12px padding, 0.9375rem, for copy and share actions.
- **Press / Disabled:** press nudges the button down 1px; disabled is 50% opacity. Colour changes ease out over 150ms and stop under reduced motion.
- **Focus:** 2px Madder outline at 2px offset, 3px radius, on every interactive element.

### Vote pair
The one action members come for.
- **Layout:** two equal full-width columns, 8px apart: "Būšu" with a check, "Nebūšu" with a dash, both inline SVG icons at 18px.
- **Unanswered:** both outline buttons.
- **Answered:** "Būšu" pressed fills Madder; "Nebūšu" pressed fills Ink with linen text. State is carried by `aria-pressed`.
- **Event page:** grows to 56px high, 1.125rem, 20px icons.

### Woven band (signature)
- **Units:** one per singer the event needs, flex-shared up to 24px wide and 12px tall with 2px gaps (36px by 20px with 3px gaps on the event page).
- **Empty unit:** Linen Fold with an inset Thread Hair outline.
- **Filled unit:** Madder with a linen diamond eye inset 3px top and bottom (5px on the event page).
- **Reached:** every filled unit turns Forest Green; the band text reads "7 būs" with a green check and "Notiks".
- **Wrapping:** above 25 units the band splits into equal rows (5px apart, 6px on the event page); the last row is padded with invisible units so every unit keeps one width.
- **Text:** a bold tabular count then status in Faded Ink ("Trūkst vēl 8"). Exposed as one image with a spoken label ("Būs 4 no vajadzīgajiem 20").

### Header band
- **Style:** Madder band, 56px minimum, safe-area aware. Choir name left at 800/1.25rem; member name right at 600 with a "Cits vārds" ghost button (1px stroke at 50% of the header text, 14% wash on hover, 44px high).
- **Selvage:** the woven 10px strip hangs below the band in the same colour.

### Marks and chips
- **Member's mark:** shown on answered rows in place of the vote pair. "Būšu" is Madder text on Madder Wash; "Nebūšu" is Faded Ink on Linen Fold; both carry their icon, 2px by 8px padding, 3px radius, followed by a "Mainīt" link.
- **Name chips:** Linen Fold, 4px by 10px, body small, wrapping with 6px gaps under "Būs" and "Nebūs" headings.

### Lists / rows
- **Corner Style:** none; rows are not cards.
- **Background:** the page linen.
- **Shadow Strategy:** hairline row rule only (see Elevation & Depth).
- **Date block:** day number in Date type over a Caption month, centred in a 3rem column; today's block turns Madder.

### Inputs / Fields
- **Style:** Bleached Field ground, 1.5px Thread Hair stroke, 3px radius, 48px minimum, 10px by 12px padding. Labels sit 6px above in Label type; optional fields add a Faded Ink "neobligāti".
- **Hover:** the stroke darkens halfway toward Faded Ink.
- **Focus:** stroke and a 2px outline both turn Madder.
- **Error:** Madder stroke with a 600-weight Madder message below.

### Panels
- **Notice and notification strip:** Linen Fold, 16px padding, 3px radius; the notification strip leads with a 20px Madder bell.
- **Flash:** Madder Wash, 20px padding, for confirmations to the director.

### Navigation
- **Style:** there is no nav bar. The header's choir name links home; the footer, above a hairline in Faded Ink at body small, carries the director link and logout, separated by a turned-square dot. Text links are Ink, underlined at 1px with a 3px offset, and turn Madder on hover. "Pagājušie pasākumi" folds behind a disclosure with a CSS chevron that turns 90° over 150ms.

## Do's and Don'ts

### Do:
- **Do** show attendance as the woven band: one unit per singer needed, filled in Madder, closed in Forest Green at the minimum.
- **Do** write counts as people ("4 no 20", "Trūkst vēl 16") in tabular figures.
- **Do** keep every gap a multiple of 4px and every corner at 3px.
- **Do** pair every status colour with a word and an inline SVG icon ("Notiks" with a check, "Būšu" with a check, "Nebūšu" with a dash).
- **Do** keep answer buttons and form controls at 48px high (56px on the event page) and small action buttons and row actions at 44px.
- **Do** separate rows with the inset hairline, and asides with a Linen Fold panel.

### Don't:
- **Don't** draw a percentage, a progress bar or a grey RSVP card; that is the category default this system refuses.
- **Don't** use Forest Green anywhere but a reached band and its "Notiks" status.
- **Don't** add a hue outside linen, ink and madder, or tints of them.
- **Don't** add a second typeface, a system display face, or uppercase letter-spaced labels above headings.
- **Don't** use drop shadows or offset shadows, gradients, gradient text, or coloured side stripes on panels.
- **Don't** box event rows into cards or round anything past 3px.
- **Don't** use emoji or text glyphs as icons; icons are inline SVG in currentColor.
