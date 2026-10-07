## 1. Repo, packaging and build (Slice 1)

- [x] 1.1 Root `package.json` (name `astryx-theme-studio`, `type: module`, `workspaces: ["examples/*"]`, `exports` with `./dev`, `sideEffects: false`, peer deps react/react-dom >=19 and `@astryxdesign/core` ^0.6.5), `tsconfig.json`, fix `.gitignore` (node_modules, dist, .claude; remove typo'd spec entry)
- [x] 1.2 Add dev deps: react, react-dom, `@astryxdesign/core`, `@stylexjs/stylex`, typescript, tsup, vitest, jsdom
- [x] 1.3 `tsup` config building ESM + `.d.ts` for `src/dev/entry.ts`; `prepare` script runs the build
- [x] 1.4 Verify git-install flow: `npm pack` the repo, install the tarball in a scratch Vite app and confirm `dist` and types resolve (done via a local `git+file://` commit of a clean copy: `prepare` built `dist/`, types and the Vite plugin resolved in a fresh app; retest from the GitHub URL under 8.3 once pushed)
- [x] 1.5 Production fail-safe in `dev/entry`: early return unless `import.meta.env?.DEV === true`; unit test that no DOM, storage read or listener occurs when disabled

## 2. Example app (Slice 1)

- [x] 2.1 Scaffold `examples/vite-app` (Vite, React 19, `@astryxdesign/core`, StyleX Vite plugin, react-router) depending on `astryx-theme-studio` via workspace
- [x] 2.2 Build Dashboard, Customers, Settings routes using Card, Button, Input, Table; add a Modal/Popover (portal), a nested `<Theme>` region, and a light/dark toggle
- [x] 2.3 Add `src/dev/mountAstryxThemeStudio.tsx` and the `import.meta.env.DEV` dynamic import in `main.tsx` exactly as in the README
- [x] 2.4 `verify-prod` script: `vite build`, then fail if any studio marker string is found in `dist/`; prove it fails with a deliberate static import, then revert

## 3. Spikes (resolve before dependent work)

- [x] 3.1 S1: in the example app, test forcing dark/light preview (html `data-theme`, wrapper `color-scheme` override, or no forcing); record the chosen approach in `design.md`
- [x] 3.2 S2: test whether `html`-level overrides reach elements inside a nested `<Theme>`/`MediaTheme`; record result and required selectors in `design.md`
- [x] 3.3 S3: identify which tokens are produced by `expand*Scale`/`typography.scale`; decide UI warning and export treatment; record in `design.md`

## 4. Token registry (Slice 1)

- [x] 4.1 `core/token-registry`: import `tokenDefaults`, build entries
- [x] 4.2 `light-dark()` parser with balanced-paren splitting; tests using the real `tokenDefaults` (count equals key count, rgba cases, single-value tokens)
- [x] 4.3 Category and value-type inference from names/values; tests that every token lands in a category (fallback "Other")
- [x] 4.4 Optional static description metadata map; registry works with it empty
- [x] 4.5 Astryx version detection and supported-range check with warning state; test unsupported version path
- [x] 4.6 Seed "original" values from the host's active theme if retrievable (resolve open question; otherwise Astryx defaults)

## 5. Working theme, preview and persistence (Slice 1)

- [x] 5.1 `core/theme-state` store: light/dark maps, modified set, originals, mode; subscribe API; tests
- [x] 5.2 Value validators per type (colour, length, number, duration, easing, font-family, raw fallback)
- [x] 5.3 Override injector: single unlayered `<style data-astryx-theme-studio>` emitting `html { --token: light-dark(L, D) }` for modified tokens; remove on dispose; test restores original with no DOM changes to the app
- [x] 5.4 Apply the S1/S2 outcomes (mode preview behaviour, nested theme selectors)
- [x] 5.5 History: command stack with coalescing and size cap; undo/redo tests
- [x] 5.6 Reset (token/category/light/dark/all) with confirmation hook for multi-token resets
- [x] 5.7 `persistence/local-storage`: versioned payload with Astryx version, debounced write, configurable on/off, restore prompt model (Continue/Discard), never active when disabled; tests

## 6. Studio UI shell (Slice 1)

- [x] 6.1 Mount: host element, open Shadow DOM, separate React root, adoptable stylesheet, `--ats-*` variables only
- [x] 6.2 Isolation tests: grep UI CSS for Astryx token names; Playwright check that editing surface token leaves the panel unchanged and host `button {}` rules don't leak
- [x] 6.3 Launcher: movable, collapsible, tooltip, persisted position
- [x] 6.4 Panel: left/right docking, floating, resize, collapse, close, remembered geometry
- [x] 6.5 Tabs (Theme / Inspect / Impact / Export) with Inspect and Impact shown as coming-soon until their slices land
- [x] 6.6 Theme tab: category list with counts, search (name, category, description, value), Modified filter, collapsible categories with lazily rendered editors (a virtualised list proved unnecessary for ~258 rows; see design notes)
- [x] 6.7 Editors: colour picker + HEX, length/number with units, enum selector where applicable, raw fallback; original-vs-working display and per-token reset; modified indicator
- [x] 6.8 Light/Dark switch, undo/redo buttons, theme metadata fields (name, auto ID, description, author)
- [x] 6.9 Configurable keyboard shortcuts with listener cleanup on unmount
- [x] 6.10 Restore prompt UI (Continue Editing / Discard)

## 7. Export (Slice 1)

- [x] 7.1 `exporters/astryx`: generate `defineTheme({ name, tokens })` with tuples, modified-only default and complete option; version-keyed import path table; snapshot tests
- [x] 7.2 `exporters/json`: schema, `schemaVersion`, round-trip serialiser/parser; tests
- [x] 7.3 Basic validation (unknown token, malformed value, incomplete light/dark pair, version mismatch) and theme health summary
- [x] 7.4 Export panel: summary by category, Copy Theme Code, download file(s), export package files (`<id>Theme.ts`, `.theme.json`, `metadata.json`, README)
- [x] 7.5 Verify an exported theme works: a unit test feeds the exported token map to the real `defineTheme`/`generateThemeCSS` and asserts the declarations equal the studio's preview CSS

## 8. Documentation and Slice 1 acceptance

- [x] 8.1 README: installation (git URL), Vite setup, why dynamic import, running dev, production verification, workflow, production guarantee
- [x] 8.2 Playwright smoke suite on the example app: launcher in dev, edit persists across routes, refresh restore, export output, absent in `preview` build
- [ ] 8.3 Install into the production app from the GitHub URL on a branch and confirm launcher in dev and absence in prod build _(needs the production app and a pushed repo; the git-install flow itself was verified from a local git URL, see 1.4)_

## 9. Inspect mode (Slice 2)

- [x] 9.1 Overlay layer host (pointer-events none), rAF-driven rectangle positioning from `getBoundingClientRect()`, started and stopped with mode
- [x] 9.2 Element selector: capture-phase hover/click listeners attached only while Inspect is on; Escape exits; verify app handlers don't fire for the inspecting click
- [x] 9.3 Component detector: `astryx-*` stable class and `data-astryx-*` state; "not identified" fallback; test against example app components
- [x] 9.4 Token detector: stylesheet walker (recursing `@layer`, `@media`, `@supports`, `@scope`, `adoptedStyleSheets`), `matches()` filtering, `var()` extraction with alias resolution, intersection with registry; unreadable-sheet reporting
- [x] 9.5 Property classification (theme token / component prop / Astryx internal / application style)
- [x] 9.6 Inspect panel: selected component header, tokens grouped by category with in-place editors
- [x] 9.7 Tests: DOM untouched after select, listeners fully removed on exit/unmount

## 10. Impact mode (Slice 3)

- [x] 10.1 `core/impact-engine`: per-token selector index (direct and alias), cache keyed by stylesheet signature, `<head>` MutationObserver invalidation
- [x] 10.2 Visible-consumer query with visibility filtering; component grouping via the component detector
- [x] 10.3 Impact panel: Show Impact button on tokens, count, per-component summary, click-to-scroll-and-highlight, optional dimming of non-affected
- [x] 10.4 Per-route observed-impact index (dev-only, excluded from export); Visible vs Known Application Impact display
- [x] 10.5 Profiling log above threshold; on-demand sentinel-diff Verify button (reports changing / state-only / extra elements)
- [x] 10.6 Tests on fixture DOM and example app; lifecycle cleanup tests

## 11. Validation, import and polish (Slice 4)

- [x] 11.1 Full validation set (invalid units, duplicates, deprecated tokens) and strict-mode configuration
- [x] 11.2 Contrast checks for text/surface token pairs with AA/AAA reporting and pre-export warnings
- [x] 11.3 JSON import: validate, diff view (current → imported), explicit Apply, never silent overwrite
- [x] 11.4 Full theme health panel
- [x] 11.5 Re-run production isolation check and full smoke suite; update README for new features
