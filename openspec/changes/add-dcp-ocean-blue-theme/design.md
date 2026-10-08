## Context

The demo app (`examples/vite-app`) has a top nav, three pages, and an inline 3-token `oceanTheme`. The mockup is a full app design, which splits into three layers:

```
THEME tokens ──► palette, text, borders, radius, shadows, status colours (light + dark)
COMPONENT overrides ─► banner/alert tints, badges, progress, toggle/checkbox/radio
APP layout ──► sidebar, KPI cards + rings, bar chart, activity feed, table
```

Astryx tokens flip per mode (`[light, dark]` pairs), but the mockup's sidebar is dark navy in light mode too. Astryx has no chart component. Reliable colour values exist only for the three printed hex codes; everything else must be sampled from the image.

## Goals / Non-Goals

**Goals:**
- A theme that reproduces the mockup's colours, buttons, inputs, alerts and surfaces in light and dark.
- A demo dashboard visually matching the mockup in both modes, with alert and form-element showcases.
- A single copy-paste theme file plus usage docs.

**Non-Goals:**
- An npm-published theme package (copy-paste only for now).
- Changes to Theme Studio source.
- Real data, a chart library, or functional search/date-range controls (visual only).
- Pixel-perfect rendering of the mockup's raster image; target is "matches by side-by-side review".

## Decisions

1. **Theme file is the single source of truth.** Implemented as a hand-maintained `dcpOceanBlueTheme.ts`: Theme Studio exports tokens only, so the `typography` and `components` blocks cannot come from an export. Tokens can still be tuned in the Studio and merged back.
2. **Always-dark sidebar via a nested dark `<Theme mode="dark">` around the sidebar.** Keeps it on theme tokens, so token edits still affect it. Alternative: app CSS with fixed colours; rejected because it bypasses the theme and the Studio.
3. **Charts and donut rings as small inline SVG components** reading theme tokens (`var(--color-accent)` etc.). Alternative: a chart library; rejected as a new dependency for one demo.
4. **Inter via `@fontsource-variable/inter`, imported in the example's `main.tsx`;** theme sets `typography.body/heading.family: 'Inter'`.
5. **Colour sampling:** derive unprinted colours (dark page, cards, sidebar, secondary button, alert tints) by sampling flat regions of the mockup programmatically, record them in the theme, and review visually. Printed hex values are used verbatim.
6. **Alerts via Astryx `Banner`** with per-status component overrides (as Neutral does), rather than custom markup, so they remain themeable.
7. **Switch:** replace the toy `ocean` switch with "DCP Ocean Blue"; default stays Neutral so existing behaviour and tests are intact.

## Risks / Trade-offs

- [Dark-in-light sidebar needs a nested Theme; Studio edits apply globally] → nested Theme reuses the same theme object, only mode differs; verify with Studio.
- [Sampled colours are approximate] → compare screenshots side by side; adjust tokens; ask for the design file if a value is unclear.
- [Banner/Badge/Toggle may not expose every visual in the mockup (e.g. inline "View details" action, close button)] → check component props first; fall back to a composed layout inside the theme-styled container and note deviations in the README.
- [Existing e2e tests target the old Dashboard] → update them as part of the work.
