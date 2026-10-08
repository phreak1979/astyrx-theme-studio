## Why

`dcp-ocean-blue.png` is a design mockup for "DCP Studio" (palette, alerts, form elements, light and dark dashboards). There is no Astryx theme matching it, and the demo app cannot show one off. We want a theme that reproduces the mockup as exactly as the Astryx theming system allows, proven by a demo dashboard that looks like the mockup and by a documented way to drop the theme into other apps.

## What Changes

- Add a `dcpOceanBlueTheme` (`defineTheme`) with light and dark values from the mockup palette (Deep Space Blue `#0E354F`, Air Force Blue `#5490B8`, Charcoal Blue `#323949`), Inter typography, radii and shadows, plus component overrides for alerts/banners, status badges, progress bars, toggles, checkbox and radio.
- Rebuild the demo app's Dashboard as the "DCP Studio" layout: dark navy sidebar (dark in both modes), search/notification/user header, four KPI cards with donut rings, production-progress bar chart, recent-activity feed and programmes table.
- Add alert/notification examples (info, warning, success, error; light and dark) and a buttons & form-elements showcase, matching the mockup's top row.
- Replace the demo's toy `ocean` theme switch with a DCP Ocean Blue switch alongside the existing Dark mode switch.
- Export the finished theme through Theme Studio as a single copy-paste `dcpOceanBlueTheme.ts` and document how to package and consume it (README section).
- Verify visually by screenshotting light and dark and comparing side by side with the mockup.

## Capabilities

### New Capabilities
- `dcp-ocean-blue-theme`: the theme itself (tokens, component overrides, fonts) and its copy-paste packaging/usage documentation.

### Modified Capabilities
- `example-app`: adds the DCP Studio dashboard layout, alert examples and form-element showcase to the demo, and the theme switch.

## Impact

- New: `examples/vite-app/src/theme/dcpOceanBlueTheme.ts`, dashboard components (sidebar, KPI card, donut, bar chart, activity feed), a showcase page.
- Changed: `examples/vite-app/src/App.tsx`, `pages/Dashboard.tsx`, `styles.css`, `main.tsx` (Inter font), `README.md`.
- Dependencies: Inter via `@fontsource-variable/inter` in the example app only. No chart library; charts are hand-drawn SVG.
- Studio source (`src/`) unchanged; existing e2e tests referencing the Dashboard may need updating.
