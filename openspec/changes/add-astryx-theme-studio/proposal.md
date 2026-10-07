## Why

Theming an Astryx app today means editing token maps blind and reloading to see the result. There is no way to see which tokens a control uses, what a token change touches, or to export the outcome as a valid `defineTheme` call. We want a development-only visual theming tool that works inside the real app, installable from this GitHub repo, with zero footprint in production Vite builds. The full product is specified in `astryx-theme-studio-spec.md`; this change delivers it in slices, the first of which is independently usable.

## What Changes

- New npm package (this repo, installable via `npm install -D github:phreak1979/astyrx-theme-studio`) exposing a `./dev` entry; peer deps `react`/`react-dom` >=19 and `@astryxdesign/core` ^0.6.5.
- npm-workspaces layout: library at the repo root, plus `examples/vite-app` — a real Astryx + Vite app used to test the studio before installing it in production.
- Token registry built at runtime from the installed Astryx's exported `tokenDefaults` (parsing `light-dark(a, b)` into light/dark pairs), so the token set always matches the installed version.
- Live preview by injecting a single unlayered `<style>` of token overrides on `html`; no component CSS rewriting, no DOM mutation of the host app.
- Studio UI rendered in its own root inside a Shadow DOM, styled with plain CSS and its own variable names (no Astryx components), so edited tokens never restyle the studio.
- Central working theme with light/dark values, modified tracking, original-vs-working values, reset, undo/redo, route-independent state, and localStorage persistence (dev only).
- Export as `defineTheme({...})` TypeScript plus Theme Studio JSON; JSON import with validation and diff preview.
- Inspect mode (select an element, show Astryx component via stable `astryx-*` classes and the public tokens it consumes) and Impact mode (highlight visible token consumers via a CSSOM `var(--token)` scan), using an independent overlay layer.
- Production isolation: host loads the studio only through `if (import.meta.env.DEV) import(...)`; the package also fails safe to a no-op when `import.meta.env?.DEV` is not true.
- Delivery slices: **1** packaging + example app + registry + live override + Theme tab + persistence + export; **2** Inspect; **3** Impact; **4** validation, import, undo/redo polish. Three spikes gate the design: dark-mode preview vs. `<Theme>`-owned `color-scheme`, nested `<Theme>`/`MediaTheme` shadowing of root overrides, and generated scale tokens (`typography.scale`, `expand*Scale`).

## Capabilities

### New Capabilities
- `studio-packaging`: Package layout, `./dev` entry, build via tsup in `prepare` for git installs, peer deps, workspace layout, dev-only dynamic loading and production fail-safe.
- `example-app`: `examples/vite-app` with multiple routes, portals, nested themes and light/dark, used as the studio's test bed.
- `token-registry`: Version-matched registry of all public Astryx tokens derived from `tokenDefaults`, with categories, types, light/dark defaults and compatibility warnings.
- `live-theme-preview`: Working theme state, unlayered override injection, light/dark preview, cross-route and refresh persistence, undo/redo, reset.
- `studio-ui`: Isolated Shadow DOM panel and launcher, token search/filter, type-appropriate editors, modified tracking, shortcuts.
- `theme-export-import`: Validation, `defineTheme` and JSON export, JSON import with diff preview.
- `element-inspector`: Inspect mode, non-invasive overlay, component and token detection, editable-vs-informational classification.
- `impact-analysis`: Show Impact for current-page consumers of a token, with highlighting and summary.

### Modified Capabilities

(none — greenfield repo, no existing specs)

## Impact

- New code across the repo root (`src/`, `package.json`, `tsup` config) and `examples/vite-app/`.
- Dependencies: dev-time `react`, `react-dom`, `@astryxdesign/core`, `@stylexjs/stylex`, `vite`, `react-router`, `tsup`, `typescript`, a test runner; runtime peer deps only for consumers.
- No changes to consuming apps beyond adding `src/dev/mountAstryxThemeStudio.tsx` and a dev-only import in `main.tsx`.
- Relies on Astryx internals that are public but young (0.x): `tokenDefaults`, `defineTheme`, `astryx-*` class and `data-astryx-*` attribute conventions. A version-compatibility warning is part of the scope.
