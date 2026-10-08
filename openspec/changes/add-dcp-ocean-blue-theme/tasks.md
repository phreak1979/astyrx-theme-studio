## 1. Colour extraction

- [x] 1.1 Sample flat regions of `dcp-ocean-blue.png` (page, card, sidebar, secondary button, alert tints, borders, text) for light and dark; record values in a scratch table
- [x] 1.2 Add `@fontsource-variable/inter` to `examples/vite-app` and import it in `main.tsx`

## 2. Theme

- [x] 2.1 Create `examples/vite-app/src/theme/dcpOceanBlueTheme.ts` with palette, text, border, radius, shadow and Inter typography tokens
- [x] 2.2 Add component overrides for banner statuses, status badges, progress bar, switch, checkbox and radio
- [x] 2.3 Wire theme into `App.tsx` replacing the toy `oceanTheme`, with a "DCP Ocean Blue" switch (Neutral default)

## 3. Demo layout

- [x] 3.1 Build the always-dark sidebar (nested dark `<Theme>`) and app shell with header
- [x] 3.2 Build KPI cards with SVG donut rings
- [x] 3.3 Build the production-progress SVG bar chart with legend
- [x] 3.4 Build the recent-activity list and programmes table (progress bars, status pills, row menus)
- [x] 3.5 Add the showcase route with alerts (light + dark) and buttons & form elements

## 4. Tuning and verification

- [x] 4.1 Tune tokens against the mockup, light and dark (done by direct editing plus screenshots; Theme Studio exports tokens only)
- [x] 4.2 Screenshot light and dark and compare side by side with the mockup; fix differences, record unavoidable ones
- [x] 4.3 Commit the theme source file (hand-maintained; typography and components blocks are not part of the Studio export)
- [x] 4.4 Update affected e2e tests; run `npm test`, `npm run typecheck`, `npm run example:build` and `npm run example:verify-prod`

## 5. Documentation

- [x] 5.1 Add README section: copy the file, wrap in `<Theme>`, install Inter, optional `astryx theme build`
- [x] 5.2 Record known deviations from the mockup in the README
