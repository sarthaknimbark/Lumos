---
name: Obsidian Precision
colors:
  surface: '#11131a'
  surface-dim: '#11131a'
  surface-bright: '#373941'
  surface-container-lowest: '#0c0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e2ec'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e2e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ffb2b7'
  on-secondary: '#67001b'
  secondary-container: '#b50036'
  on-secondary-container: '#ffc2c4'
  tertiary: '#7bd0ff'
  on-tertiary: '#00354a'
  tertiary-container: '#009bd1'
  on-tertiary-container: '#002d40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#11131a'
  on-background: '#e2e2ec'
  surface-variant: '#33343c'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an intimate, ultra-refined digital vault for subjective reflection, daily chronologies, and sensory memory capture. It merges the poetic privacy and emotional cadence of an heirloom leather-bound journal with the technical rigor, machined tolerances, and tactile precision of high-end hardware synthesis tools and developer instrumentation.

The visual direction synthesizes three primary influences:
- **Atmospheric Restraint:** Deep pitch surfaces, edge-to-edge quietness, and generous spatial isolation derived from modern private journaling environments.
- **Machined Utility:** Crisp hairline separations, monospaced metadata, tight tracking, and structured toolbars reminiscent of precision developer tools.
- **Instrument Tactility:** Physical feedback cues, purposeful color coding for sensory data capture (audio inputs, ambient notes, chronometric markers), and high-density technical controls evocative of Teenage Engineering field hardware.

The design avoids whimsical flourishes, skeuomorphic leather textures, and expressive emoji palettes. Instead, it frames user thoughts, recorded audio waveforms, and imagery as high-fidelity archival artifacts preserved inside a darkened, distraction-free sensory studio.

## Colors

The palette operates strictly in a deep-spectrum dark mode optimized for OLED screens, low-light reflection, and late-night introspection without visual fatigue.

### Core Canvas & Surfaces
- **Canvas Pitch (`#08090C`):** Base canvas background, grounding the viewport with near-infinite optical depth.
- **Surface Level 1 (`#11131A`):** Primary card, entry pane, and module container surface.
- **Surface Level 2 (`#171A24`):** Elevated media surfaces, interactive audio playback trays, and floating input docks.
- **Subtle Surface (`#1F2330`):** Embedded chips, micro-controls, timeline notches, and nested blocks.

### Precision Accents
- **Precision Iris (`#6366F1`):** Primary focus indicator, active text selection, primary action states, and temporal tags.
- **Studio Rose (`#F43F5E`):** Real-time recording, live input signals, critical timeline captures, and irreversible states.
- **Acoustic Sky (`#38BDF8`):** Sonic data visualizations, amplitude bars, frequency spectra, and weather/sensor metadata.
- **Memory Amber (`#FBBF24`):** Milestones, golden hour entries, starred thoughts, and retrospective highlights.

### Borders & Delimiters
- **Hairline Border:** `rgba(255, 255, 255, 0.08)` applied universally to cards and controls.
- **Active Border:** `rgba(99, 102, 241, 0.40)` for selected items.
- **Muted Divider:** `rgba(255, 255, 255, 0.04)` for horizontal structural gridlines.

## Typography

The typographic hierarchy enforces clear functional boundaries across three specialized type families:

1. **Space Grotesk (Headlines & Display):** Provides architectural character and understated technical elegance. Tracked tightly (`-0.02em` to `-0.03em`) to mimic milled mechanical typography.
2. **Inter (Prose & Reflection):** Deployed exclusively for journal text, personal reflections, and long-form narrative input. Generous `lineHeight` (1.65×) promotes sustained legibility and contemplative writing flow.
3. **JetBrains Mono (Metadata, Timestamps & Indices):** Renders all contextual coordinates, elapsed audio timers, sensory data (ambient decibels, geo-coordinates, pulse), and state indicators. Strict tabular figures (`tnum`) guarantee zero jitter during real-time timeline scrolling and recording counters.

## Layout & Spacing

The layout philosophy treats the interface as a precision drafting table. A strict mathematical 8-pixel base unit governs internal component rhythm, while structural outer gutters adapt fluidly between device profiles.

### Responsive Breakpoints & Framing
- **Mobile (< 768px):** Single-column timeline stream. Structural margins set to `margin` (1rem). Navigation docks to a bottom-anchored hardware-inspired control strip.
- **Tablet (768px – 1024px):** 2-column asymmetric grid: index drawer / temporal bar on the left (280px), focused editing and entry canvas on the right. Margins increase to `margin-md` (2rem).
- **Desktop (> 1024px):** 3-tier console layout: 
  - Micro-telemetry & month calendar strip (80px)
  - Chronological memory queue (380px)
  - Focused memory studio (fluid max-width 780px centered workspace)
  - Outer viewport framing uses `margin-lg` (3.5rem) to preserve meditative negative space.

Horizontal and vertical grid guide markers may be surfaced using hairline rules to emphasize industrial precision without cluttering content reading paths.

## Elevation & Depth

Rather than relying on diffused, multi-directional shadows that dilute spatial clarity, this system articulates elevation through **tonal stratification and sharp hairline containment**:

1. **Level 0 (Canvas):** Pure `#08090C`. Absorbs light completely.
2. **Level 1 (Panels & Cards):** `#11131A` bounded by a strict `1px solid rgba(255, 255, 255, 0.08)` stroke. No box shadows.
3. **Level 2 (Active Workspaces & Floating Docks):** `#171A24` bordered by `1px solid rgba(255, 255, 255, 0.12)`, anchored by a sharp micro-drop shadow: `0px 4px 16px rgba(0, 0, 0, 0.60)`.
4. **Level 3 (Modal Sheets & Sensor Overlays):** Deep darkened blur backdrops (`backdrop-filter: blur(20px) saturate(140%) bg-black/60`) paired with a razor-thin top perimeter highlight: `inset 0px 1px 0px 0px rgba(255, 255, 255, 0.15)`.

This approach keeps every visual edge crisp, tactile, and machined.

## Shapes

The interface embraces a restrained radius language (`Soft` / level 1), evoking precision-milled aluminum hardware and instrumentation cases rather than consumer software bubbles.

- **Micro Controls & Chips:** `0.25rem` (4px).
- **Primary Surface Cards & Containers:** `0.5rem` (8px).
- **Floating Modals & Capture Bays:** `0.75rem` (12px).
- **Audio Scrubber Heads & Toggle Thumbs:** Pure circles (`9999px`) to maintain physical device affordance.

Corners are rendered with continuous curvature smoothing to eliminate optical artifacts along dark hairline perimeters.

## Components

### Buttons & Hardware Switches
- **Primary Action (Iris):** Solid `#6366F1` background, `#FFFFFF` text, `0.25rem` radius, typography `mono-sm`. On hover, subtle luminance step-up with zero layout shift.
- **Recording Button (Studio Rose):** Machined dual-state control. Idle: `#171A24` base with a centered 6px `#F43F5E` LED indicator. Active: pulsating `#F43F5E` perimeter ring, tabular elapsed timestamp, with tactile push depression (`transform: scale(0.97)`).
- **Ghost/Tertiary:** No fill, `1px solid rgba(255, 255, 255, 0.08)`, text `#94A3B8`. Lightens to `rgba(255, 255, 255, 0.18)` on hover.

### Hairline Cards & Memory Cells
- Fabricated from `#11131A` with a permanent `1px solid rgba(255, 255, 255, 0.08)` border.
- Header row hosts `label-caps` category badges, tabular timestamps (`mono-sm`), and a single mono-line anchor icon.
- Hover state raises border luminance to `rgba(255, 255, 255, 0.16)` without changing background fill or shifting position.

### Media & Acoustic Waveforms
- Audio modules use `#171A24` backgrounds.
- Waveform displays render as crisp `2px` vertical bars with `1px` spacing, dynamically tinted in `#38BDF8` with playback scrub tracking in pure white (`#FFFFFF`).
- Zero blurred gradients; audio meters behave like physical LED bar graphs.

### Inputs & Writing Canvas
- Plain text inputs avoid box-in-a-box containment. The reflective editor breathes directly on the background surface.
- Inline form fields employ a single baseline hairline rule: `1px solid rgba(255, 255, 255, 0.12)`, transitioning to `#6366F1` upon focus.
- Placeholder copy is styled in `Inter` italic with subdued contrast (`#475569`).

### Vector Iconography
- Strictly monochrome, 2px uniform stroke, 16×16px or 20×20px bounding box.
- Endcaps and corners are squared or lightly softened to match the industrial identity.
- No full-color emoji; user reactions and status markers utilize geometric glyphs, typographic flags, or mono-line iconography.